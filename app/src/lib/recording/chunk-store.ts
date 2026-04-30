/**
 * Tab-crash-safe chunk store for in-progress recordings.
 *
 * MediaRecorder fires `ondataavailable` periodically with a Blob slice. We
 * append each slice both to memory (for fast finalization) and to IndexedDB
 * keyed by recording-session id. If the tab crashes, refreshes, or loses
 * focus during a long live session, the chunks survive — we can offer a
 * "resume unfinished recording" banner on the next page load.
 *
 * Lifecycle:
 *   - `openRecording(id, meta)` — start a new recording session in IDB.
 *   - `appendChunk(id, blob)` — store one Opus slice. Cheap, no flush wait.
 *   - `finalizeRecording(id)` — read all chunks back as a single Blob.
 *   - `discardRecording(id)` — delete after a successful upload.
 *   - `listOpenRecordings()` — find any unfinished recordings on page load.
 *
 * Uses raw IndexedDB (no third-party deps). Two object stores:
 *   - `meta` — { id, startedAt, mimeType, clientCode, sessionDate }
 *   - `chunks` — { id (auto), recordingId, index, blob }
 *
 * IDB calls are quota-bounded by the browser (typically several GB). At
 * 32 kbps Opus we use ~4 KB/sec → ~14 MB/hour, well under any quota.
 */

const DB_NAME = 'sp-recordings';
const DB_VERSION = 1;
const META_STORE = 'meta';
const CHUNKS_STORE = 'chunks';

export interface RecordingMeta {
  id: string;
  startedAt: number; // ms epoch
  mimeType: string;
  clientCode?: string;
  sessionDate?: string;
  sessionTime?: string;
  recordMode?: 'mic' | 'system';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
        const chunkStore = db.createObjectStore(CHUNKS_STORE, {
          keyPath: 'autoId',
          autoIncrement: true,
        });
        chunkStore.createIndex('byRecording', 'recordingId');
      }
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

function tx<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  fn: (stores: IDBObjectStore[]) => Promise<T> | T,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const names = Array.isArray(storeNames) ? storeNames : [storeNames];
        const t = db.transaction(names, mode);
        const stores = names.map((n) => t.objectStore(n));
        let result: T;
        Promise.resolve(fn(stores))
          .then((r) => {
            result = r;
          })
          .catch(reject);
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error || new Error('IDB transaction aborted'));
      }),
  );
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Generate a recording id. Stable per session. */
export function newRecordingId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function openRecording(meta: RecordingMeta): Promise<void> {
  await tx(META_STORE, 'readwrite', ([store]) => reqToPromise(store.put(meta)));
}

export async function appendChunk(recordingId: string, blob: Blob): Promise<void> {
  await tx(CHUNKS_STORE, 'readwrite', ([store]) =>
    reqToPromise(store.add({ recordingId, blob, addedAt: Date.now() } as unknown as IDBValidKey extends infer K ? K : never)),
  );
}

interface ChunkRow {
  autoId: number;
  recordingId: string;
  blob: Blob;
  addedAt: number;
}

export async function finalizeRecording(recordingId: string, mimeType: string): Promise<Blob | null> {
  const chunks = await tx<ChunkRow[]>(CHUNKS_STORE, 'readonly', ([store]) => {
    const idx = store.index('byRecording');
    return new Promise<ChunkRow[]>((resolve, reject) => {
      const req = idx.getAll(IDBKeyRange.only(recordingId));
      req.onsuccess = () => resolve(req.result as ChunkRow[]);
      req.onerror = () => reject(req.error);
    });
  });
  if (!chunks.length) return null;
  // Order by autoId — IDB returns them in insertion order via the index but
  // we sort defensively.
  chunks.sort((a, b) => a.autoId - b.autoId);
  return new Blob(chunks.map((c) => c.blob), { type: mimeType });
}

export async function discardRecording(recordingId: string): Promise<void> {
  // Delete chunks first, then meta.
  await tx(CHUNKS_STORE, 'readwrite', async ([store]) => {
    const idx = store.index('byRecording');
    const keys = await reqToPromise(idx.getAllKeys(IDBKeyRange.only(recordingId)));
    for (const k of keys) {
      store.delete(k as IDBValidKey);
    }
  });
  await tx(META_STORE, 'readwrite', ([store]) => reqToPromise(store.delete(recordingId)));
}

export async function listOpenRecordings(): Promise<RecordingMeta[]> {
  return tx<RecordingMeta[]>(META_STORE, 'readonly', ([store]) =>
    reqToPromise(store.getAll() as IDBRequest<RecordingMeta[]>),
  );
}
