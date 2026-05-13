'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Loader2,
  Type,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Download,
  Share,
  PlusSquare,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type Mode = 'home' | 'voice' | 'text' | 'quick';

interface Entry {
  id: string;
  kind: 'voice' | 'text' | 'quick';
  text: string | null;
  mood: number | null;
  tags: string[];
  createdAt: string;
}

interface JournalState {
  prompt: string;
  entries: Entry[];
}

export default function JournalEntryPage() {
  const [mode, setMode] = useState<Mode>('home');
  const [state, setState] = useState<JournalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  // Service worker + install prompt wiring.
  useEffect(() => {
    // Register the SW so Chrome treats this as installable.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/journal/sw.js', { scope: '/journal' })
        .catch((err) => console.warn('sw register failed', err));
    }

    // Detect launched-from-home-screen so we can hide the install UI.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari surfaces this on the navigator
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Capture Chrome's install prompt for an in-page button.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    const onInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
      return;
    }
    // No prompt available → user is most likely on iOS Safari.
    // Show manual instructions.
    setShowIosHint(true);
  }

  async function refresh() {
    try {
      const res = await fetch('/api/journal/entries', { cache: 'no-store' });
      if (res.status === 401) {
        setEnrolled(false);
        return;
      }
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        return;
      }
      const body = await res.json();
      setEnrolled(true);
      setState(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (enrolled === false) {
    return (
      <main className="max-w-md mx-auto px-6 pt-24 pb-12">
        <h1 className="font-playfair text-2xl font-semibold mb-4 text-gray-900">
          Session Polaris
        </h1>
        <p className="text-sm text-gray-700">
          This journal is set up by your clinician. Ask them to send you the
          enrollment link or scan the QR they showed you in session.
        </p>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="max-w-md mx-auto px-6 pt-24 pb-12">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" strokeWidth={1.5} />
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-5 pt-8 pb-24">
      {!isStandalone && (
        <InstallBanner
          hasPrompt={!!installPrompt}
          onClick={handleInstallClick}
        />
      )}
      {showIosHint && <IosInstallSheet onClose={() => setShowIosHint(false)} />}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
          Your clinician asks
        </p>
        <h1 className="font-playfair text-xl text-gray-900 leading-snug">
          &ldquo;{state.prompt}&rdquo;
        </h1>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-error">
          <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
          {error}
        </div>
      )}

      {mode === 'home' && (
        <HomeButtons onPick={setMode} />
      )}
      {mode === 'voice' && (
        <VoiceComposer
          onCancel={() => setMode('home')}
          onSubmitted={() => {
            setMode('home');
            refresh();
          }}
        />
      )}
      {mode === 'text' && (
        <TextComposer
          onCancel={() => setMode('home')}
          onSubmitted={() => {
            setMode('home');
            refresh();
          }}
        />
      )}
      {mode === 'quick' && (
        <QuickComposer
          onCancel={() => setMode('home')}
          onSubmitted={() => {
            setMode('home');
            refresh();
          }}
        />
      )}

      <RecentEntries entries={state.entries} />

      <CrisisFooter />
    </main>
  );
}

function InstallBanner({
  hasPrompt,
  onClick,
}: {
  hasPrompt: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mb-5 -mx-1 flex items-center gap-3 px-3 py-2.5 rounded-xl border border-mint-200 bg-mint-50">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <PlusSquare className="w-4 h-4 text-primary" strokeWidth={1.5} />
      </div>
      <div className="flex-1 text-xs text-gray-700 leading-tight">
        <div className="font-medium text-gray-900">Add to home screen</div>
        <div className="text-gray-600">One tap, no app store</div>
      </div>
      <button
        onClick={onClick}
        className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg active:opacity-80"
      >
        {hasPrompt ? 'Install' : 'How'}
      </button>
    </div>
  );
}

function IosInstallSheet({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-playfair text-lg font-semibold text-gray-900 mb-3">
          Add to home screen
        </h2>

        <div className="text-sm text-gray-700 space-y-3">
          <div>
            <p className="font-medium text-gray-900 mb-1">iPhone (Safari)</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li className="flex items-center gap-1.5">
                Tap <Share className="inline w-4 h-4" strokeWidth={1.5} /> at the bottom
              </li>
              <li>Scroll down → tap &ldquo;Add to Home Screen&rdquo;</li>
              <li>Tap &ldquo;Add&rdquo; in the top right</li>
            </ol>
            <p className="text-xs text-gray-500 mt-1">
              Won&apos;t work in Chrome on iPhone — must be Safari.
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-900 mb-1">Android (Chrome)</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Tap the 3-dot menu (top right)</li>
              <li>Tap &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;</li>
              <li>Confirm</li>
            </ol>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 bg-primary text-white rounded-lg text-sm font-medium"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function HomeButtons({ onPick }: { onPick: (m: Mode) => void }) {
  return (
    <div className="space-y-3">
      <button
        onClick={() => onPick('voice')}
        className="w-full flex items-center gap-4 px-5 py-6 bg-primary text-white rounded-xl text-left active:scale-[0.99] transition-transform"
      >
        <Mic className="w-7 h-7" strokeWidth={1.5} />
        <div>
          <div className="font-medium text-base">Voice note</div>
          <div className="text-xs text-white/80">Talk into the mic — easiest in a hard moment</div>
        </div>
      </button>
      <button
        onClick={() => onPick('text')}
        className="w-full flex items-center gap-4 px-5 py-5 bg-white border border-gray-200 rounded-xl text-left text-gray-900 active:bg-gray-50"
      >
        <Type className="w-6 h-6 text-gray-700" strokeWidth={1.5} />
        <div>
          <div className="font-medium">Type</div>
          <div className="text-xs text-gray-500">Write what's happening</div>
        </div>
      </button>
      <button
        onClick={() => onPick('quick')}
        className="w-full flex items-center gap-4 px-5 py-5 bg-white border border-gray-200 rounded-xl text-left text-gray-900 active:bg-gray-50"
      >
        <Gauge className="w-6 h-6 text-gray-700" strokeWidth={1.5} />
        <div>
          <div className="font-medium">Quick log</div>
          <div className="text-xs text-gray-500">Just a mood + tags, 5 seconds</div>
        </div>
      </button>
    </div>
  );
}

const QUICK_TAGS = ['work', 'family', 'social', 'sleep', 'health', 'unknown'];

function VoiceComposer({
  onCancel,
  onSubmitted,
}: {
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: pickMime() });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch (e) {
      setErr(
        e instanceof Error
          ? `Microphone unavailable: ${e.message}`
          : 'Microphone unavailable',
      );
    }
  }

  function stop() {
    recRef.current?.stop();
    setRecording(false);
  }

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function submit() {
    if (!audioBlob) return;
    setSubmitting(true);
    setErr(null);
    try {
      const fd = new FormData();
      const ext = audioBlob.type.includes('webm')
        ? 'webm'
        : audioBlob.type.includes('ogg')
          ? 'ogg'
          : audioBlob.type.includes('mp4')
            ? 'm4a'
            : 'webm';
      fd.append('file', audioBlob, `entry.${ext}`);
      if (tags.length > 0) fd.append('tags', tags.join(','));
      const res = await fetch('/api/journal/upload-audio', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      onSubmitted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      {!audioBlob && !recording && (
        <button
          onClick={start}
          className="w-full flex flex-col items-center justify-center gap-3 py-10 bg-primary text-white rounded-xl"
        >
          <Mic className="w-10 h-10" strokeWidth={1.5} />
          <span className="text-base font-medium">Start recording</span>
        </button>
      )}
      {recording && (
        <button
          onClick={stop}
          className="w-full flex flex-col items-center justify-center gap-3 py-10 bg-error text-white rounded-xl"
        >
          <Square className="w-10 h-10 fill-white" strokeWidth={1.5} />
          <span className="text-base font-medium">Stop</span>
          <span className="text-xs text-white/80 animate-pulse">recording…</span>
        </button>
      )}
      {audioBlob && !recording && (
        <>
          <audio
            controls
            src={URL.createObjectURL(audioBlob)}
            className="w-full"
          />
          <div>
            <p className="text-xs text-gray-500 mb-2">Tag this moment (optional)</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${
                    tags.includes(t)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAudioBlob(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
            >
              <Trash2 className="w-4 h-4 inline mr-1" strokeWidth={1.5} />
              Re-record
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" strokeWidth={1.5} />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 inline mr-2" strokeWidth={1.5} />
                  Save entry
                </>
              )}
            </button>
          </div>
        </>
      )}
      {err && (
        <div className="text-sm text-error flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
          {err}
        </div>
      )}
      <button
        onClick={onCancel}
        className="text-sm text-gray-500 underline"
      >
        Cancel
      </button>
    </div>
  );
}

function pickMime(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return 'audio/webm';
}

function TextComposer({
  onCancel,
  onSubmitted,
}: {
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function submit() {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch('/api/journal/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'text', text, tags }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      onSubmitted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="What's happening, in your words…"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div>
        <p className="text-xs text-gray-500 mb-2">Tags (optional)</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                tags.includes(t)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {err && (
        <div className="text-sm text-error flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
          {err}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting || text.trim().length === 0}
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 inline mr-2 animate-spin" strokeWidth={1.5} />
              Saving…
            </>
          ) : (
            'Save entry'
          )}
        </button>
      </div>
    </div>
  );
}

function QuickComposer({
  onCancel,
  onSubmitted,
}: {
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const [mood, setMood] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function submit() {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch('/api/journal/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'quick', mood, tags }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      onSubmitted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm text-gray-700">How are you feeling?</span>
          <span className="text-2xl font-playfair text-gray-900">{mood}</span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          value={mood}
          onChange={(e) => setMood(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>worst</span>
          <span>okay</span>
          <span>best</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Tags (optional)</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                tags.includes(t)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {err && (
        <div className="text-sm text-error flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
          {err}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Log it'}
        </button>
      </div>
    </div>
  );
}

function RecentEntries({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="mt-10">
      <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">
        Your recent entries
      </h2>
      <ul className="space-y-2">
        {entries.slice(0, 6).map((e) => (
          <li
            key={e.id}
            className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm"
          >
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span className="capitalize">{e.kind}</span>
              <span>{new Date(e.createdAt).toLocaleString()}</span>
            </div>
            {e.text && (
              <p className="text-gray-800 line-clamp-3 whitespace-pre-wrap">
                {e.text}
              </p>
            )}
            {e.mood !== null && (
              <p className="text-gray-700">Mood: {e.mood}/10</p>
            )}
            {e.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {e.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CrisisFooter() {
  return (
    <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-500 leading-relaxed">
      <p className="font-medium text-gray-700 mb-1">Not monitored in real time</p>
      <p>
        Your clinician reads what you write before your next session, not as you
        write it. If you're in crisis or you're worried about your safety, reach
        someone now:
      </p>
      <ul className="mt-2 space-y-0.5">
        <li>US: call or text <strong>988</strong></li>
        <li>UK: call <strong>111</strong> or Samaritans <strong>116 123</strong></li>
        <li>Canada: call or text <strong>988</strong></li>
      </ul>
    </div>
  );
}
