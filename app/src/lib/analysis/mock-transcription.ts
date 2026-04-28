export interface TranscribeOptions {
  /** Optional ISO-639-1 language hint. Omit to let Whisper auto-detect. */
  language?: string;
  /** AbortSignal — caller can cancel the upload mid-flight. */
  signal?: AbortSignal;
  /**
   * Called with upload progress 0-100 during the file upload portion. The
   * Whisper *processing* step (after upload completes) doesn't expose
   * progress — clients should switch to an indeterminate "transcribing…"
   * indicator once `onProgress` reports 100.
   */
  onProgress?: (percent: number) => void;
}

export interface TranscribeResult {
  transcript: string;
  /** Detected (or hinted) language, e.g. "english". null if unknown. */
  language: string | null;
  /** Audio duration in seconds, or null if unknown. */
  duration: number | null;
}

/**
 * Transcribe audio using OpenAI's Whisper API via /api/transcribe.
 *
 * Uses XHR (not fetch) for the request so we can report upload progress —
 * fetch's streaming upload progress isn't supported in browsers yet.
 *
 * Cancellation: pass `options.signal`; on abort the XHR is cancelled and the
 * promise rejects with `Error('Transcription cancelled')`. Callers can catch
 * this and fall back to manual transcript paste without showing an error.
 */
export function transcribeAudio(
  file: File,
  options: TranscribeOptions = {},
): Promise<TranscribeResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.language) formData.append('language', options.language);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/transcribe');

    if (options.onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          options.onProgress!(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener('load', () => {
      let parsed: { transcript?: string; language?: string | null; duration?: number | null; error?: string } = {};
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {
        // fall through with empty parsed
      }
      if (xhr.status >= 200 && xhr.status < 300 && parsed.transcript) {
        resolve({
          transcript: parsed.transcript,
          language: parsed.language ?? null,
          duration: parsed.duration ?? null,
        });
      } else {
        reject(new Error(parsed.error || `Transcription failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during transcription')));
    xhr.addEventListener('abort', () => reject(new Error('Transcription cancelled')));

    if (options.signal) {
      if (options.signal.aborted) {
        xhr.abort();
        return;
      }
      options.signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.send(formData);
  });
}

/** Format file size in human-readable form */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Estimate audio duration from file size (rough: ~1MB per minute for mp3) */
export function estimateDuration(bytes: number): string {
  const minutes = Math.max(1, Math.round(bytes / (1024 * 1024)));
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return `~${hours}h ${remainingMin}m`;
}

/** Accepted audio file extensions */
export const ACCEPTED_AUDIO_TYPES = '.mp3,.wav,.m4a,.webm,.ogg,.aac,.flac';
export const ACCEPTED_AUDIO_MIME = 'audio/mpeg,audio/wav,audio/mp4,audio/webm,audio/ogg,audio/aac,audio/flac';
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB (OpenAI Whisper limit)
