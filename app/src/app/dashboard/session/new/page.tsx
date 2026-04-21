'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DEMO_TRANSCRIPT } from '@/lib/analysis/demo-transcript';
import { transcribeAudio, formatFileSize, estimateDuration, ACCEPTED_AUDIO_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/analysis/mock-transcription';
import { useApi } from '@/hooks/use-api';

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
import { ShieldCheck, Loader2, ArrowLeft, Clock, ChevronRight, UserPlus, Upload, FileAudio, X, Music, FileText, Mic, Square, Pause, Play, RotateCcw, CheckCircle2, AlertTriangle, Volume2, Monitor, Headphones, Edit3, Save, Check } from 'lucide-react';

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

  // Step flow — skip to input if client is pre-filled
  const [step, setStep] = useState<Step>(prefillClient ? 'input' : 'client');

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
  const [consentGiven, setConsentGiven] = useState(false);
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

        const displaySource = audioContext.createMediaStreamSource(displayStream);
        displaySource.connect(destination);

        if (micStream) {
          const micSource = audioContext.createMediaStreamSource(micStream);
          micSource.connect(destination);
          streamRef.current = micStream; // Keep ref for cleanup
        }

        // The merged stream is what we'll record
        const mergedStream = destination.stream;

        // Use merged stream as the "recording stream" — store in a way startRecording can use it
        // We'll temporarily store it in streamRef if no mic, or create a combined ref
        if (!micStream) {
          streamRef.current = mergedStream;
        } else {
          // Replace streamRef with merged stream for recording
          streamRef.current = mergedStream;
        }

        // Set up analyser on merged stream
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        displaySource.connect(analyser);
        analyserRef.current = analyser;

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

    const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
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
    };

    mediaRecorder.start(1000);
    recordingStateRef.current = 'recording';
    setRecordingState('recording');
    setRecordingSeconds(0);

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
      const transcribedText = await transcribeAudio(file);

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

  // ─── Analysis: from uploaded audio ───
  const handleAudioAnalyze = async () => {
    if (!audioFile) return;
    setIsAnalyzing(true);
    try {
      setCurrentStage(0);
      const transcribedText = await transcribeAudio(audioFile);
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
        const transcribedText = await transcribeAudio(audioFiles[i]);

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

          <button onClick={handleClientContinue} disabled={!activeClientCode.trim()} className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
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
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 space-y-4">
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
                  <Link key={session.id} href={`/dashboard/session/${session.id}/summary`} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-sm transition-all group">
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
            <button onClick={() => setStep('input')} className="flex-1 px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-sm hover:shadow-md transition-all duration-200">
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
                className={`px-5 py-3 border-b-2 transition-all duration-200 font-semibold text-sm flex items-center gap-2 ${
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
              className={`px-5 py-3 border-b-2 transition-all duration-200 font-semibold text-sm flex items-center gap-2 ${
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
              className={`px-5 py-3 border-b-2 transition-all duration-200 font-semibold text-sm flex items-center gap-2 ${
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
                              ? 'border-primary bg-primary/5 shadow-sm'
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
                          onClick={() => setRecordMode('system')}
                          className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            recordMode === 'system'
                              ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            recordMode === 'system' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Monitor className={`w-5 h-5 ${recordMode === 'system' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <div className="text-left">
                            <p className={`text-sm font-semibold ${recordMode === 'system' ? 'text-blue-600' : 'text-gray-700'}`}>Video Call</p>
                            <p className="text-xs text-gray-500">Zoom, Teams, Meet</p>
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
                            className={`w-24 h-24 rounded-full shadow-sm hover:shadow-md hover:scale-105 flex items-center justify-center transition-all duration-200 group ${
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
                              className="flex items-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold text-sm text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500"
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
                            <button onClick={pauseRecording} className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-semibold text-sm text-gray-700 transition-colors shadow-sm">
                              <Pause className="w-4 h-4" />Pause
                            </button>
                            <button onClick={stopRecording} className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl font-semibold text-sm text-white transition-colors shadow-sm">
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
                            <button onClick={resumeRecording} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark rounded-xl font-semibold text-sm text-white transition-colors shadow-sm">
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
                      <div className="bg-white border border-primary/30 rounded-xl p-6 shadow-sm">
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
                        <input type="text" value={treatmentGoals} onChange={(e) => setTreatmentGoals(e.target.value)} placeholder="e.g., Reduce anxiety, improve workplace confidence, process past experiences" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:shadow-md transition-all duration-200" />
                      </div>
                      <div className="mb-10">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Session Number</label>
                        <div className="flex items-center gap-4">
                          <button onClick={() => setSessionNumber(Math.max(1, sessionNumber - 1))} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">−</button>
                          <input type="number" value={sessionNumber} onChange={(e) => setSessionNumber(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200" min="1" />
                          <button onClick={() => setSessionNumber(sessionNumber + 1)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">+</button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Analyze button (only when recording is done) */}
                  {recordingState === 'done' && (
                    <button
                      onClick={handleRecordingAnalyze}
                      disabled={isAnalyzing || !recordedBlob}
                      className="w-full px-6 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${isDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}
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
                      <div className="bg-white border border-primary/30 rounded-xl p-6 shadow-sm">
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
                    <input type="text" value={treatmentGoals} onChange={(e) => setTreatmentGoals(e.target.value)} placeholder="e.g., Reduce anxiety, improve workplace confidence, process past experiences" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:shadow-md transition-all duration-200" />
                  </div>
                  <div className="mb-10">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Session Number</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSessionNumber(Math.max(1, sessionNumber - 1))} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">−</button>
                      <input type="number" value={sessionNumber} onChange={(e) => setSessionNumber(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200" min="1" />
                      <button onClick={() => setSessionNumber(sessionNumber + 1)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">+</button>
                    </div>
                  </div>

                  <button onClick={handleAudioAnalyze} disabled={isAnalyzing || !audioFile} className="w-full px-6 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</> : <><Upload className="w-5 h-5" />Upload & Analyze</>}
                  </button>

                  {/* Bulk Upload Section */}
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
                          <textarea ref={bulkRef} value={bulkTranscripts} onChange={(e) => setBulkTranscripts(e.target.value)} placeholder={"Paste multiple session transcripts separated by '---' on a new line.\n\nExample:\n[Session 1 transcript...]\n---\n[Session 2 transcript...]\n---\n[Session 3 transcript...]"} className="w-full min-h-[200px] p-4 border border-gray-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:shadow-md resize-none transition-all duration-200" />
                          <p className="text-gray-500 text-xs mt-2 font-mono">{bulkTranscripts.length} characters</p>
                        </div>

                        {bulkTranscripts.trim() && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg"><p className="text-sm text-blue-900 font-semibold">{bulkTranscripts.split('---').filter((s) => s.trim().length > 0).length} transcript(s) detected</p></div>
                        )}

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-900">Each session will be analyzed separately and linked to <span className="font-mono font-semibold">{activeClientCode}</span>.</p>
                        </div>

                        <button onClick={handleBulkAnalyze} disabled={isBulkAnalyzing || (bulkAudioFiles.length === 0 && !bulkTranscripts.trim())} className="w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none flex items-center justify-center gap-2">
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
                </>
              )}

              {/* ====== PASTE TRANSCRIPT TAB ====== */}
              {activeTab === 'paste' && (
                <>
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Session Transcript</label>
                    <textarea ref={textareaRef} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste your therapy session transcript here. Include therapist and client dialogue..." className="w-full min-h-[400px] p-4 border border-gray-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:shadow-md resize-none transition-all duration-200" />
                    <p className="text-gray-500 text-xs mt-2 font-mono">{transcript.length} characters</p>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Treatment Goals (optional)</label>
                    <input type="text" value={treatmentGoals} onChange={(e) => setTreatmentGoals(e.target.value)} placeholder="e.g., Reduce anxiety, improve workplace confidence, process past experiences" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:shadow-md transition-all duration-200" />
                  </div>
                  <div className="mb-10">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Session Number</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSessionNumber(Math.max(1, sessionNumber - 1))} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">−</button>
                      <input type="number" value={sessionNumber} onChange={(e) => setSessionNumber(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200" min="1" />
                      <button onClick={() => setSessionNumber(sessionNumber + 1)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">+</button>
                    </div>
                  </div>

                  {/* Therapist Consent Confirmation */}
                  <div className="mb-8 p-4 border-2 border-amber-200 bg-amber-50 rounded-xl">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        className="w-5 h-5 mt-0.5 border-2 border-amber-400 rounded focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm text-gray-900">
                        I confirm that the client has verbally consented to this session being recorded and analyzed. This consent was obtained at the beginning of the session.
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-4 mb-12">
                    <button onClick={handleLoadDemo} disabled={isAnalyzing} className="px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-xl font-semibold hover:border-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">Load Demo Session</button>
                    <button onClick={handleAnalyze} disabled={isAnalyzing || !transcript.trim() || !consentGiven} className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</> : 'Analyze Session'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-success mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Privacy First</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">Only the client code is stored as an identifier. No real names enter the system.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-playfair font-bold text-gray-900 mb-5 text-lg">Analysis Includes</h3>
                <ul className="space-y-4 text-sm">
                  {['AI audio transcription', '10 phenomenological structure codes', 'Risk signal detection', 'Similar case matches', 'Practitioner methodology matches', 'Clinician & patient reports'].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-gray-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Analysis Progress Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-12 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h3 className="font-playfair text-3xl font-bold text-gray-900 mb-6">Analyzing Session</h3>
              <p className="text-gray-600 mb-10 font-medium min-h-7 text-sm leading-relaxed">{currentStages[currentStage] || 'Processing...'}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary-light h-full transition-all duration-500" style={{ width: `${((currentStage + 1) / currentStages.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Analysis Progress Overlay */}
      {isBulkAnalyzing && !bulkComplete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 max-w-lg w-full mx-4 shadow-2xl">
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
                    <div className="bg-primary h-full transition-all duration-500 rounded-full" style={{ width: `${((bulkCurrentStage + 1) / bulkStages.length) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Overall</span>
                    <span>{Math.round(((bulkCurrentIndex) / bulkTotal) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-emerald-500 h-full transition-all duration-500 rounded-full" style={{ width: `${((bulkCurrentIndex) / bulkTotal) * 100}%` }} />
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
                          ? 'bg-primary text-white scale-110 shadow-md'
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
          <div className="bg-white rounded-2xl p-10 max-w-lg w-full mx-4 shadow-2xl">
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
                className="flex-1 px-5 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-sm transition-all text-sm text-center"
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
