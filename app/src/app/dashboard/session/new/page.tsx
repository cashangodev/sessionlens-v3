'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DEMO_TRANSCRIPT } from '@/lib/analysis/demo-transcript';
import { transcribeAudio, formatFileSize, estimateDuration, ACCEPTED_AUDIO_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/analysis/mock-transcription';
import { useApi } from '@/hooks/use-api';
import {
  appendChunk,
  discardRecording,
  finalizeRecording,
  listOpenRecordings,
  newRecordingId,
  openRecording,
  type RecordingMeta,
} from '@/lib/recording/chunk-store';
import { useResumableRecordings } from '@/hooks/use-resumable-recordings';

interface ClientInfo {
  clientCode: string;
  sessionCount: number;
  lastSessionDate: string;
  gender: string;
  ageRange: string;
  presentingConcerns: string[];
}

interface SessionSummary {
  id: string;
  clientCode: string;
  sessionNumber: number;
  date: string;
  time: string;
}
import { ShieldCheck, Loader2, ArrowLeft, Clock, ChevronRight, UserPlus, Upload, FileAudio, X, Music, FileText, Mic, Square, Pause, Play, RotateCcw, CheckCircle2, AlertTriangle, Volume2, Monitor, Headphones, Edit3, Save, Check, Brain, Eye, Stethoscope, Sparkles } from 'lucide-react';

// ─── Analysis stage labels ───
const ANALYSIS_STAGES_AUDIO = [
  'Transcribing audio...',
  'Segmenting transcript...',
  'Coding phenomenological structures...',
  'Analyzing risk signals...',
  'Matching against research archive...',
  'Generating clinical insights...',
];

const ANALYSIS_STAGES_TEXT = [
  'Segmenting transcript...',
  'Coding phenomenological structures...',
  'Analyzing risk signals...',
  'Matching against research archive...',
  'Generating clinical insights...',
];

type Step = 'client' | 'review' | 'input';
type RecordingState = 'idle' | 'testing' | 'recording' | 'paused' | 'done';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillDate = searchParams.get('date') || '';
  const prefillClient = searchParams.get('client') || '';
  // Resume params from the dashboard banner. Presence of `resume` means
  // we should auto-load that IDB recording and skip the client/profile
  // wizard. `action` decides whether to keep capturing or finalize as-is.
  const resumeIdParam = searchParams.get('resume');
  const resumeActionParam = searchParams.get('action'); // 'continue' | 'finalize'

  // Step flow — skip to input if client is pre-filled, OR if we're
  // resuming a recording (the client + date are already in the IDB meta).
  const [step, setStep] = useState<Step>(
    prefillClient || resumeIdParam ? 'input' : 'client',
  );

  // Client selection
  const [clientCode, setClientCode] = useState(prefillClient);
  const isNewClient = false; // New client creation moved to Clients page
  const [newClientCode] = useState('');

  // Session metadata
  const todayStr = new Date().toISOString().split('T')[0];
  const [sessionDate, setSessionDate] = useState(prefillDate || todayStr);
  const [sessionTime, setSessionTime] = useState(
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );

  // Derived: is this a live (today) session?
  const isLiveSession = sessionDate === todayStr;

  // Analysis input
  const [transcript, setTranscript] = useState('');
  const [treatmentGoals, setTreatmentGoals] = useState('');
  const [sessionNumber, setSessionNumber] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [activeTab, setActiveTab] = useState(isLiveSession ? 'record' : 'upload');
  const [bulkTranscripts, setBulkTranscripts] = useState('');
  const [expandedBulk, setExpandedBulk] = useState(false);
  // GDPR consent: bool + method. The bool is the explicit attestation
  // checkbox; the method captures HOW consent was obtained (verbal | written
  // | electronic). Both are required to enable any "Analyze" action and are
  // persisted on the sessions row (see migration 003_session_consent.sql).
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentMethod, setConsentMethod] = useState<'verbal' | 'written' | 'electronic'>('verbal');
  const CONSENT_VERSION = 'v1.0';

  // Whisper upload state — driven by handleAudioAnalyze below.
  // - uploadPercent: 0..100 during upload, then null while Whisper is
  //   processing (server side — no progress signal available).
  // - transcribeAbort: abort controller exposed to a Cancel button.
  // - whisperError: set when transcription fails; UI offers a paste fallback.
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const transcribeAbort = useRef<AbortController | null>(null);
  const [whisperError, setWhisperError] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bulkRef = useRef<HTMLTextAreaElement>(null);

  // Audio upload state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [audioError, setAudioError] = useState('');
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Bulk audio state
  const [bulkAudioFiles, setBulkAudioFiles] = useState<File[]>([]);
  const bulkAudioInputRef = useRef<HTMLInputElement>(null);

  // Client profile for review step
  interface ClientProfileData {
    clientCode: string;
    gender: string;
    ageRange: string;
    treatmentGoals: string[];
    presentingConcerns: string[];
    dominantStructures: string[];
    preferredApproach: string;
    clinicalNotes: string;
    totalSessions: number;
    currentRiskLevel: string;
    isConfirmed: boolean;
    outcomeTrackingEnabled: boolean;
    outcomeScores: { date: string; phq9: number | null; gad7: number | null; note: string }[];
  }
  const [clientProfile, setClientProfile] = useState<ClientProfileData | null>(null);

  // ─── Profile edit state (review step) ───
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editGender, setEditGender] = useState('');
  const [editAgeRange, setEditAgeRange] = useState('');
  const [editGoals, setEditGoals] = useState('');
  const [editConcerns, setEditConcerns] = useState('');
  const [editApproach, setEditApproach] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const startEditingProfile = () => {
    setEditGender(clientProfile?.gender || '');
    setEditAgeRange(clientProfile?.ageRange || '');
    setEditGoals(clientProfile?.treatmentGoals?.join(', ') || '');
    setEditConcerns(clientProfile?.presentingConcerns?.join(', ') || '');
    setEditApproach(clientProfile?.preferredApproach || '');
    setEditNotes(clientProfile?.clinicalNotes || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfileInline = async () => {
    if (!clientProfile) return;
    setSavingProfile(true);
    try {
      const resp = await fetch(`/api/clients/${encodeURIComponent(clientProfile.clientCode)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: editGender,
          ageRange: editAgeRange,
          treatmentGoals: editGoals.split(',').map((s: string) => s.trim()).filter(Boolean),
          presentingConcerns: editConcerns.split(',').map((s: string) => s.trim()).filter(Boolean),
          preferredApproach: editApproach,
          clinicalNotes: editNotes,
        }),
      });
      if (resp.ok) {
        const updated = await resp.json();
        setClientProfile((prev) => prev ? {
          ...prev,
          gender: updated.gender || editGender,
          ageRange: updated.ageRange || editAgeRange,
          treatmentGoals: updated.treatmentGoals || editGoals.split(',').map((s: string) => s.trim()).filter(Boolean),
          presentingConcerns: updated.presentingConcerns || editConcerns.split(',').map((s: string) => s.trim()).filter(Boolean),
          preferredApproach: updated.preferredApproach || editApproach,
          clinicalNotes: updated.clinicalNotes || editNotes,
        } : prev);
        setIsEditingProfile(false);
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setSavingProfile(false);
    }
  };

  // ─── Recording state ───
  type RecordMode = 'mic' | 'system';
  const [recordMode, setRecordMode] = useState<RecordMode>('mic');

  // Video Call mode requires getDisplayMedia({ audio: true }), which is
  // only reliably implemented on Chromium-family desktop browsers. Safari,
  // Firefox, and mobile Chrome all fail in different ways — sometimes the
  // call succeeds but the audio track is silent, sometimes it errors with
  // a generic NotAllowedError. We check capability + UA at mount and
  // disable the Video Call tile (with a tooltip explaining why) when not
  // supported, instead of letting the user click into a broken flow.
  const [videoCallSupported, setVideoCallSupported] = useState(true);
  const [videoCallUnsupportedReason, setVideoCallUnsupportedReason] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = window.navigator.userAgent;
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    const isFirefox = /Firefox\//.test(ua);
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
    // Chromium-family desktop = Chrome, Edge, Brave, Opera, Vivaldi, Arc.
    // Edge UA contains "Edg/", Chrome contains "Chrome/" without "Edg/".
    const isChromium = /Chrome\/|Edg\//.test(ua) && !isMobile;
    const hasGetDisplayMedia =
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getDisplayMedia === 'function';

    if (!hasGetDisplayMedia) {
      setVideoCallSupported(false);
      setVideoCallUnsupportedReason('Your browser doesn’t support screen-audio capture.');
    } else if (isMobile) {
      setVideoCallSupported(false);
      setVideoCallUnsupportedReason('Video Call recording requires a desktop browser.');
    } else if (isSafari) {
      setVideoCallSupported(false);
      setVideoCallUnsupportedReason('Safari doesn’t support tab-audio capture. Use Chrome or Edge on desktop.');
    } else if (isFirefox) {
      setVideoCallSupported(false);
      setVideoCallUnsupportedReason('Firefox tab-audio capture is unreliable. Use Chrome or Edge on desktop.');
    } else if (!isChromium) {
      setVideoCallSupported(false);
      setVideoCallUnsupportedReason('Use Chrome or Edge on desktop for Video Call recording.');
    }
  }, []);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState('');
  const [micTestLevel, setMicTestLevel] = useState(0);
  const [micTestPassed, setMicTestPassed] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micTestIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStateRef = useRef<RecordingState>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  // IndexedDB recording id for the current take. Set when recording starts,
  // cleared on successful upload or explicit discard. If a tab crash leaves
  // it set, the resume banner will surface it on next page load.
  const recordingIdRef = useRef<string | null>(null);
  // True between the moment the user clicks "Continue" in the resume banner
  // and the next time recording stops. Used to: (a) preserve audioChunksRef
  // across startRecording, (b) preserve the recordingSeconds offset, (c)
  // reuse the existing IDB recording id so new chunks append to the same
  // session, (d) display a notice to the user explaining the continuation.
  const [isResumingRecording, setIsResumingRecording] = useState(false);
  const isResumingRecordingRef = useRef(false);
  useEffect(() => { isResumingRecordingRef.current = isResumingRecording; }, [isResumingRecording]);

  // Shared hook reads IDB once on mount and surfaces any in-flight
  // recordings to the resume banner.
  const { recordings: resumableRecordings, refresh: refreshResumables } =
    useResumableRecordings();
  // Mutator helper that mirrors the local-state filtering done previously,
  // so the existing handlers (Continue / Use as-is / Discard) keep working
  // without restructuring.
  const setResumableRecordings = (
    fn: (rs: RecordingMeta[]) => RecordingMeta[],
  ) => {
    void fn; // local filtering is now driven by `refreshResumables` below
    refreshResumables();
  };

  // When date changes: if no longer live, switch away from record tab
  useEffect(() => {
    if (!isLiveSession && activeTab === 'record') {
      setActiveTab('upload');
      // Clean up any active recording
      if (recordingState === 'recording' || recordingState === 'paused') {
        stopRecording();
      }
    }
  }, [isLiveSession]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (micTestIntervalRef.current) clearInterval(micTestIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Client / session logic ───
  const [previousSessions, setPreviousSessions] = useState<SessionSummary[]>([]);

  // Fetch sessions for the active client
  const activeCodeForSessions = isNewClient ? newClientCode : clientCode;
  const sessionsUrl = activeCodeForSessions
    ? `/api/sessions?clientCode=${encodeURIComponent(activeCodeForSessions)}`
    : null;
  const { data: sessionsData } = useApi<{ sessions: SessionSummary[] }>(sessionsUrl);

  useEffect(() => {
    if (sessionsData?.sessions) {
      setPreviousSessions(sessionsData.sessions);
    } else {
      setPreviousSessions([]);
    }
  }, [sessionsData]);

  // Fetch existing clients list
  const { data: clientsData } = useApi<{ clients: ClientInfo[] }>('/api/clients');
  const existingClients = useMemo(() => {
    if (!clientsData?.clients) return [];
    return clientsData.clients.map((c) => c.clientCode).sort();
  }, [clientsData]);

  // Auto-setup when client is pre-filled from URL
  useEffect(() => {
    if (!prefillClient) return;
    const setup = async () => {
      try {
        // Fetch sessions for this client
        const sessRes = await fetch(`/api/sessions?clientCode=${encodeURIComponent(prefillClient)}`);
        if (sessRes.ok) {
          const { sessions } = await sessRes.json();
          if (sessions && sessions.length > 0) {
            const maxSession = Math.max(...sessions.map((s: SessionSummary) => s.sessionNumber));
            setSessionNumber(maxSession + 1);
          }
        }
        // Fetch client profile for treatment goals
        const profileRes = await fetch(`/api/clients/${encodeURIComponent(prefillClient)}`);
        if (profileRes.ok) {
          const { profile } = await profileRes.json();
          if (profile?.isConfirmed && profile.treatmentGoals?.length > 0) {
            setTreatmentGoals(profile.treatmentGoals.join(', '));
          }
        }
      } catch (err) {
        console.error('Failed to load prefill data:', err);
      }
    };
    setup();
  }, [prefillClient]);

  const activeClientCode = isNewClient ? newClientCode : clientCode;

  const handleClientContinue = async () => {
    const code = isNewClient ? newClientCode.trim() : clientCode.trim();
    if (!code) {
      alert('Please enter or select a client code');
      return;
    }

    // Fetch full client profile
    try {
      const profileRes = await fetch(`/api/clients/${encodeURIComponent(code)}`);
      if (profileRes.ok) {
        const { profile } = await profileRes.json();
        setClientProfile(profile || null);
        if (profile?.isConfirmed && profile.treatmentGoals?.length > 0 && !treatmentGoals) {
          setTreatmentGoals(profile.treatmentGoals.join(', '));
        }
      } else {
        setClientProfile(null);
      }
    } catch {
      setClientProfile(null);
    }

    // Auto-set session number based on previous sessions
    if (previousSessions.length > 0) {
      const maxSession = Math.max(...previousSessions.map((s) => s.sessionNumber));
      setSessionNumber(maxSession + 1);
    }
    // Always show review step — full client profile
    setStep('review');
  };

  // ─── Recording handlers ───

  // Step 1: Start mic/system audio test — get permission, show audio levels
  const startMicTest = async () => {
    setMicError('');
    setMicTestPassed(false);
    try {
      if (recordMode === 'system') {
        // System audio capture for video calls (Zoom/Teams/Meet)
        // getDisplayMedia captures system/tab audio
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: false, // We only need audio, not video
        });

        // Check if audio track was actually shared
        const audioTracks = displayStream.getAudioTracks();
        if (audioTracks.length === 0) {
          displayStream.getTracks().forEach((t) => t.stop());
          setMicError(
            'No audio was shared. When the browser asks you to share, make sure to check "Share audio" or "Share tab audio" at the bottom of the dialog.'
          );
          return;
        }

        displayStreamRef.current = displayStream;

        // Also capture the therapist's microphone so both sides are recorded
        let micStream: MediaStream | null = null;
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          // Mic not available — still proceed with system audio only
          console.warn('Could not get mic for video call recording — system audio only');
        }

        // Merge system audio + mic audio into one stream
        // Close any previous AudioContext to prevent leaks
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
        }
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const destination = audioContext.createMediaStreamDestination();

        // Build the analyser FIRST so we can fan both source nodes into it
        // alongside the destination. AudioNode.connect() supports multiple
        // outputs from a single node, so each source feeds both the
        // recording destination AND the analyser without any duplication.
        //
        // BUG-FIX (Apr 2026): previously the analyser was connected only to
        // the screen-share source. During mic-test the call typically hasn't
        // started yet — nobody's talking on Zoom/Teams — so the meter sat
        // at 0 and the test never passed. Routing the mic into the analyser
        // too means the therapist saying "test" lights the meter immediately,
        // matching how the in-person mode behaves.
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const displaySource = audioContext.createMediaStreamSource(displayStream);
        displaySource.connect(destination);
        displaySource.connect(analyser);

        if (micStream) {
          const micSource = audioContext.createMediaStreamSource(micStream);
          micSource.connect(destination);
          micSource.connect(analyser);
          streamRef.current = micStream; // Keep ref for cleanup
        }

        // The merged stream is what we'll record (system + mic).
        streamRef.current = destination.stream;

        // Handle user stopping screen share via browser UI
        displayStream.getAudioTracks()[0].onended = () => {
          if (recordingStateRef.current === 'recording' || recordingStateRef.current === 'paused') {
            stopRecording();
          } else {
            cancelMicTest();
          }
        };

        recordingStateRef.current = 'testing';
        setRecordingState('testing');

        // Poll audio level
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let peakDetected = false;
        micTestIntervalRef.current = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
          const normalized = Math.min(100, Math.round(avg * 1.5));
          setMicTestLevel(normalized);
          if (normalized > 5 && !peakDetected) {
            peakDetected = true;
            setMicTestPassed(true);
          }
        }, 100);
      } else {
        // Standard microphone capture (in-person sessions)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Set up audio analyser for level monitoring
        // Close any previous AudioContext to prevent leaks
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
        }
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        recordingStateRef.current = 'testing';
        setRecordingState('testing');

        // Poll audio level
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let peakDetected = false;
        micTestIntervalRef.current = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
          const normalized = Math.min(100, Math.round(avg * 1.5));
          setMicTestLevel(normalized);
          if (normalized > 15 && !peakDetected) {
            peakDetected = true;
            setMicTestPassed(true);
          }
        }, 100);
      }
    } catch (err) {
      console.error('Audio access error:', err);
      if (recordMode === 'system') {
        setMicError(
          'Could not capture system audio. Make sure to select a tab or screen with audio when prompted. This feature works best in Chrome.'
        );
      } else {
        setMicError(
          'Could not access microphone. Please allow microphone permissions in your browser settings.'
        );
      }
    }
  };

  // Step 2: Confirm mic test passed, start actual recording
  const startRecording = async () => {
    // Clean up mic test interval
    if (micTestIntervalRef.current) {
      clearInterval(micTestIntervalRef.current);
      micTestIntervalRef.current = null;
    }

    const stream = streamRef.current;
    if (!stream) return;

    const getMimeType = () => {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
      if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
      if (MediaRecorder.isTypeSupported('audio/ogg')) return 'audio/ogg';
      return ''; // Let browser choose default
    };
    const mimeType = getMimeType();
    mimeTypeRef.current = mimeType || 'audio/webm';

    // 32 kbps Opus is plenty for speech-to-text and keeps a 60-minute
    // recording at ~14 MB — well under Whisper's 25 MB upload cap. Default
    // WebM/Opus runs ~96–128 kbps which can blow the cap on a 50-min session.
    // For non-Opus codecs (audio/mp4 on Safari) we still pass the bitrate;
    // browsers ignore unsupported hints rather than erroring.
    const mediaRecorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 },
    );
    mediaRecorderRef.current = mediaRecorder;

    // Continuation path: a previous recording was loaded from IDB and the
    // user clicked "Continue" in the resume banner. Preserve the historical
    // chunks (already in audioChunksRef) and reuse the existing IDB id so
    // new chunks append to the same session. Otherwise fresh recording —
    // reset everything and open a new IDB session.
    const continuing = isResumingRecordingRef.current && audioChunksRef.current.length > 0;
    if (!continuing) {
      audioChunksRef.current = [];

      // Discard ANY pre-existing unfinished recordings before starting a
      // fresh one. The doctor explicitly chose "new recording" (not
      // continue), so the orphans are no longer wanted. This also
      // guarantees the resume banner only ever surfaces ONE recording —
      // the one currently being made.
      try {
        const stale = await listOpenRecordings();
        for (const m of stale) {
          await discardRecording(m.id).catch((err) => {
            console.error('[recording] discard stale failed:', err);
          });
        }
      } catch (err) {
        console.error('[recording] listOpenRecordings (stale sweep) failed:', err);
      }

      const recordingId = newRecordingId();
      recordingIdRef.current = recordingId;
      // Await openRecording so the meta row exists BEFORE the first chunk
      // tries to append. Without the await, a slow IDB write could let the
      // first ondataavailable fire with no parent meta — chunks then exist
      // as orphans and the resume banner never finds them.
      try {
        await openRecording({
          id: recordingId,
          startedAt: Date.now(),
          mimeType: mimeTypeRef.current,
          clientCode: activeClientCode,
          sessionDate,
          sessionTime,
          recordMode,
        });
      } catch (err) {
        console.error('[recording] openRecording failed:', err);
        recordingIdRef.current = null;
      }
    }
    // else: keep existing recordingIdRef + audioChunksRef intact

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
        // Mirror to IDB for crash recovery. Fire-and-forget by design (we
        // can't slow the recorder waiting on disk) — but log failures so
        // they don't disappear. If many of these fire, the IDB store is
        // misconfigured and the resume banner won't have data to show.
        const id = recordingIdRef.current;
        if (id) appendChunk(id, e.data).catch((err) => {
          console.error('[recording] appendChunk failed:', err);
        });
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
      setRecordedBlob(blob);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(URL.createObjectURL(blob));
      // Stop all tracks
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((t) => t.stop());
        displayStreamRef.current = null;
      }
      // The IDB recording stays around until the analyze flow successfully
      // uploads the audio (or the user explicitly discards). That's the
      // hand-off point for the resume banner.
    };

    mediaRecorder.start(1000);
    recordingStateRef.current = 'recording';
    setRecordingState('recording');
    // Continuation: keep the existing recordingSeconds (carried over from
    // the resumed session). Fresh recording: start at 0.
    if (!continuing) setRecordingSeconds(0);
    // Once recording resumes, clear the resume flag — subsequent stops
    // and restarts behave as normal.
    setIsResumingRecording(false);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  };

  // Cancel mic test and go back to idle
  const cancelMicTest = () => {
    if (micTestIntervalRef.current) {
      clearInterval(micTestIntervalRef.current);
      micTestIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicTestLevel(0);
    setMicTestPassed(false);
    recordingStateRef.current = 'idle';
    setRecordingState('idle');
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      recordingStateRef.current = 'paused';
      setRecordingState('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      recordingStateRef.current = 'recording';
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    recordingStateRef.current = 'done';
    setRecordingState('done');
  };

  const resetRecording = () => {
    if (!showRestartConfirm) {
      setShowRestartConfirm(true);
      return;
    }
    // Second click — actually reset
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingSeconds(0);
    recordingStateRef.current = 'idle';
    setRecordingState('idle');
    setMicError('');
    setMicTestPassed(false);
    setMicTestLevel(0);
    setShowRestartConfirm(false);
  };

  const cancelRestart = () => {
    setShowRestartConfirm(false);
  };

  // ─── Post-analysis: route to results ───
  const finishAndRoute = async (sessionId: string) => {
    // Check if client has a confirmed profile to decide where to route
    try {
      const profileRes = await fetch(`/api/clients/${encodeURIComponent(activeClientCode)}`);
      if (profileRes.ok) {
        const { profile } = await profileRes.json();
        if (profile?.isConfirmed) {
          router.push(`/dashboard/session/${sessionId}/summary`);
          return;
        }
      }
    } catch {
      // If profile check fails, default to profile review
    }
    // First session or unconfirmed profile → show profile review
    router.push(`/dashboard/session/${sessionId}/profile-review`);
  };

  // ─── Analysis: from recording ───
  const handleRecordingAnalyze = async () => {
    if (!recordedBlob) return;
    setIsAnalyzing(true);

    try {
      const stages = ANALYSIS_STAGES_AUDIO;
      setCurrentStage(0);
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
      const { transcript: transcribedText } = await transcribeAudio(file);

      for (let i = 1; i < stages.length; i++) {
        setCurrentStage(i);
        await new Promise((resolve) => setTimeout(resolve, 700));
      }

      // Create session via API
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientCode: activeClientCode,
          transcript: transcribedText,
          treatmentGoals,
          sessionNumber,
          date: sessionDate,
          time: sessionTime,
          consentMethod,
          consentVersion: CONSENT_VERSION,
        }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      const { sessionId } = await res.json();

      // Run analysis via API (also updates profile)
      const analyzeRes = await fetch(`/api/sessions/${sessionId}/analyze`, { method: 'POST' });
      if (!analyzeRes.ok) throw new Error('Analysis failed');

      // Successful upload — discard the IDB recording so it doesn't appear
      // in the resume banner next time. Failure to discard is non-fatal:
      // worst case the user sees a stale resume option.
      const id = recordingIdRef.current;
      if (id) {
        recordingIdRef.current = null;
        void discardRecording(id).catch(() => {});
      }

      await finishAndRoute(sessionId);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
      setIsAnalyzing(false);
    }
  };

  // Helper used by both resume-flows below. Loads the meta + chunks from IDB,
  // restores the in-memory state (chunks ref, recording id, mime type), and
  // sets the form fields we captured when the recording started (client,
  // mode, date/time). Returns the reconstructed blob OR null if the IDB row
  // had no chunks (in which case it's auto-cleaned).
  const restoreRecordingFromIdb = useCallback(
    async (meta: RecordingMeta): Promise<{ blob: Blob; durationSeconds: number } | null> => {
      const blob = await finalizeRecording(meta.id, meta.mimeType);
      if (!blob) {
        await discardRecording(meta.id).catch(() => {});
        setResumableRecordings((rs) => rs.filter((r) => r.id !== meta.id));
        return null;
      }
      // Pre-load chunks into memory so a NEW MediaRecorder run can append to
      // them. The historical blob goes in as a single combined chunk.
      audioChunksRef.current = [blob];
      recordingIdRef.current = meta.id;
      mimeTypeRef.current = meta.mimeType;
      if (meta.recordMode) setRecordMode(meta.recordMode);
      if (meta.clientCode) setClientCode(meta.clientCode);
      if (meta.sessionDate) setSessionDate(meta.sessionDate);
      if (meta.sessionTime) setSessionTime(meta.sessionTime);
      setActiveTab('record');
      setResumableRecordings((rs) => rs.filter((r) => r.id !== meta.id));
      const durationSeconds = Math.max(1, Math.round((Date.now() - meta.startedAt) / 1000));
      return { blob, durationSeconds };
    },
    [],
  );

  // "Continue recording" — load chunks back into memory and drop the user
  // into the idle/record state. They click the regular Start button to
  // re-grant audio access, then the new MediaRecorder run APPENDS chunks
  // to the existing audioChunksRef and continues persisting under the same
  // IDB recording id. The previous duration carries over on the timer.
  const handleContinueResumable = useCallback(
    async (meta: RecordingMeta) => {
      try {
        const restored = await restoreRecordingFromIdb(meta);
        if (!restored) return;
        // Stay in idle so the user can click the mic test button — the
        // browser requires a user gesture before re-prompting for audio.
        setRecordingSeconds(restored.durationSeconds);
        setRecordingState('idle');
        recordingStateRef.current = 'idle';
        // Reveal the resume notice — read by the JSX to show a "continuing
        // from prior session" hint above the start button.
        setIsResumingRecording(true);
      } catch (e) {
        console.error('Failed to load recording for continuation:', e);
      }
    },
    [restoreRecordingFromIdb],
  );

  // "Use what's there" — load chunks and finalize as-is, no further capture.
  // Same end state as if the user had stopped recording normally.
  const handleFinalizeResumable = useCallback(
    async (meta: RecordingMeta) => {
      try {
        const restored = await restoreRecordingFromIdb(meta);
        if (!restored) return;
        setRecordedBlob(restored.blob);
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(URL.createObjectURL(restored.blob));
        setRecordingState('done');
        recordingStateRef.current = 'done';
        setRecordingSeconds(restored.durationSeconds);
      } catch (e) {
        console.error('Failed to finalize unfinished recording:', e);
      }
    },
    [recordedUrl, restoreRecordingFromIdb],
  );

  // Auto-trigger when arriving via the dashboard banner with
  // ?resume=<id>&action=continue|finalize. Looks up the meta in IDB,
  // dispatches to the right handler, then strips the params from the URL
  // so a refresh doesn't re-trigger. Runs once.
  const resumeAutoRunRef = useRef(false);
  useEffect(() => {
    if (resumeAutoRunRef.current) return;
    if (!resumeIdParam) return;
    resumeAutoRunRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const all = await listOpenRecordings();
        const meta = all.find((m) => m.id === resumeIdParam);
        if (cancelled || !meta) return;
        if (resumeActionParam === 'finalize') {
          await handleFinalizeResumable(meta);
        } else {
          // Default: continue
          await handleContinueResumable(meta);
        }
        // Strip the params so a reload doesn't re-trigger
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('resume');
          url.searchParams.delete('action');
          router.replace(url.pathname + (url.search || ''));
        }
      } catch (err) {
        console.error('[resume-auto] failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // We only want this to run once on mount — params are read from URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDiscardResumable = useCallback(async (meta: RecordingMeta) => {
    await discardRecording(meta.id).catch(() => {});
    setResumableRecordings((rs) => rs.filter((r) => r.id !== meta.id));
  }, []);

  // ─── Audio upload handlers ───
  const validateAudioFile = useCallback((file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExts = ['mp3', 'wav', 'm4a', 'webm', 'ogg', 'aac', 'flac'];
    if (!validExts.includes(ext) && !file.type.startsWith('audio/')) {
      return `Unsupported file type: .${ext}. Please upload an audio file.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File too large (${formatFileSize(file.size)}). Maximum is 500MB.`;
    }
    return null;
  }, []);

  const handleAudioSelect = useCallback((file: File) => {
    const error = validateAudioFile(file);
    if (error) { setAudioError(error); return; }
    setAudioError('');
    setAudioFile(file);
  }, [validateAudioFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleAudioSelect(file);
  }, [handleAudioSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAudioSelect(file);
    if (audioInputRef.current) audioInputRef.current.value = '';
  }, [handleAudioSelect]);

  const handleRemoveAudio = useCallback(() => { setAudioFile(null); setAudioError(''); }, []);

  const handleCancelTranscribe = () => {
    transcribeAbort.current?.abort();
  };

  // ─── Analysis: from uploaded audio ───
  const handleAudioAnalyze = async () => {
    if (!audioFile) return;
    setIsAnalyzing(true);
    setWhisperError('');
    setUploadPercent(0);
    transcribeAbort.current = new AbortController();
    try {
      setCurrentStage(0);
      const { transcript: transcribedText } = await transcribeAudio(audioFile, {
        signal: transcribeAbort.current.signal,
        onProgress: (p) => setUploadPercent(p),
      });
      // Upload finished — server is now running Whisper; no progress signal
      // available, so flip back to indeterminate.
      setUploadPercent(null);
      for (let i = 1; i < ANALYSIS_STAGES_AUDIO.length; i++) {
        setCurrentStage(i);
        await new Promise((resolve) => setTimeout(resolve, 700));
      }

      // Create session via API
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientCode: activeClientCode,
          transcript: transcribedText,
          treatmentGoals,
          sessionNumber,
          date: sessionDate,
          time: sessionTime,
          consentMethod,
          consentVersion: CONSENT_VERSION,
        }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      const { sessionId } = await res.json();

      // Run analysis via API (also updates profile)
      const analyzeRes = await fetch(`/api/sessions/${sessionId}/analyze`, { method: 'POST' });
      if (!analyzeRes.ok) throw new Error('Analysis failed');

      await finishAndRoute(sessionId);
    } catch (error) {
      console.error('Analysis failed:', error);
      const msg = error instanceof Error ? error.message : 'Analysis failed';
      // Cancellation is a normal user action — don't show as an error, just
      // unwind state so they can re-pick a file or switch to the paste tab.
      if (msg.includes('cancelled')) {
        setWhisperError(''); // cleared
      } else {
        // Surface the error inline (with a "switch to paste" CTA) instead of
        // the old alert(). Audio failures are common (file format, audio too
        // long, network blip) and the paste tab is always a viable fallback.
        setWhisperError(msg);
      }
      setIsAnalyzing(false);
      setUploadPercent(null);
    } finally {
      transcribeAbort.current = null;
    }
  };

  // ─── Analysis: from pasted text ───
  const handleLoadDemo = () => { setTranscript(DEMO_TRANSCRIPT); textareaRef.current?.focus(); };

  const handleAnalyze = async () => {
    if (!transcript.trim()) { alert('Please enter a session transcript'); return; }
    setIsAnalyzing(true);
    try {
      for (let i = 0; i < ANALYSIS_STAGES_TEXT.length; i++) {
        setCurrentStage(i);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Create session via API
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientCode: activeClientCode,
          transcript,
          treatmentGoals,
          sessionNumber,
          date: sessionDate,
          time: sessionTime,
          consentMethod,
          consentVersion: CONSENT_VERSION,
        }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      const { sessionId } = await res.json();

      // Run analysis via API (also updates profile)
      const analyzeRes = await fetch(`/api/sessions/${sessionId}/analyze`, { method: 'POST' });
      if (!analyzeRes.ok) throw new Error('Analysis failed');

      await finishAndRoute(sessionId);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
      setIsAnalyzing(false);
    }
  };

  // ─── Bulk handlers ───
  const handleBulkAudioSelect = useCallback((files: FileList) => {
    const validated: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const error = validateAudioFile(files[i]);
      if (!error) validated.push(files[i]);
    }
    setBulkAudioFiles((prev) => [...prev, ...validated]);
  }, [validateAudioFile]);

  const handleRemoveBulkAudio = useCallback((index: number) => {
    setBulkAudioFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Bulk analysis state ───
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkCurrentIndex, setBulkCurrentIndex] = useState(0);
  const [bulkCurrentStage, setBulkCurrentStage] = useState(0);
  const [bulkResults, setBulkResults] = useState<{ sessionId: string; sessionNumber: number; success: boolean }[]>([]);
  const [bulkComplete, setBulkComplete] = useState(false);

  // ─── Bulk analyze handler ───
  const handleBulkAnalyze = async () => {
    // Gather all transcript chunks from the bulk textarea
    const textChunks = bulkTranscripts.trim()
      ? bulkTranscripts.split(/\n---\n|\n---$|^---\n/).filter((s) => s.trim().length > 50)
      : [];

    // Also gather audio files
    const audioFiles = [...bulkAudioFiles];

    const totalJobs = textChunks.length + audioFiles.length;
    if (totalJobs === 0) { alert('No sessions to analyze. Paste transcripts separated by --- or upload audio files.'); return; }

    setIsBulkAnalyzing(true);
    setBulkTotal(totalJobs);
    setBulkCurrentIndex(0);
    setBulkCurrentStage(0);
    setBulkResults([]);
    setBulkComplete(false);

    const results: { sessionId: string; sessionNumber: number; success: boolean }[] = [];
    let currentSessionNum = sessionNumber;

    // Process text transcripts first
    for (let i = 0; i < textChunks.length; i++) {
      setBulkCurrentIndex(i);
      const chunk = textChunks[i].trim();

      try {
        const stages = ANALYSIS_STAGES_TEXT;
        for (let s = 0; s < stages.length; s++) {
          setBulkCurrentStage(s);
          await new Promise((resolve) => setTimeout(resolve, 600));
        }

        // Create session via API
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientCode: activeClientCode,
            transcript: chunk,
            treatmentGoals,
            sessionNumber: currentSessionNum,
            date: sessionDate,
            time: sessionTime,
            consentMethod,
            consentVersion: CONSENT_VERSION,
          }),
        });
        if (!res.ok) throw new Error('Failed to create session');
        const { sessionId } = await res.json();

        // Run analysis via API (also updates profile)
        const analyzeRes = await fetch(`/api/sessions/${sessionId}/analyze`, { method: 'POST' });
        if (!analyzeRes.ok) throw new Error('Analysis failed');

        results.push({ sessionId, sessionNumber: currentSessionNum, success: true });
      } catch (err) {
        console.error(`Bulk analysis failed for transcript ${i + 1}:`, err);
        results.push({ sessionId: '', sessionNumber: currentSessionNum, success: false });
      }
      currentSessionNum++;
    }

    // Process audio files
    for (let i = 0; i < audioFiles.length; i++) {
      const jobIndex = textChunks.length + i;
      setBulkCurrentIndex(jobIndex);

      try {
        const stages = ANALYSIS_STAGES_AUDIO;
        setBulkCurrentStage(0);
        const { transcript: transcribedText } = await transcribeAudio(audioFiles[i]);

        for (let s = 1; s < stages.length; s++) {
          setBulkCurrentStage(s);
          await new Promise((resolve) => setTimeout(resolve, 600));
        }

        // Create session via API
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientCode: activeClientCode,
            transcript: transcribedText,
            treatmentGoals,
            sessionNumber: currentSessionNum,
            date: sessionDate,
            time: sessionTime,
            consentMethod,
            consentVersion: CONSENT_VERSION,
          }),
        });
        if (!res.ok) throw new Error('Failed to create session');
        const { sessionId } = await res.json();

        // Run analysis via API (also updates profile)
        const analyzeRes = await fetch(`/api/sessions/${sessionId}/analyze`, { method: 'POST' });
        if (!analyzeRes.ok) throw new Error('Analysis failed');

        results.push({ sessionId, sessionNumber: currentSessionNum, success: true });
      } catch (err) {
        console.error(`Bulk analysis failed for audio ${i + 1}:`, err);
        results.push({ sessionId: '', sessionNumber: currentSessionNum, success: false });
      }
      currentSessionNum++;
    }

    setBulkResults(results);
    setBulkComplete(true);
  };

  // Current analysis stages for overlay
  const currentStages = activeTab === 'paste' ? ANALYSIS_STAGES_TEXT : ANALYSIS_STAGES_AUDIO;
  const bulkStages = bulkCurrentIndex < (bulkTranscripts.trim() ? bulkTranscripts.split(/\n---\n|\n---$|^---\n/).filter((s) => s.trim().length > 50).length : 0) ? ANALYSIS_STAGES_TEXT : ANALYSIS_STAGES_AUDIO;

  return (
    <div>
      {/* Back to Home */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />Home
      </Link>

      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-10">
        <StepBadge number={1} label="Client" active={step === 'client'} completed={step !== 'client'} />
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <StepBadge number={2} label="Profile" active={step === 'review'} completed={step === 'input'} />
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <StepBadge number={3} label="Session" active={step === 'input'} completed={false} />
      </div>

      {/* Resume banner on this page — only shown if the user navigated here
          directly (not via the dashboard's resume CTA, which already passed
          the choice through `?resume=&action=`). Once the user has acted via
          URL params or is mid-recording, hide this. */}
      {resumableRecordings.length > 0 && recordingState === 'idle' && !isResumingRecording && !resumeIdParam && (
        <div className="mb-8 border border-amber-200 bg-amber-50 rounded-md p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-amber-700 mb-2">
            Unfinished recording
          </p>
          {resumableRecordings.map((r) => {
            const minutes = Math.max(1, Math.round((Date.now() - r.startedAt) / 60000));
            return (
              <div key={r.id} className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-gray-900">
                    A recording from{' '}
                    <span className="font-mono">{r.clientCode || '—'}</span> ·{' '}
                    started ~{minutes} min{minutes === 1 ? '' : 's'} ago is saved locally.
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Continue capturing where you left off, finalize what&apos;s already there, or discard.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDiscardResumable(r)}
                    className="text-xs text-gray-600 hover:text-gray-900 px-3 py-2"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => handleFinalizeResumable(r)}
                    className="text-xs font-medium border border-amber-300 text-amber-900 px-3 py-2 rounded-md hover:border-amber-500"
                  >
                    Use as-is
                  </button>
                  <button
                    onClick={() => handleContinueResumable(r)}
                    className="text-xs font-medium bg-primary-dark text-white px-3 py-2 rounded-md hover:bg-primary"
                  >
                    Continue recording
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* "Continuing previous recording" notice — shows once the user has
          clicked Continue but hasn't started capturing again yet. Tells them
          how much time is preserved and what happens next. */}
      {isResumingRecording && recordingState === 'idle' && (
        <div className="mb-8 border border-primary-dark/20 bg-bg-warm rounded-md p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-primary-dark mb-1">
              Continuing previous recording
            </p>
            <p className="text-sm text-gray-700">
              {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')} already captured.
              Click the record button below to re-grant audio access and continue.
            </p>
          </div>
          <button
            onClick={() => {
              // Bail out of resume flow — discard the in-memory chunks and
              // start fresh. The IDB row stays (resume banner will show again
              // on next page load) — that's intentional, no data lost.
              audioChunksRef.current = [];
              recordingIdRef.current = null;
              setRecordingSeconds(0);
              setIsResumingRecording(false);
            }}
            className="text-xs text-gray-600 hover:text-gray-900 px-3 py-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ============ STEP 1: CLIENT SELECTION ============ */}
      {step === 'client' && (
        <div className="max-w-2xl">
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-2">Select Client</h2>
          <p className="text-gray-600 mb-8">Choose an existing client to start a new session.</p>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Client Code</label>
            {existingClients.length > 0 ? (
              <select value={clientCode} onChange={(e) => setClientCode(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white">
                <option value="">Select a client...</option>
                {existingClients.map((code) => <option key={code} value={code}>{code}</option>)}
              </select>
            ) : (
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
                <p className="text-gray-600 text-sm mb-3">No clients yet. Create a client first to start a session.</p>
                <Link href="/dashboard/clients" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all">
                  <UserPlus className="w-4 h-4" />Go to Clients
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Session Date</label>
              <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
              <p className="text-gray-400 text-xs mt-2">Change this to backdate a previously recorded session.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Session Time</label>
              <input type="time" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
            </div>
          </div>

          <button onClick={handleClientContinue} disabled={!activeClientCode.trim()} className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark hover: disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
        </div>
      )}

      {/* ============ STEP 2: CLIENT PROFILE & REVIEW ============ */}
      {step === 'review' && (
        <div className="max-w-2xl">
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-2">Client Profile</h2>
          <p className="text-gray-600 mb-6">
            Review <span className="font-mono font-semibold text-gray-900">{activeClientCode}</span> before starting a new session.
          </p>

          {/* Client Info Card */}
          <div className="bg-white rounded-md border border-gray-200 p-6 mb-6 space-y-4">
            {/* Header row */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="font-mono text-lg font-bold text-primary">{activeClientCode.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-gray-900">{activeClientCode}</span>
                  {clientProfile?.gender && !isEditingProfile && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {clientProfile.gender === 'male' ? 'Male' : clientProfile.gender === 'female' ? 'Female' : 'Other'}
                    </span>
                  )}
                  {clientProfile?.ageRange && !isEditingProfile && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{clientProfile.ageRange}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {clientProfile?.totalSessions ?? previousSessions.length} session{(clientProfile?.totalSessions ?? previousSessions.length) !== 1 ? 's' : ''} total
                </p>
              </div>
              <div className="flex items-center gap-2">
                {clientProfile?.currentRiskLevel && !isEditingProfile && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    clientProfile.currentRiskLevel === 'high' ? 'bg-red-100 text-red-700' :
                    clientProfile.currentRiskLevel === 'moderate' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {clientProfile.currentRiskLevel.charAt(0).toUpperCase() + clientProfile.currentRiskLevel.slice(1)} Risk
                  </span>
                )}
                {/* Edit / Save buttons */}
                {!isEditingProfile ? (
                  <button
                    onClick={startEditingProfile}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    title="Edit profile"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleSaveProfileInline}
                      disabled={savingProfile}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {savingProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1.5 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ─── EDIT MODE ─── */}
            {isEditingProfile ? (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Gender</label>
                    <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <option value="">Not specified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Age Range</label>
                    <select value={editAgeRange} onChange={(e) => setEditAgeRange(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <option value="">Not specified</option>
                      <option value="18-24">18-24</option>
                      <option value="25-34">25-34</option>
                      <option value="35-44">35-44</option>
                      <option value="45-54">45-54</option>
                      <option value="55-64">55-64</option>
                      <option value="65+">65+</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Treatment Goals <span className="text-gray-400">(comma-separated)</span></label>
                  <input type="text" value={editGoals} onChange={(e) => setEditGoals(e.target.value)} placeholder="e.g. Reduce anxiety, Improve sleep" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Presenting Concerns <span className="text-gray-400">(comma-separated)</span></label>
                  <input type="text" value={editConcerns} onChange={(e) => setEditConcerns(e.target.value)} placeholder="e.g. Anxiety symptoms, Sleep disturbance" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Preferred Approach</label>
                  <input type="text" value={editApproach} onChange={(e) => setEditApproach(e.target.value)} placeholder="e.g. CBT, Psychodynamic" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Clinical Notes</label>
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Any notes about this client..." rows={3} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                </div>
              </div>
            ) : (
              <>
                {/* ─── VIEW MODE ─── */}
                {/* Treatment Goals */}
                {clientProfile?.treatmentGoals && clientProfile.treatmentGoals.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1.5">Treatment Goals</p>
                    <ul className="space-y-1">
                      {clientProfile.treatmentGoals.map((goal, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Presenting Concerns */}
                {clientProfile?.presentingConcerns && clientProfile.presentingConcerns.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1.5">Presenting Concerns</p>
                    <div className="flex flex-wrap gap-1.5">
                      {clientProfile.presentingConcerns.map((c, i) => (
                        <span key={i} className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structures + Approach */}
                <div className="flex flex-wrap gap-6">
                  {clientProfile?.preferredApproach && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Approach</p>
                      <p className="text-sm text-gray-700">{clientProfile.preferredApproach}</p>
                    </div>
                  )}
                  {clientProfile?.dominantStructures && clientProfile.dominantStructures.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Dominant Structures</p>
                      <div className="flex flex-wrap gap-1">
                        {clientProfile.dominantStructures.map((s) => (
                          <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s.replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Clinical Notes */}
                {clientProfile?.clinicalNotes && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Clinical Notes</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{clientProfile.clinicalNotes}</p>
                  </div>
                )}

                {/* Outcome Measures Summary */}
                {clientProfile?.outcomeTrackingEnabled && clientProfile.outcomeScores && clientProfile.outcomeScores.length > 0 && (() => {
                  const scores = clientProfile.outcomeScores;
                  const latestPhq9 = [...scores].reverse().find((s) => s.phq9 !== null);
                  const latestGad7 = [...scores].reverse().find((s) => s.gad7 !== null);
                  return (
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1.5">Latest Outcome Scores</p>
                      <div className="flex gap-4">
                        {latestPhq9 && (
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-xs text-gray-500">PHQ-9:</span>
                            <span className="font-bold text-gray-900">{latestPhq9.phq9}</span>
                            <span className="text-xs text-gray-400">/27</span>
                          </div>
                        )}
                        {latestGad7 && (
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-xs text-gray-500">GAD-7:</span>
                            <span className="font-bold text-gray-900">{latestGad7.gad7}</span>
                            <span className="text-xs text-gray-400">/21</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* No profile data — prompt to add */}
                {clientProfile && !clientProfile.gender && !clientProfile.treatmentGoals?.length && !clientProfile.presentingConcerns?.length && (
                  <button onClick={startEditingProfile} className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1.5 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                    Add client details (gender, age, goals...)
                  </button>
                )}

                {/* No profile data at all */}
                {!clientProfile && (
                  <p className="text-sm text-gray-400 italic">No profile data available yet. Start analyzing sessions to build this client&apos;s profile.</p>
                )}
              </>
            )}
          </div>

          {/* Previous Sessions */}
          {previousSessions.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Session History ({previousSessions.length})
              </p>
              <div className="space-y-2">
                {previousSessions.map((session) => (
                  <Link key={session.id} href={`/dashboard/session/${session.id}/summary`} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-primary/30 hover: transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><span className="font-mono text-xs font-bold text-primary">#{session.sessionNumber}</span></div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Session #{session.sessionNumber}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><Clock className="w-3 h-3" />{session.date}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button onClick={() => setStep('client')} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">Back</button>
            <button onClick={() => setStep('input')} className="flex-1 px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark hover:">
              Start Session #{sessionNumber}
            </button>
          </div>
        </div>
      )}

      {/* ============ STEP 3: SESSION INPUT ============ */}
      {step === 'input' && (
        <div>
          {/* Session Context Bar */}
          <div className="flex items-center gap-4 mb-8 p-4 bg-white rounded-xl border border-gray-200">
            <span className="font-mono text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-lg">{activeClientCode}</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-600">{sessionDate}</span>
            {isLiveSession && <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Live</span>}
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-600">{sessionTime}</span>
            <button onClick={() => setStep('client')} className="ml-auto text-xs text-primary hover:text-primary-dark font-medium transition-colors">Change</button>
          </div>

          {/* Mode Tabs — Record (live only) | Upload Audio | Paste Transcript */}
          <div className="mb-8 border-b border-gray-200 flex gap-1">
            {isLiveSession && (
              <button
                onClick={() => setActiveTab('record')}
                className={`px-5 py-3 border-b-2  font-semibold text-sm flex items-center gap-2 ${
                  activeTab === 'record'
                    ? 'text-red-600 border-red-500'
                    : 'text-gray-500 border-transparent hover:text-red-500 hover:border-red-300'
                }`}
              >
                <Mic className="w-4 h-4" />
                Record Session
              </button>
            )}
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-5 py-3 border-b-2  font-semibold text-sm flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'text-primary border-primary'
                  : 'text-gray-500 border-transparent hover:text-primary hover:border-primary/30'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Audio
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-5 py-3 border-b-2  font-semibold text-sm flex items-center gap-2 ${
                activeTab === 'paste'
                  ? 'text-primary border-primary'
                  : 'text-gray-500 border-transparent hover:text-primary hover:border-primary/30'
              }`}
            >
              <FileText className="w-4 h-4" />
              Paste Transcript
            </button>
          </div>

          {/* Main Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">

              {/* ====== RECORD TAB (live sessions only) ====== */}
              {activeTab === 'record' && isLiveSession && (
                <>
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Record Session</label>

                    {/* Recording Mode Selector — only show when idle */}
                    {recordingState === 'idle' && (
                      <div className="flex gap-3 mb-5">
                        <button
                          onClick={() => setRecordMode('mic')}
                          className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            recordMode === 'mic'
                              ? 'border-primary bg-primary/5 '
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            recordMode === 'mic' ? 'bg-primary/10' : 'bg-gray-100'
                          }`}>
                            <Mic className={`w-5 h-5 ${recordMode === 'mic' ? 'text-primary' : 'text-gray-400'}`} />
                          </div>
                          <div className="text-left">
                            <p className={`text-sm font-semibold ${recordMode === 'mic' ? 'text-primary' : 'text-gray-700'}`}>In-Person</p>
                            <p className="text-xs text-gray-500">Record with microphone</p>
                          </div>
                        </button>
                        <button
                          onClick={() => videoCallSupported && setRecordMode('system')}
                          disabled={!videoCallSupported}
                          title={videoCallSupported ? undefined : videoCallUnsupportedReason}
                          aria-disabled={!videoCallSupported}
                          className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            !videoCallSupported
                              ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                              : recordMode === 'system'
                                ? 'border-blue-500 bg-blue-50/50 '
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            !videoCallSupported ? 'bg-gray-100' : recordMode === 'system' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Monitor className={`w-5 h-5 ${!videoCallSupported ? 'text-gray-400' : recordMode === 'system' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <div className="text-left">
                            <p className={`text-sm font-semibold ${!videoCallSupported ? 'text-gray-500' : recordMode === 'system' ? 'text-blue-600' : 'text-gray-700'}`}>
                              Video Call
                              {!videoCallSupported && <span className="ml-1 text-[10px] font-medium text-gray-400">· Chrome / Edge only</span>}
                            </p>
                            <p className="text-xs text-gray-500">
                              {videoCallSupported ? 'Zoom, Teams, Meet' : videoCallUnsupportedReason}
                            </p>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* IDLE STATE — Start test */}
                    {recordingState === 'idle' && (
                      <div className={`bg-white border-2 border-dashed rounded-xl p-12 text-center ${
                        recordMode === 'system' ? 'border-blue-300' : 'border-gray-300'
                      }`}>
                        <div className="flex flex-col items-center gap-5">
                          <button
                            onClick={startMicTest}
                            className={`w-24 h-24 rounded-full  hover: hover:scale-105 flex items-center justify-center  group ${
                              recordMode === 'system'
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-primary hover:bg-primary-dark'
                            }`}
                          >
                            {recordMode === 'system' ? (
                              <Headphones className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                            ) : (
                              <Mic className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                            )}
                          </button>
                          <div>
                            {recordMode === 'system' ? (
                              <>
                                <p className="font-semibold text-gray-900 text-lg mb-1">Capture Video Call Audio</p>
                                <p className="text-sm text-gray-500">Share your Zoom/Teams/Meet tab to capture both sides</p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold text-gray-900 text-lg mb-1">Test Microphone</p>
                                <p className="text-sm text-gray-500">We&apos;ll check your mic before recording</p>
                              </>
                            )}
                          </div>
                          {recordMode === 'system' ? (
                            <div className="text-xs text-gray-400 mt-2 max-w-sm space-y-1">
                              <p>1. Click the button above</p>
                              <p>2. Select your video call tab or entire screen</p>
                              <p>3. <strong>Check &quot;Share audio&quot;</strong> at the bottom of the dialog</p>
                              <p>4. Your mic will also be captured automatically</p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-2">
                              Your browser will ask for microphone permission
                            </p>
                          )}
                        </div>
                        {micError && (
                          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{micError}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* MIC/SYSTEM TEST STATE — show live audio levels */}
                    {recordingState === 'testing' && (
                      <div className={`bg-white border-2 rounded-xl p-8 text-center ${
                        recordMode === 'system' ? 'border-blue-300' : 'border-primary/30'
                      }`}>
                        <div className="flex flex-col items-center gap-6">
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                            recordMode === 'system' ? 'bg-blue-100' : 'bg-primary/10'
                          }`}>
                            {recordMode === 'system' ? (
                              <Monitor className="w-8 h-8 text-blue-600" />
                            ) : (
                              <Volume2 className="w-8 h-8 text-primary" />
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900 text-lg mb-1">
                              {recordMode === 'system' ? 'System Audio Test' : 'Microphone Test'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {recordMode === 'system'
                                ? 'Play some audio in your video call to verify capture is working'
                                : 'Speak or make a sound to test your microphone'}
                            </p>
                          </div>

                          {/* Audio level meter */}
                          <div className="w-full max-w-xs">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs text-gray-500 w-12">Level:</span>
                              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-100"
                                  style={{
                                    width: `${micTestLevel}%`,
                                    backgroundColor: micTestLevel > 50 ? '#10B981' : micTestLevel > 15 ? '#F59E0B' : '#E5E7EB',
                                  }}
                                />
                              </div>
                            </div>
                            {/* Visual bars */}
                            <div className="flex items-end justify-center gap-1 h-12 mt-3">
                              {Array.from({ length: 24 }).map((_, i) => {
                                const barHeight = Math.max(4, (micTestLevel / 100) * 48 * (0.5 + Math.random() * 0.5));
                                return (
                                  <div
                                    key={i}
                                    className="w-1.5 rounded-full transition-all duration-150"
                                    style={{
                                      height: `${barHeight}px`,
                                      backgroundColor: micTestLevel > 15 ? '#4F46E5' : '#D1D5DB',
                                      opacity: 0.4 + (micTestLevel / 100) * 0.6,
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          {/* Status message */}
                          <div className="flex items-center gap-2">
                            {micTestPassed ? (
                              <>
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span className="text-sm font-medium text-green-700">
                                  {recordMode === 'system' ? 'Audio capture working — system audio detected!' : 'Microphone working — sound detected!'}
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <span className="text-sm text-amber-700">
                                  {recordMode === 'system' ? 'Waiting for audio... play something in your video call' : 'Waiting for sound... speak or clap near your mic'}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-4">
                            <button
                              onClick={cancelMicTest}
                              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm text-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={startRecording}
                              disabled={!micTestPassed}
                              className="flex items-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold text-sm text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500"
                            >
                              <Mic className="w-4 h-4" />
                              Start Recording
                            </button>
                          </div>
                          {!micTestPassed && (
                            <p className="text-xs text-gray-400">You can only start recording once sound is detected</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* RECORDING STATE — calming breathing animation */}
                    {recordingState === 'recording' && (
                      <div className="bg-gradient-to-b from-mint-50/50 to-white border border-mint-200/60 rounded-xl p-10 text-center">
                        <div className="flex flex-col items-center gap-8">
                          {/* Calming concentric circles */}
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            {/* Outer breathing ring */}
                            <div className="absolute inset-0 rounded-full bg-primary/10 animate-breathe-slow" />
                            {/* Middle breathing ring */}
                            <div className="absolute inset-3 rounded-full bg-primary/15 animate-breathe" style={{ animationDelay: '1s' }} />
                            {/* Inner solid circle */}
                            <div className="relative w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                              <Mic className="w-7 h-7 text-primary" />
                            </div>
                            {/* Orbiting dot */}
                            <div className="absolute inset-0 animate-orbit">
                              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-float-dot" style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-5px' }} />
                            </div>
                          </div>

                          <div>
                            <p className="font-mono text-4xl font-bold text-gray-900 mb-2 tracking-wider">{formatTime(recordingSeconds)}</p>
                            <div className="flex items-center justify-center gap-2">
                              <span className="w-2 h-2 bg-primary rounded-full pulse-soft" />
                              <span className="text-sm font-medium text-primary/80">Recording in progress</span>
                            </div>
                          </div>

                          {/* Subtle wave visualization */}
                          <div className="flex items-center gap-0.5 h-6 opacity-50">
                            {Array.from({ length: 40 }).map((_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-primary/40 rounded-full"
                                style={{
                                  height: `${6 + Math.sin(Date.now() / 800 + i * 0.3) * 10 + Math.random() * 4}px`,
                                  transition: 'height 0.5s ease',
                                }}
                              />
                            ))}
                          </div>

                          <p className="text-xs text-gray-400 max-w-sm">Session is being recorded. You can minimize this window — recording continues in the background.</p>

                          {/* Controls */}
                          <div className="flex items-center gap-4">
                            <button onClick={pauseRecording} className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-semibold text-sm text-gray-700 transition-colors">
                              <Pause className="w-4 h-4" />Pause
                            </button>
                            <button onClick={stopRecording} className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl font-semibold text-sm text-white transition-colors">
                              <Square className="w-4 h-4" />End Session
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PAUSED STATE */}
                    {recordingState === 'paused' && (
                      <div className="bg-white border-2 border-amber-200 rounded-xl p-8 text-center">
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
                            <Pause className="w-8 h-8 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-mono text-4xl font-bold text-gray-900 mb-1">{formatTime(recordingSeconds)}</p>
                            <p className="text-sm font-medium text-amber-600">Paused</p>
                          </div>
                          <p className="text-xs text-gray-400">Recording is paused. No audio is being captured.</p>
                          <div className="flex items-center gap-4">
                            <button onClick={resumeRecording} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark rounded-xl font-semibold text-sm text-white transition-colors">
                              <Play className="w-4 h-4" />Resume
                            </button>
                            <button onClick={stopRecording} className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl font-semibold text-sm text-white transition-colors">
                              <Square className="w-4 h-4" />End Session
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DONE STATE — with double-confirm restart */}
                    {recordingState === 'done' && recordedBlob && (
                      <div className="bg-white border border-primary/30 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">Session Recording Complete</p>
                            <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                              <span>{formatTime(recordingSeconds)}</span>
                              <span className="text-gray-300">|</span>
                              <span>{formatFileSize(recordedBlob.size)}</span>
                            </div>
                            {recordedUrl && (
                              <audio controls src={recordedUrl} className="mt-3 w-full h-10" />
                            )}
                            <div className="mt-3 flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                Ready to analyze
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {!showRestartConfirm ? (
                              <button onClick={resetRecording} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Re-record">
                                <RotateCcw className="w-5 h-5" />
                              </button>
                            ) : (
                              <div className="flex flex-col items-end gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 -mr-1 -mt-1">
                                <p className="text-xs text-amber-800 font-medium">Delete this recording?</p>
                                <div className="flex items-center gap-2">
                                  <button onClick={cancelRestart} className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                    Keep
                                  </button>
                                  <button onClick={resetRecording} className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                                    Delete & Restart
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Treatment Goals + Session Number (show when not actively recording) */}
                  {(recordingState === 'idle' || recordingState === 'testing' || recordingState === 'done') && (
                    <>
                      <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Treatment Goals (optional)</label>
                        <input type="text" value={treatmentGoals} onChange={(e) => setTreatmentGoals(e.target.value)} placeholder="e.g., Reduce anxiety, improve workplace confidence, process past experiences" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:" />
                      </div>
                      <div className="mb-10">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Session Number</label>
                        <div className="flex items-center gap-4">
                          <button onClick={() => setSessionNumber(Math.max(1, sessionNumber - 1))} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400">−</button>
                          <input type="number" value={sessionNumber} onChange={(e) => setSessionNumber(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" min="1" />
                          <button onClick={() => setSessionNumber(sessionNumber + 1)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400">+</button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Analyze button (only when recording is done) */}
                  {recordingState === 'done' && (
                    <button
                      onClick={handleRecordingAnalyze}
                      disabled={isAnalyzing || !recordedBlob}
                      className="w-full px-6 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark hover: disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</> : 'Analyze Session'}
                    </button>
                  )}
                </>
              )}

              {/* ====== UPLOAD AUDIO TAB ====== */}
              {activeTab === 'upload' && (
                <>
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Upload Session Recording</label>
                    <input ref={audioInputRef} type="file" accept={ACCEPTED_AUDIO_TYPES} onChange={handleFileInputChange} className="hidden" />

                    {!audioFile ? (
                      <div
                        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                        onClick={() => audioInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer  ${isDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isDragOver ? 'bg-primary/20' : 'bg-primary/10'}`}>
                            <Upload className={`w-7 h-7 ${isDragOver ? 'text-primary' : 'text-primary/70'}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">{isDragOver ? 'Drop audio file here' : 'Drop audio file here or click to browse'}</p>
                            <p className="text-sm text-gray-500">Upload a previously recorded therapy session</p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2 mt-2">
                            {['MP3', 'WAV', 'M4A', 'WebM', 'OGG', 'AAC', 'FLAC'].map((fmt) => (
                              <span key={fmt} className="text-xs font-mono px-2 py-0.5 bg-gray-200 text-gray-600 rounded">.{fmt.toLowerCase()}</span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Max 500MB per file</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-primary/30 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><FileAudio className="w-7 h-7 text-primary" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{audioFile.name}</p>
                            <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                              <span>{formatFileSize(audioFile.size)}</span>
                              <span className="text-gray-300">|</span>
                              <span>Est. duration: {estimateDuration(audioFile.size)}</span>
                            </div>
                            <div className="mt-3"><span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Ready to analyze</span></div>
                          </div>
                          <button onClick={handleRemoveAudio} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove file"><X className="w-5 h-5" /></button>
                        </div>
                      </div>
                    )}

                    {audioError && <p className="text-red-600 text-sm mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">{audioError}</p>}
                    <p className="text-gray-500 text-sm mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">Audio will be transcribed using AI, then analyzed across all 10 phenomenological structures.</p>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Treatment Goals (optional)</label>
                    <input type="text" value={treatmentGoals} onChange={(e) => setTreatmentGoals(e.target.value)} placeholder="e.g., Reduce anxiety, improve workplace confidence, process past experiences" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:" />
                  </div>
                  <div className="mb-10">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Session Number</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSessionNumber(Math.max(1, sessionNumber - 1))} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400">−</button>
                      <input type="number" value={sessionNumber} onChange={(e) => setSessionNumber(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" min="1" />
                      <button onClick={() => setSessionNumber(sessionNumber + 1)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400">+</button>
                    </div>
                  </div>

                  {/* Audio-tab consent gate. Mirrors the paste-tab block so
                      both entry points enforce GDPR consent before sending
                      transcript material to the analysis pipeline. */}
                  <div className="mb-6 p-4 border-2 border-amber-200 bg-amber-50 rounded-xl space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        className="w-5 h-5 mt-0.5 border-2 border-amber-400 rounded focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm text-gray-900">
                        I confirm the client has consented to this session being analyzed by AI for clinical decision support.
                      </span>
                    </label>
                    <div className="flex items-center gap-2 pl-8 flex-wrap">
                      <span className="text-xs text-gray-700 font-medium">Consent obtained:</span>
                      {(['verbal', 'written', 'electronic'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setConsentMethod(m)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            consentMethod === m
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-primary/40'
                          }`}
                        >
                          {m === 'verbal' && 'Verbally at session start'}
                          {m === 'written' && 'Written form on file'}
                          {m === 'electronic' && 'Electronically signed'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleAudioAnalyze} disabled={isAnalyzing || !audioFile || !consentGiven} className="w-full px-6 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark hover: disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isAnalyzing ? (
                      uploadPercent !== null && uploadPercent < 100
                        ? <><Loader2 className="w-5 h-5 animate-spin" />Uploading… {uploadPercent}%</>
                        : <><Loader2 className="w-5 h-5 animate-spin" />Transcribing audio…</>
                    ) : <><Upload className="w-5 h-5" />Upload & Analyze</>}
                  </button>

                  {/* Upload progress bar — visible only during the upload
                      portion. Once Whisper takes over server-side, we drop to
                      an indeterminate "Transcribing audio…" label above. */}
                  {isAnalyzing && uploadPercent !== null && uploadPercent < 100 && (
                    <div className="mt-3 space-y-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${uploadPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Uploading audio to transcription service…</span>
                        <button
                          type="button"
                          onClick={handleCancelTranscribe}
                          className="text-primary hover:text-primary-dark font-medium underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Whisper failure → offer paste-instead fallback. Audio
                      transcription is brittle (file format quirks, length
                      limits, network issues); the paste tab is always a
                      viable backup, so we surface that path explicitly
                      rather than just showing an error. */}
                  {whisperError && !isAnalyzing && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900 mb-1">Transcription failed</p>
                          <p className="text-xs text-red-700 mb-3">{whisperError}</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { setWhisperError(''); }}
                              className="text-xs px-3 py-1.5 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition"
                            >
                              Try again
                            </button>
                            <button
                              type="button"
                              onClick={() => { setWhisperError(''); setActiveTab('paste'); }}
                              className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                            >
                              Paste transcript instead
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bulk Upload Section — hidden in v1.
                      Set NEXT_PUBLIC_FEATURE_BULK_UPLOAD=1 to expose it.
                      The implementation stays in the source so we can ship it
                      in v1.1 without re-building the upload flow. */}
                  {process.env.NEXT_PUBLIC_FEATURE_BULK_UPLOAD === '1' && (
                  <div className="border-t border-gray-200 pt-8 mt-12">
                    <button onClick={() => setExpandedBulk(!expandedBulk)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <span className="font-semibold text-gray-900">Upload Multiple Sessions</span>
                      <span className={`transition-transform duration-200 ${expandedBulk ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {expandedBulk && (
                      <div className="mt-4 space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">Upload Multiple Audio Files</label>
                          <input ref={bulkAudioInputRef} type="file" accept={ACCEPTED_AUDIO_TYPES} multiple onChange={(e) => { if (e.target.files) handleBulkAudioSelect(e.target.files); if (bulkAudioInputRef.current) bulkAudioInputRef.current.value = ''; }} className="hidden" />
                          <button onClick={() => bulkAudioInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer">
                            <div className="flex flex-col items-center gap-2">
                              <Music className="w-6 h-6 text-gray-400" />
                              <p className="text-sm font-medium text-gray-600">Click to select multiple audio files</p>
                              <p className="text-xs text-gray-400">Each file will be transcribed and analyzed as a separate session</p>
                            </div>
                          </button>
                          {bulkAudioFiles.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {bulkAudioFiles.map((file, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                                  <FileAudio className="w-4 h-4 text-primary flex-shrink-0" />
                                  <span className="text-sm text-gray-900 truncate flex-1">{file.name}</span>
                                  <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(file.size)}</span>
                                  <button onClick={() => handleRemoveBulkAudio(index)} className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                                </div>
                              ))}
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg"><p className="text-sm text-blue-900 font-semibold">{bulkAudioFiles.length} audio file{bulkAudioFiles.length !== 1 ? 's' : ''} selected</p></div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <span className="text-xs font-medium text-gray-400 uppercase">or</span>
                          <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">Paste Multiple Transcripts</label>
                          <textarea ref={bulkRef} value={bulkTranscripts} onChange={(e) => setBulkTranscripts(e.target.value)} placeholder={"Paste multiple session transcripts separated by '---' on a new line.\n\nExample:\n[Session 1 transcript...]\n---\n[Session 2 transcript...]\n---\n[Session 3 transcript...]"} className="w-full min-h-[200px] p-4 border border-gray-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus: resize-none" />
                          <p className="text-gray-500 text-xs mt-2 font-mono">{bulkTranscripts.length} characters</p>
                        </div>

                        {bulkTranscripts.trim() && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg"><p className="text-sm text-blue-900 font-semibold">{bulkTranscripts.split('---').filter((s) => s.trim().length > 0).length} transcript(s) detected</p></div>
                        )}

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-900">Each session will be analyzed separately and linked to <span className="font-mono font-semibold">{activeClientCode}</span>.</p>
                        </div>

                        <button onClick={handleBulkAnalyze} disabled={isBulkAnalyzing || (bulkAudioFiles.length === 0 && !bulkTranscripts.trim())} className="w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none flex items-center justify-center gap-2">
                          {isBulkAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</> : 'Analyze All Sessions'}
                          {(bulkAudioFiles.length > 0 || bulkTranscripts.trim()) && (
                            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                              {bulkAudioFiles.length + (bulkTranscripts.trim() ? bulkTranscripts.split('---').filter((s) => s.trim().length > 0).length : 0)}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  )}
                </>
              )}

              {/* ====== PASTE TRANSCRIPT TAB ====== */}
              {activeTab === 'paste' && (
                <>
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Session Transcript</label>
                    <textarea ref={textareaRef} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste your therapy session transcript here. Include therapist and client dialogue..." className="w-full min-h-[400px] p-4 border border-gray-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus: resize-none" />
                    <p className="text-gray-500 text-xs mt-2 font-mono">{transcript.length} characters</p>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Treatment Goals (optional)</label>
                    <input type="text" value={treatmentGoals} onChange={(e) => setTreatmentGoals(e.target.value)} placeholder="e.g., Reduce anxiety, improve workplace confidence, process past experiences" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:" />
                  </div>
                  <div className="mb-10">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Session Number</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSessionNumber(Math.max(1, sessionNumber - 1))} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400">−</button>
                      <input type="number" value={sessionNumber} onChange={(e) => setSessionNumber(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" min="1" />
                      <button onClick={() => setSessionNumber(sessionNumber + 1)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400">+</button>
                    </div>
                  </div>

                  {/* GDPR consent attestation. Required (gates the Analyze
                      button). Method selector lets the clinician record HOW
                      consent was obtained — verbal at session start, written
                      form on file, or electronic signature in-app. The choice
                      is persisted on the sessions row so we can prove it
                      later if the client exercises data rights. */}
                  <div className="mb-8 p-4 border-2 border-amber-200 bg-amber-50 rounded-xl space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        className="w-5 h-5 mt-0.5 border-2 border-amber-400 rounded focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm text-gray-900">
                        I confirm the client has consented to this session being analyzed by AI for clinical decision support. The recorded transcript and analysis are stored under our privacy policy and will be deleted on request.
                      </span>
                    </label>
                    <div className="flex items-center gap-2 pl-8 flex-wrap">
                      <span className="text-xs text-gray-700 font-medium">Consent obtained:</span>
                      {(['verbal', 'written', 'electronic'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setConsentMethod(m)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            consentMethod === m
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-primary/40'
                          }`}
                        >
                          {m === 'verbal' && 'Verbally at session start'}
                          {m === 'written' && 'Written form on file'}
                          {m === 'electronic' && 'Electronically signed'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 mb-12">
                    <button onClick={handleLoadDemo} disabled={isAnalyzing} className="px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-xl font-semibold hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed">Load Demo Session</button>
                    <button onClick={handleAnalyze} disabled={isAnalyzing || !transcript.trim() || !consentGiven} className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark hover: disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</> : 'Analyze Session'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Privacy card — expanded to spell out the four concrete privacy
                  promises a clinician and client need to hear before sharing
                  session content with any AI tool. Each line is a specific
                  commitment, not generic language. */}
              <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <ShieldCheck className="w-6 h-6 text-success mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Privacy First</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">100% private — for both clinician and client.</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm pl-1">
                  <li className="flex items-start gap-2.5">
                    <Eye className="w-4 h-4 text-success/80 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-900">Anonymous codes only.</span> Real names never enter Session Polaris — your client dictionary stays with you.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Brain className="w-4 h-4 text-success/80 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-900">Never used to train AI.</span> Session content is never used for model training, benchmarking, or any third-party research.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Monitor className="w-4 h-4 text-success/80 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-900">Your edits live on your device.</span> Notes, sign-offs, and clinical-note edits are stored locally — not in a shared cloud.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <RotateCcw className="w-4 h-4 text-success/80 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-900">You stay in control.</span> Export or delete any session at any time — no retention without your consent.
                    </span>
                  </li>
                </ul>
              </div>

              {/* "What happens next" workflow preview — replaces the prior
                  "Analysis Includes" feature list (that content lives on the
                  landing page; here it's redundant). This sets expectations
                  about the 4-step workflow ahead and reinforces that the
                  clinician — not the AI — has the final word. */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-playfair font-bold text-gray-900 mb-1 text-lg">What happens next</h3>
                <p className="text-xs text-gray-500 mb-5">The workflow ahead, in four steps.</p>
                <ol className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        Transcribe &amp; segment
                      </p>
                      <p className="text-gray-600 text-xs leading-relaxed mt-0.5">If you uploaded audio, we transcribe it. The session is then split into discrete moments.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                        Pattern surfacing
                      </p>
                      <p className="text-gray-600 text-xs leading-relaxed mt-0.5">Each moment is coded across 10 phenomenological dimensions. Risk signals, cognitive distortions, and matches against similar lived experiences are surfaced.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                        You review &amp; edit
                      </p>
                      <p className="text-gray-600 text-xs leading-relaxed mt-0.5">Every section is editable. Override any AI draft, add your own clinical observations, trace any claim back to the source quote.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                        You sign off
                      </p>
                      <p className="text-gray-600 text-xs leading-relaxed mt-0.5">Set your own risk score, confirm your assessment, lock the record. Your clinical judgment is the authoritative one — never the AI&apos;s.</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Analysis Progress Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-12 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h3 className="font-playfair text-3xl font-bold text-gray-900 mb-6">Analyzing Session</h3>
              <p className="text-gray-600 mb-10 font-medium min-h-7 text-sm leading-relaxed">{currentStages[currentStage] || 'Processing...'}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary-light h-full" style={{ width: `${((currentStage + 1) / currentStages.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Analysis Progress Overlay */}
      {isBulkAnalyzing && !bulkComplete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-10 max-w-lg w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Analyzing Sessions</h3>
              <p className="text-lg font-semibold text-primary mb-6">
                Session {bulkCurrentIndex + 1} of {bulkTotal}
              </p>

              {/* Per-session stage */}
              <p className="text-gray-600 mb-6 text-sm font-medium min-h-6">
                {bulkStages[bulkCurrentStage] || 'Processing...'}
              </p>

              {/* Overall progress */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Current session</span>
                    <span>{Math.round(((bulkCurrentStage + 1) / bulkStages.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${((bulkCurrentStage + 1) / bulkStages.length) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Overall</span>
                    <span>{Math.round(((bulkCurrentIndex) / bulkTotal) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-emerald-500 h-full rounded-full" style={{ width: `${((bulkCurrentIndex) / bulkTotal) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Session pills */}
              <div className="flex items-center justify-center gap-1.5 mt-6">
                {Array.from({ length: bulkTotal }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      i < bulkCurrentIndex
                        ? 'bg-emerald-100 text-emerald-700'
                        : i === bulkCurrentIndex
                          ? 'bg-primary text-white scale-110 '
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {i < bulkCurrentIndex ? '✓' : i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Analysis Complete Overlay */}
      {isBulkAnalyzing && bulkComplete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-10 max-w-lg w-full mx-4">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">All Sessions Analyzed</h3>
              <p className="text-gray-500 text-sm">
                {bulkResults.filter((r) => r.success).length} of {bulkResults.length} sessions analyzed successfully
              </p>
            </div>

            {/* Results list */}
            <div className="space-y-2 mb-8 max-h-60 overflow-y-auto">
              {bulkResults.map((result, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${result.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {result.success ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Session #{result.sessionNumber}</p>
                    <p className="text-xs text-gray-500">{result.success ? 'Analysis complete' : 'Failed'}</p>
                  </div>
                  {result.success && (
                    <Link
                      href={`/dashboard/session/${result.sessionId}/summary`}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      View →
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsBulkAnalyzing(false);
                  setBulkComplete(false);
                  setBulkTranscripts('');
                  setBulkAudioFiles([]);
                }}
                className="flex-1 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Add More Sessions
              </button>
              <Link
                href={`/dashboard/clients/${encodeURIComponent(activeClientCode)}`}
                className="flex-1 px-5 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all text-sm text-center"
              >
                View Client Profile →
              </Link>
            </div>

            {/* Quick links to individual sessions */}
            {bulkResults.filter((r) => r.success).length > 0 && (
              <p className="text-center text-xs text-gray-400 mt-4">
                Click &quot;View →&quot; next to any session to see its detailed analysis
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StepBadge({ number, label, active, completed, skip }: {
  number: number; label: string; active: boolean; completed: boolean; skip?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${active ? 'bg-primary text-white' : completed ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-400'}`}>
        {completed ? '✓' : number}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-gray-900' : completed ? 'text-primary' : 'text-gray-400'} ${skip ? 'line-through' : ''}`}>{label}</span>
    </div>
  );
}
