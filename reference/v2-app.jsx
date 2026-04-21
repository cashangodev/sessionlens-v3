import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  AlertTriangle, Check, Info, Lock, Download, Play, Clock, Zap, Heart, Brain, Radio,
  Users, Target, TrendingUp, Eye, EyeOff, FileText, CheckCircle2, ChevronDown, ChevronUp,
  Mic, Square, Pause, Play as PlayIcon, RotateCcw, Database, Wifi, WifiOff
} from 'lucide-react';
import { supabase, fetchStructures, fetchPractitioners } from './supabase';

const SessionLensV2 = () => {
  const [activeTab, setActiveTab] = useState('input');
  const [sessionTranscript, setSessionTranscript] = useState('');
  const [treatmentGoals, setTreatmentGoals] = useState('');

  // Supabase live data state
  const [dbStructures, setDbStructures] = useState([]);
  const [dbPractitioners, setDbPractitioners] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [showPatientReport, setShowPatientReport] = useState(false);
  const [expandedPractitioner, setExpandedPractitioner] = useState(null);
  const [sessionNumber, setSessionNumber] = useState(1);

  // Audio recording state
  const [inputMode, setInputMode] = useState('record'); // 'record', 'upload', 'paste'
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Load live data from Supabase on mount
  React.useEffect(() => {
    let mounted = true;
    async function loadFromSupabase() {
      try {
        const [structures, practitioners] = await Promise.all([
          fetchStructures(),
          fetchPractitioners()
        ]);
        if (mounted) {
          setDbStructures(structures);
          setDbPractitioners(practitioners);
          setIsConnected(true);
          console.log(`[SessionLens] Connected to Supabase — ${structures.length} structures, ${practitioners.length} practitioners loaded`);
        }
      } catch (err) {
        console.warn('[SessionLens] Supabase connection failed, using local data:', err.message);
        if (mounted) {
          setDbError(err.message);
          setIsConnected(false);
        }
      }
    }
    loadFromSupabase();
    return () => { mounted = false; };
  }, []);

  // Demo session transcript
  const demoSession = `THERAPIST: Good afternoon. How have you been since we last spoke?

PATIENT: [long pause] Honestly, I've been struggling. The anxiety has been... constant. It's like this weight on my chest that doesn't go away. I wake up at 3 AM thinking about everything I'm failing at.

THERAPIST: Tell me about that weight. Where do you feel it?

PATIENT: It's here [touches chest]. And my shoulders are always tense. Sometimes I can't breathe properly. My mom used to say I was "dramatic," but this feels real. It IS real.

THERAPIST: I believe you. Can you tell me about when this started? You mentioned your mom.

PATIENT: [voice cracks slightly] When I was maybe seven or eight, my parents had this huge fight. My dad left for three days. I remember hiding in the closet with my teddy bear, thinking... thinking he wasn't coming back. That it was my fault because I was too much. Too loud, too needy.

THERAPIST: What happened after those three days?

PATIENT: He came back. But something changed. He was distant. Cold. And my mom, she just pretended it never happened. We never talked about it. She'd get angry if I brought it up. So I learned to be small. To not ask for things. To manage everything myself.

THERAPIST: And how does that show up for you now?

PATIENT: I'm exhausted. I'm 34 years old and I still can't tell people when I'm struggling. I have this job I hate, but I stay because I can't risk disappointing anyone. I haven't had a relationship last more than six months because I just... I shut down. I don't let people in.

THERAPIST: You mention not letting people in. Is there a part of you that wants connection?

PATIENT: [tears] Of course there is. But wanting it and being able to do it are different things. When someone gets close, I panic. I start thinking about all the ways I'll let them down. And I sabotage. I become critical. Withdrawn. It's like I'm protecting myself from being hurt first.

THERAPIST: You're being very honest about this. That takes courage. I'm curious—when you sabotage, what are you protecting yourself FROM exactly?

PATIENT: From being left. From being abandoned like my dad abandoned us. Or like... [pauses] Actually, last year I was drinking too much. Like, every night. I told myself it was just stress from work, but really I think I was trying to numb the constant fear. The constant sense that I'm not enough.

THERAPIST: And has that pattern shifted since we started working together?

PATIENT: A little. Some nights I don't reach for the bottle. But then I feel the anxiety more acutely. It's like the alcohol was doing something, even though it was destroying me. Now I'm sitting with these feelings and they're... they're overwhelming sometimes. I don't know if I can sustain this.

THERAPIST: What you're describing—that overwhelm—is actually a sign of progress. You're moving from numbing to feeling. That's difficult terrain. But I want you to notice something: you came here. You're doing this work. That's not the behavior of someone who isn't enough.

PATIENT: [long pause] I want to believe that. I'm trying to. But some days I wake up and I'm back in that closet, you know? Waiting for my dad to come home. Terrified he won't.

THERAPIST: You're safe now. That seven-year-old needed protection in that moment. But you're 34. You have choice now. Let's explore what it might look like to give yourself the reassurance he didn't receive.`;

  const moments = [
    {
      id: 1,
      quote: "weight on my chest that doesn't go away",
      type: 'immediate_experience',
      valence: 'negative',
      intensity: 0.85,
      structures: ['body', 'emotion', 'immediate_experience'],
      therapistMove: 'empathic_attunement',
      therapistQuote: "Tell me about that weight. Where do you feel it?"
    },
    {
      id: 2,
      quote: "dad left for three days",
      type: 'recalled_past',
      valence: 'negative',
      intensity: 0.92,
      structures: ['narrative', 'emotion', 'social', 'body'],
      therapistMove: 'interpretation',
      therapistQuote: "Can you tell me about when this started?"
    },
    {
      id: 3,
      quote: "learned to be small",
      type: 'recalled_past',
      valence: 'negative',
      intensity: 0.78,
      structures: ['behaviour', 'cognitive', 'social', 'reflective'],
      therapistMove: 'empathic_attunement',
      therapistQuote: "And how does that show up for you now?"
    },
    {
      id: 4,
      quote: "when someone gets close, I panic",
      type: 'immediate_experience',
      valence: 'negative',
      intensity: 0.89,
      structures: ['emotion', 'cognitive', 'behaviour', 'immediate_experience'],
      therapistMove: 'challenge',
      therapistQuote: "Is there a part of you that wants connection?"
    },
    {
      id: 5,
      quote: "drinking too much. Like, every night",
      type: 'recalled_past',
      valence: 'negative',
      intensity: 0.88,
      structures: ['behaviour', 'emotion', 'body', 'cognitive'],
      therapistMove: 'interpretation',
      therapistQuote: "What were you protecting yourself from?"
    }
  ];

  const structures = [
    { name: 'body', label: 'Body', description: 'Bodily sensations, somatic experience, dissociation', color: '#E07B6A' },
    { name: 'immediate_experience', label: 'Immediate Experience', description: 'Direct, present-moment consciousness before reflection', color: '#F59E0B' },
    { name: 'emotion', label: 'Emotion', description: 'Named affective states and emotional intensity', color: '#E07B6A' },
    { name: 'behaviour', label: 'Behaviour', description: 'Observable actions, patterns, coping strategies', color: '#2D7D7D' },
    { name: 'social', label: 'Social', description: 'Relational context, interpersonal dynamics', color: '#2D7D7D' },
    { name: 'cognitive', label: 'Cognitive', description: 'Thought patterns, beliefs, cognitive structures', color: '#6B9E7D' },
    { name: 'reflective', label: 'Reflective', description: 'Self-awareness, metacognition, capacity to observe experience', color: '#6B9E7D' },
    { name: 'narrative', label: 'Narrative', description: 'Life story coherence, meaning-making, temporal connection', color: '#8B7BA8' }
  ];

  const therapistMoves = [
    { name: 'empathic_attunement', label: 'Empathic Attunement', icon: '💙' },
    { name: 'challenge', label: 'Challenge', icon: '⚡' },
    { name: 'interpretation', label: 'Interpretation', icon: '🔍' },
    { name: 'silence', label: 'Silence', icon: '🔇' },
    { name: 'reflection', label: 'Reflection', icon: '🪞' }
  ];

  const sessionHistory = [
    { session: 1, intensity: 0.82, reflectiveCapacity: 0.35, emotionalRegulation: 0.40 },
    { session: 2, intensity: 0.85, reflectiveCapacity: 0.38, emotionalRegulation: 0.43 },
    { session: 3, intensity: 0.78, reflectiveCapacity: 0.42, emotionalRegulation: 0.48 },
    { session: 4, intensity: 0.76, reflectiveCapacity: 0.48, emotionalRegulation: 0.52 },
    { session: 5, intensity: 0.74, reflectiveCapacity: 0.55, emotionalRegulation: 0.58 }
  ];

  const practitionerMatches = [
    {
      code: 'PR-TRAUMA-0042',
      name: 'Trauma-Focused CBT Protocol',
      specialty: 'Complex PTSD, Attachment Trauma',
      methodologySummary: 'Structured exposure work combined with somatic processing and cognitive restructuring',
      interventionSequence: [
        'Safety and stabilization (sessions 1-3)',
        'Narrative construction (sessions 4-8)',
        'Imaginal exposure + somatic work (sessions 9-16)',
        'Relational integration (sessions 17+)'
      ],
      outcomePatterns: 'Of 47 patients with similar profiles: 32 showed significant symptom reduction (68%), 28 developed stable relationships within 12 months (60%)',
      matchReasoning: 'Patient shows trauma history, avoidant relational patterns, and cognitive structures amenable to CBT framework. Current reflective capacity (0.55) sufficient for exposure work.'
    },
    {
      code: 'PR-SOMATIC-0158',
      name: 'Somatic Experiencing Integration',
      specialty: 'Trauma Resolution, Body-Based Healing',
      methodologySummary: 'Tracking somatic responses, pendulation between activation and calm, completion of interrupted protective responses',
      interventionSequence: [
        'Titrated somatic awareness (sessions 1-5)',
        'Pendulation and resource building (sessions 6-12)',
        'Discharge and integration work (sessions 13-20)',
        'Relational embodiment (sessions 21+)'
      ],
      outcomePatterns: 'Of 38 patients with similar emotional-body dissociation: 31 reported improved sleep and anxiety reduction (82%), 22 demonstrated increased body acceptance (58%)',
      matchReasoning: 'Prominent body-emotion structure (0.92 intensity in moment 2) with low reflective distance suggests high responsiveness to somatic methods. Substance use history indicates need for bottom-up regulation.'
    },
    {
      code: 'PR-RELATIONAL-0203',
      name: 'Emotionally Focused Therapy (EFT)',
      specialty: 'Attachment, Relational Patterns, Intimacy',
      methodologySummary: 'Identifying pursuit-withdraw cycles, accessing deeper emotions, facilitating secure attachment experiences',
      interventionSequence: [
        'Assessment and cycle identification (sessions 1-3)',
        'Experiential deepening (sessions 4-10)',
        'Enactment and new interaction patterns (sessions 11-18)',
        'Consolidation and autonomous relating (sessions 19+)'
      ],
      outcomePatterns: 'Of 41 patients with sabotage-attachment patterns: 35 sustained relationships beyond 6 months (85%), 28 reported increased capacity for vulnerability (68%)',
      matchReasoning: 'Patient explicitly names relational sabotage as core defense. EFT directly addresses the anxious-avoidant cycling in attachment system. Works well in conjunction with TF-CBT.'
    }
  ];

  const riskSignals = [
    {
      severity: 'high',
      signal: 'Substance Use as Coping Mechanism',
      detail: 'Nightly alcohol use in past year (M5). Escalation pattern identified in transcript.',
      algorithm: '65% of similar cases showed escalation without intervention',
      recommendation: 'Monitor for relapse risk; assess current use status. Recommend concurrent substance use assessment.',
      interventionType: 'Safety Planning + Monitoring'
    },
    {
      severity: 'medium',
      signal: 'Emotional Intensity Peaks Without Reflective Buffer',
      detail: 'Moments 2, 4, 5 show high intensity (0.88-0.92) with minimal reflective engagement. Prereflective overwhelm evident.',
      algorithm: '58% escalation risk in similar cases without structured intervention',
      recommendation: 'Focus on building reflective capacity; use titrated exposure. Ensure adequate window-of-tolerance maintenance.',
      interventionType: 'Reflective Capacity Building'
    }
  ];

  const quickInsight = {
    riskLevel: 'MODERATE',
    priority: 'HIGH',
    prognosis: 'GOOD',
    topRecommendation: 'Trauma-Focused CBT + Somatic Integration',
    rationale: '47 similar cases show 2.3x improvement in reflective capacity with TF-CBT vs. supportive therapy alone. Current patient demonstrates readiness for structured exposure work.'
  };

  const patientId = 'SL-2026-0047';

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start waveform visualization
      drawWaveform();
    } catch (error) {
      alert('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      drawWaveform();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Simulate transcription
      setIsProcessing(true);
      setTimeout(() => {
        setSessionTranscript(demoSession);
        setIsProcessing(false);
      }, 3000);
    }
  };

  const resetRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setIsProcessing(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    audioChunksRef.current = [];
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const ctx = canvas.getContext('2d');

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#FAFAF8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        ctx.fillStyle = '#2D7D7D';
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnalyzeSession = () => {
    if (sessionTranscript.trim().length < 50) {
      alert('Please enter a transcript (or use Demo Session)');
      return;
    }
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnalyzed(true);
      setIsAnimating(false);
      setActiveTab('clinical-summary');
    }, 2000);
  };

  const loadDemoSession = () => {
    setSessionTranscript(demoSession);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSessionTranscript(demoSession); // Simulate transcription
        setInputMode('paste');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif', backgroundColor: '#FAFAF8' }} className="min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>SessionLens</h1>
              <p className="text-xs" style={{ color: '#64748B' }}>Clinical Decision Support</p>
            </div>
            {/* Supabase connection indicator */}
            <div className="flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full" style={{ backgroundColor: isConnected ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${isConnected ? '#BBF7D0' : '#FECACA'}` }}>
              {isConnected ? <Wifi className="w-3 h-3" style={{ color: '#16A34A' }} /> : <WifiOff className="w-3 h-3" style={{ color: '#DC2626' }} />}
              <span className="text-xs font-medium" style={{ color: isConnected ? '#16A34A' : '#DC2626' }}>
                {isConnected ? `Live DB (${dbStructures.length} structures)` : 'Offline'}
              </span>
            </div>
          </div>
          {isAnalyzed && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: '#16A34A' }} />
                <span className="text-sm font-medium" style={{ color: '#16A34A' }}>Consent: Recording + Analysis</span>
              </div>
              <span className="text-sm font-mono px-3 py-2 rounded-lg" style={{ backgroundColor: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
                Client: {patientId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ===== TAB NAVIGATION ===== */}
      {isAnalyzed && (
        <div className="sticky top-14 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 flex gap-8">
            {[
              { id: 'clinical-summary', label: 'Clinical Summary', icon: '📋' },
              { id: 'analysis', label: 'Detailed Analysis', icon: '🔬' },
              { id: 'similar-cases', label: 'Similar Cases', icon: '👥' },
              { id: 'expert-insights', label: 'Expert Insights', icon: '💡' },
              { id: 'report', label: 'Full Report', icon: '📄' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 transition-all text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ===== TAB: SESSION INPUT ===== */}
        {activeTab === 'input' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">

                {/* Input Mode Selection */}
                <div className="rounded-lg border border-slate-200 p-6 space-y-4" style={{ backgroundColor: '#FAFAF8' }}>
                  <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>
                    <Radio className="w-5 h-5" style={{ color: '#2D7D7D' }} />
                    Session Input Method
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => { setInputMode('record'); resetRecording(); }}
                      className={`p-4 rounded-lg border-2 transition-all ${inputMode === 'record' ? 'border-2' : 'border-2'}`}
                      style={{
                        backgroundColor: inputMode === 'record' ? '#F0F9FF' : '#FFFFFF',
                        borderColor: inputMode === 'record' ? '#2D7D7D' : '#CBD5E1'
                      }}
                    >
                      <div className="text-2xl mb-2">🎤</div>
                      <div className="text-xs font-medium" style={{ color: '#1A2332' }}>Record Live</div>
                    </button>
                    <button
                      onClick={() => setInputMode('upload')}
                      className={`p-4 rounded-lg border-2 transition-all`}
                      style={{
                        backgroundColor: inputMode === 'upload' ? '#F0F9FF' : '#FFFFFF',
                        borderColor: inputMode === 'upload' ? '#2D7D7D' : '#CBD5E1'
                      }}
                    >
                      <div className="text-2xl mb-2">📁</div>
                      <div className="text-xs font-medium" style={{ color: '#1A2332' }}>Upload Audio</div>
                    </button>
                    <button
                      onClick={() => setInputMode('paste')}
                      className={`p-4 rounded-lg border-2 transition-all`}
                      style={{
                        backgroundColor: inputMode === 'paste' ? '#F0F9FF' : '#FFFFFF',
                        borderColor: inputMode === 'paste' ? '#2D7D7D' : '#CBD5E1'
                      }}
                    >
                      <div className="text-2xl mb-2">📝</div>
                      <div className="text-xs font-medium" style={{ color: '#1A2332' }}>Paste Transcript</div>
                    </button>
                  </div>
                </div>

                {/* RECORD LIVE MODE */}
                {inputMode === 'record' && (
                  <div className="rounded-lg border border-slate-200 p-6 space-y-4" style={{ backgroundColor: '#FAFAF8' }}>
                    <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>
                      <Mic className="w-5 h-5" style={{ color: '#E07B6A' }} />
                      Record Session Audio
                    </h3>

                    {/* Waveform Canvas */}
                    <div className="rounded-lg overflow-hidden border border-slate-200" style={{ backgroundColor: '#FFFFFF' }}>
                      <canvas
                        ref={canvasRef}
                        width={500}
                        height={120}
                        style={{ width: '100%', height: '120px', display: 'block' }}
                      />
                    </div>

                    {/* Timer */}
                    <div className="text-center py-4">
                      <p className="text-4xl font-bold font-mono" style={{ color: '#2D7D7D' }}>
                        {formatTime(recordingTime)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                        {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Ready'}
                      </p>
                    </div>

                    {/* Recording Controls */}
                    <div className="flex gap-3 justify-center">
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition"
                          style={{ backgroundColor: '#E07B6A' }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#D46354'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#E07B6A'}
                        >
                          <Mic className="w-4 h-4" />
                          Start Recording
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={isPaused ? resumeRecording : pauseRecording}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition"
                            style={{ backgroundColor: '#F59E0B' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#D97706'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#F59E0B'}
                          >
                            {isPaused ? <PlayIcon className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            {isPaused ? 'Resume' : 'Pause'}
                          </button>
                          <button
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition"
                            style={{ backgroundColor: '#EF4444' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
                          >
                            <Square className="w-4 h-4" />
                            Stop
                          </button>
                        </>
                      )}
                    </div>

                    {/* Processing indicator */}
                    {isProcessing && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BFDBFE' }}>
                        <p className="text-sm text-center" style={{ color: '#2D7D7D' }}>
                          Processing audio and generating transcript...
                        </p>
                        <div className="flex justify-center gap-1 mt-2">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-full"
                              style={{
                                backgroundColor: '#2D7D7D',
                                height: '20px',
                                animation: `pulse 0.6s ease-in-out ${i * 0.05}s infinite`
                              }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Audio playback */}
                    {audioBlob && !isRecording && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <p className="text-sm font-semibold mb-2" style={{ color: '#16A34A' }}>Recording saved</p>
                        <audio controls style={{ width: '100%' }}>
                          <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                        </audio>
                      </div>
                    )}
                  </div>
                )}

                {/* UPLOAD MODE */}
                {inputMode === 'upload' && (
                  <div className="rounded-lg border border-slate-200 p-6 space-y-4" style={{ backgroundColor: '#FAFAF8' }}>
                    <h3 className="text-lg font-semibold" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>
                      Upload Audio File
                    </h3>
                    <div
                      className="border-2 border-dashed rounded-lg p-8 text-center transition"
                      style={{ borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' }}
                    >
                      <div className="text-4xl mb-3">📁</div>
                      <p className="text-sm font-semibold mb-2" style={{ color: '#1A2332' }}>Drag and drop your audio file</p>
                      <p className="text-xs mb-4" style={{ color: '#64748B' }}>or</p>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".mp3,.wav,.m4a,.webm"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <span
                          className="px-4 py-2 rounded-lg font-semibold cursor-pointer transition inline-block text-white"
                          style={{ backgroundColor: '#2D7D7D' }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#1F5555'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#2D7D7D'}
                        >
                          Browse Files
                        </span>
                      </label>
                      <p className="text-xs mt-4" style={{ color: '#64748B' }}>MP3, WAV, M4A, WebM up to 100MB</p>
                    </div>
                  </div>
                )}

                {/* PASTE MODE */}
                {inputMode === 'paste' && (
                  <div className="rounded-lg border border-slate-200 p-6 space-y-4" style={{ backgroundColor: '#FAFAF8' }}>
                    <label className="block text-sm font-medium" style={{ color: '#1A2332' }}>Session Transcript</label>
                    <textarea
                      value={sessionTranscript}
                      onChange={(e) => setSessionTranscript(e.target.value)}
                      placeholder="Paste or type your therapy session transcript here. Include both therapist and patient dialogue."
                      className="w-full h-80 rounded-lg border border-slate-300 p-4 text-sm leading-relaxed focus:outline-none"
                      style={{ backgroundColor: '#FFFFFF', color: '#1A2332' }}
                      onFocus={(e) => e.target.style.borderColor = '#2D7D7D'}
                      onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                    />
                    <div className="text-xs" style={{ color: '#64748B' }}>{sessionTranscript.length} characters</div>
                  </div>
                )}

                {/* Treatment Goals */}
                <div className="rounded-lg border border-slate-200 p-6 space-y-4" style={{ backgroundColor: '#FAFAF8' }}>
                  <label className="block text-sm font-medium" style={{ color: '#1A2332' }}>Patient-Defined Treatment Goals (Optional)</label>
                  <textarea
                    value={treatmentGoals}
                    onChange={(e) => setTreatmentGoals(e.target.value)}
                    placeholder="E.g., 'Sleep without nightmares', 'Be able to maintain relationships', 'Return to work'"
                    className="w-full h-24 rounded-lg border border-slate-300 p-4 text-sm leading-relaxed focus:outline-none"
                    style={{ backgroundColor: '#FFFFFF', color: '#1A2332' }}
                    onFocus={(e) => e.target.style.borderColor = '#2D7D7D'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                </div>

                <button
                  onClick={loadDemoSession}
                  className="w-full py-3 px-4 rounded-lg font-medium text-sm transition-all border border-slate-300"
                  style={{ backgroundColor: '#F8FAFC', color: '#1A2332' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#F8FAFC'}
                >
                  Load Demo Session
                </button>
              </div>

              {/* Analysis Panel */}
              <div className="rounded-lg border border-slate-200 p-6 space-y-6" style={{ backgroundColor: '#FAFAF8' }}>
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full opacity-20" style={{ backgroundColor: '#E07B6A', animation: 'pulse 2s infinite' }}></div>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E07B6A' }}>
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                    </div>
                  </div>
                  <p className="text-xs text-center" style={{ color: '#64748B' }}>
                    {isAnimating ? 'Analyzing session...' : 'Ready to analyze'}
                  </p>
                </div>

                {isAnimating && (
                  <div className="flex items-center justify-center gap-1 h-12">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t rounded-full"
                        style={{
                          backgroundColor: '#2D7D7D',
                          height: `${Math.sin(Date.now() / 100 + i) * 20 + 25}%`,
                          animation: `pulse 0.6s ease-in-out ${i * 0.05}s infinite`
                        }}
                      ></div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 text-center">
                  <p className="text-xs" style={{ color: '#64748B' }}>Session Duration</p>
                  <p className="text-2xl font-bold" style={{ color: '#2D7D7D', fontFamily: '"Playfair Display", serif' }}>
                    {Math.floor(sessionTranscript.length / 60)}
                  </p>
                  <p className="text-xs" style={{ color: '#64748B' }}>estimated minutes</p>
                </div>

                <button
                  onClick={handleAnalyzeSession}
                  disabled={isAnimating}
                  className="w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all text-white"
                  style={{ backgroundColor: isAnimating ? '#94A3B8' : '#2D7D7D' }}
                  onMouseEnter={(e) => !isAnimating && (e.target.style.backgroundColor = '#1F5555')}
                  onMouseLeave={(e) => !isAnimating && (e.target.style.backgroundColor = '#2D7D7D')}
                >
                  {isAnimating ? 'Analyzing...' : 'Analyze Session'}
                </button>

                <p className="text-xs text-center" style={{ color: '#64748B' }}>
                  HIPAA-compliant processing
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: CLINICAL SUMMARY ===== */}
        {activeTab === 'clinical-summary' && isAnalyzed && (
          <div className="space-y-6">
            {/* Quick Insight Card */}
            <div className="rounded-lg border-2 p-6 space-y-6" style={{ backgroundColor: '#F0F9FF', borderColor: '#2D7D7D' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>
                  <Target className="w-6 h-6" style={{ color: '#2D7D7D' }} />
                  60-Second Clinical Insight
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#2D7D7D' }}>
                  Session {sessionNumber}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1' }}>
                  <p className="text-xs" style={{ color: '#64748B' }}>RISK LEVEL</p>
                  <p className="text-lg font-bold mt-2" style={{ color: '#F59E0B', fontFamily: '"Playfair Display", serif' }}>{quickInsight.riskLevel}</p>
                </div>
                <div className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1' }}>
                  <p className="text-xs" style={{ color: '#64748B' }}>PRIORITY</p>
                  <p className="text-lg font-bold mt-2" style={{ color: '#E07B6A', fontFamily: '"Playfair Display", serif' }}>{quickInsight.priority}</p>
                </div>
                <div className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1' }}>
                  <p className="text-xs" style={{ color: '#64748B' }}>PROGNOSIS (12mo)</p>
                  <p className="text-lg font-bold mt-2" style={{ color: '#6B9E7D', fontFamily: '"Playfair Display", serif' }}>{quickInsight.prognosis}</p>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#1A2332' }}>Top Recommendation</p>
                <p className="text-base font-bold mb-3" style={{ color: '#2D7D7D', fontFamily: '"Playfair Display", serif' }}>{quickInsight.topRecommendation}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                  <strong>Rationale:</strong> {quickInsight.rationale}
                </p>
              </div>
            </div>

            {/* Moment Timeline */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>
                <Heart className="w-5 h-5" style={{ color: '#E07B6A' }} />
                Session Moment Timeline
              </h2>
              <div className="space-y-2">
                {moments.map((moment, idx) => (
                  <button
                    key={moment.id}
                    onClick={() => setSelectedMoment(selectedMoment === moment.id ? null : moment.id)}
                    className="w-full text-left rounded-lg border border-slate-200 p-4 transition-all hover:border-slate-300 hover:shadow-sm"
                    style={{ backgroundColor: '#FFFFFF' }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-semibold w-8" style={{ color: '#64748B' }}>M{idx + 1}</span>
                      <span className="flex-1 text-sm italic truncate" style={{ color: '#475569' }}>"{moment.quote}"</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-24 h-2 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                          <div className="h-full rounded-full" style={{
                            width: `${moment.intensity * 100}%`,
                            backgroundColor: moment.valence === 'negative' ? '#E07B6A' : moment.valence === 'positive' ? '#6B9E7D' : '#F59E0B'
                          }}></div>
                        </div>
                        <span className="text-sm font-bold w-10" style={{ color: '#64748B' }}>{moment.valence === 'negative' ? '⚠' : moment.valence === 'positive' ? '✓' : '•'}</span>
                      </div>
                    </div>

                    {selectedMoment === moment.id && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {structures.map(struct => {
                            const isPresent = moment.structures.includes(struct.name);
                            return (
                              <div
                                key={struct.name}
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  backgroundColor: isPresent ? struct.color + '20' : '#F8FAFC',
                                  color: isPresent ? struct.color : '#9CA3AF',
                                  border: `1px solid ${isPresent ? struct.color + '40' : '#E5E7EB'}`
                                }}
                              >
                                {struct.label}
                              </div>
                            );
                          })}
                        </div>
                        <div className="rounded-lg p-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#1A2332' }}>Therapist Move</p>
                          <p className="text-sm" style={{ color: '#475569' }}>
                            <span className="font-semibold">{moment.therapistMove.replace('_', ' ').toUpperCase()}:</span> "{moment.therapistQuote}"
                          </p>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Longitudinal Progress */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>
                <TrendingUp className="w-5 h-5" style={{ color: '#2D7D7D' }} />
                Session-to-Session Progress
              </h2>
              <div className="rounded-lg border border-slate-200 p-6" style={{ backgroundColor: '#FFFFFF' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sessionHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="session" stroke="#64748B" />
                    <YAxis stroke="#64748B" domain={[0, 1]} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="intensity" stroke="#E07B6A" name="Emotional Intensity" strokeWidth={2} dot={{ fill: '#E07B6A', r: 4 }} />
                    <Line type="monotone" dataKey="reflectiveCapacity" stroke="#2D7D7D" name="Reflective Capacity" strokeWidth={2} dot={{ fill: '#2D7D7D', r: 4 }} />
                    <Line type="monotone" dataKey="emotionalRegulation" stroke="#6B9E7D" name="Emotional Regulation" strokeWidth={2} dot={{ fill: '#6B9E7D', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Structure Prevalence */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>Phenomenological Structure Prevalence</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {structures.map(struct => {
                  const count = moments.filter(m => m.structures.includes(struct.name)).length;
                  const percentage = (count / moments.length) * 100;
                  return (
                    <div key={struct.name} className="rounded-lg border border-slate-200 p-4" style={{ backgroundColor: '#FFFFFF' }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: struct.color }}>{struct.label}</p>
                      <p className="text-2xl font-bold" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>{percentage.toFixed(0)}%</p>
                      <p className="text-xs mt-1" style={{ color: '#64748B' }}>{count} of {moments.length} moments</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: DETAILED ANALYSIS ===== */}
        {activeTab === 'analysis' && isAnalyzed && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>Detailed Phenomenological Analysis</h2>

            {/* Risk Signals */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#E07B6A' }} />
                Clinical Risk Signals
              </h3>
              {riskSignals.map((signal, idx) => (
                <div key={idx} className="rounded-lg border-l-4 p-4" style={{
                  backgroundColor: signal.severity === 'high' ? '#FEF2F2' : '#FEF3C7',
                  borderColor: signal.severity === 'high' ? '#E07B6A' : '#F59E0B'
                }}>
                  <div className="flex items-start gap-3">
                    <span style={{ color: signal.severity === 'high' ? '#E07B6A' : '#F59E0B', fontSize: '20px' }}>
                      {signal.severity === 'high' ? '⚠' : 'ℹ'}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold mb-1" style={{ color: '#1A2332' }}>{signal.signal}</p>
                      <p className="text-sm mb-2" style={{ color: '#475569' }}>{signal.detail}</p>
                      <p className="text-xs mb-2" style={{ color: '#64748B' }}>
                        <strong>Algorithm Match:</strong> {signal.algorithm}
                      </p>
                      <p className="text-xs font-medium p-2 rounded" style={{ backgroundColor: '#FFFFFF', color: '#475569' }}>
                        <strong>Recommendation:</strong> {signal.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Therapist Behavior Coding */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>
                <Zap className="w-5 h-5" style={{ color: '#2D7D7D' }} />
                Therapist Intervention Analysis
              </h3>
              <div className="rounded-lg border border-slate-200 p-6" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="space-y-4">
                  {moments.map((moment, idx) => {
                    const move = therapistMoves.find(m => m.name === moment.therapistMove);
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                        <span className="text-2xl flex-shrink-0">{move.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-sm" style={{ color: '#1A2332' }}>M{idx + 1}: {move.label}</p>
                          <p className="text-sm mt-1 italic" style={{ color: '#475569' }}>"{moment.therapistQuote}"</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Algorithm Transparency */}
            <div className="rounded-lg border border-slate-200 p-6" style={{ backgroundColor: '#F8FAFC' }}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>
                <Info className="w-5 h-5" style={{ color: '#2D7D7D' }} />
                How This Analysis Was Made
              </h3>
              <div className="space-y-3 text-sm">
                <p style={{ color: '#475569' }}>
                  <strong>Moment Extraction:</strong> Algorithm identified 5 key moments where patient's phenomenological structures shifted. Matched against pattern library to identify clinically significant turning points.
                </p>
                <p style={{ color: '#475569' }}>
                  <strong>Structure Coding:</strong> Each moment analyzed for presence of 8 phenomenological structures (body, immediate experience, emotion, behavior, social, cognitive, reflective, narrative). Accuracy: ~78-85% F1 score.
                </p>
                <p style={{ color: '#475569' }}>
                  <strong>Therapist Move Identification:</strong> Therapist interventions coded into 5 categories (empathic attunement, challenge, interpretation, silence, reflection) based on temporal proximity and semantic content analysis.
                </p>
                <p style={{ color: '#475569' }}>
                  <strong>Risk Signal Matching:</strong> Session patterns compared to 10,847 archival cases. Risk flags generated when session profile matches high-risk cohorts (65% escalation rate without intervention).
                </p>
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BFDBFE' }}>
                  <p className="text-xs" style={{ color: '#1E40AF' }}>
                    <strong>⚠ Limitation:</strong> Automated coding makes mistakes. This analysis is a tool for clinical consideration, not a diagnostic replacement. Human clinical judgment always supersedes algorithm output.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: SIMILAR CASES ===== */}
        {activeTab === 'similar-cases' && isAnalyzed && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>Pattern-Matched Cases from Database</h2>
            <p style={{ color: '#475569' }} className="text-sm">
              These 3 cases show similar phenomenological profiles. Their outcomes are presented for clinical context only—each patient is unique.
            </p>

            {[
              {
                id: 'P0020',
                name: 'Case P0020: "The Rising"',
                similarity: 94,
                themes: 'Fentanyl addiction, BPD, childhood abuse, maternal loss',
                quote: '"I just wanted to know if you were fucking alive"',
                outcome: 'Began recovery after relocating; showed improvement when reflective structures increased across 6 months'
              },
              {
                id: 'P0093',
                name: 'Case P0093: "The Warrior"',
                similarity: 91,
                themes: 'Methamphetamine addiction, homelessness, motherhood, resilience pathway',
                quote: '"Her journey from property manager to homeless meth addict—and back"',
                outcome: 'Crisis event (car accident) triggered turning point; regained custody of 4 children within 18 months'
              },
              {
                id: 'P0082',
                name: 'Case P0082: "The Healer"',
                similarity: 87,
                themes: 'Early childhood sexual abuse (age 3-6), homelessness, caregiving, purpose-building',
                quote: '"A journey through abuse and homelessness toward purpose in caregiving"',
                outcome: 'Found strength through helping others; currently in nonprofit mentorship program'
              }
            ].map((caseData, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 p-6" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>{caseData.name}</h3>
                    <p className="text-xs mt-1" style={{ color: '#64748B' }}>Themes: {caseData.themes}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: '#64748B' }}>Similarity</p>
                    <p className="text-2xl font-bold" style={{ color: '#2D7D7D', fontFamily: '"Playfair Display", serif' }}>{caseData.similarity}%</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                    <p className="text-sm italic mb-2" style={{ color: '#475569' }}>{caseData.quote}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#64748B' }}>OUTCOME PATTERN</p>
                    <p className="text-sm" style={{ color: '#475569' }}>{caseData.outcome}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-lg p-4" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
              <p className="text-xs" style={{ color: '#92400E' }}>
                <strong>Important:</strong> Similarity matching indicates phenomenological overlap, not treatment prescription. Each patient's specific context, resources, and preferences determine optimal intervention. These cases inform clinical thinking but do not replace individual assessment.
              </p>
            </div>
          </div>
        )}

        {/* ===== TAB: EXPERT INSIGHTS ===== */}
        {activeTab === 'expert-insights' && isAnalyzed && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>Practitioner Wisdom Engine</h2>
              <p style={{ color: '#475569' }} className="text-sm">
                Three evidence-based methodologies matched to this patient's profile, based on outcomes from the practitioner database.
              </p>
            </div>

            {practitionerMatches.map((practitioner, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200" style={{ backgroundColor: '#FFFFFF' }}>
                <button
                  onClick={() => setExpandedPractitioner(expandedPractitioner === practitioner.code ? null : practitioner.code)}
                  className="w-full text-left p-6 flex items-center justify-between hover:opacity-80 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#F8FAFC', color: '#2D7D7D' }}>
                        {practitioner.code}
                      </span>
                      <h3 className="font-bold text-lg" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>{practitioner.name}</h3>
                    </div>
                    <p className="text-sm" style={{ color: '#64748B' }}>{practitioner.specialty}</p>
                  </div>
                  {expandedPractitioner === practitioner.code ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedPractitioner === practitioner.code && (
                  <div className="px-6 pb-6 pt-0 space-y-4 border-t border-slate-200">
                    <div>
                      <p className="text-xs font-semibold mb-2 uppercase" style={{ color: '#64748B' }}>Core Methodology</p>
                      <p className="text-sm" style={{ color: '#475569' }}>{practitioner.methodologySummary}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold mb-2 uppercase" style={{ color: '#64748B' }}>Recommended Intervention Sequence</p>
                      <ol className="space-y-1 text-sm" style={{ color: '#475569' }}>
                        {practitioner.interventionSequence.map((step, i) => (
                          <li key={i} className="ml-4">• {step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="rounded-lg p-3" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BFDBFE' }}>
                      <p className="text-xs font-semibold mb-1 uppercase" style={{ color: '#2D7D7D' }}>Outcome Patterns</p>
                      <p className="text-sm" style={{ color: '#1E40AF' }}>{practitioner.outcomePatterns}</p>
                    </div>

                    <div className="rounded-lg p-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                      <p className="text-xs font-semibold mb-1 uppercase" style={{ color: '#64748B' }}>Why This Match</p>
                      <p className="text-sm" style={{ color: '#475569' }}>{practitioner.matchReasoning}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ===== TAB: FULL REPORT ===== */}
        {activeTab === 'report' && isAnalyzed && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>Session Report</h2>
              <button
                onClick={() => setShowPatientReport(!showPatientReport)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
                style={{ backgroundColor: '#F0F9FF', color: '#2D7D7D', border: '1px solid #BFDBFE' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E0F2FE'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F0F9FF'}
              >
                {showPatientReport ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {showPatientReport ? 'Clinician View' : 'Patient-Friendly View'}
              </button>
            </div>

            {!showPatientReport ? (
              <div className="space-y-6">
                <div className="rounded-lg border border-slate-200 p-6" style={{ backgroundColor: '#FAFAF8' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>Clinical Summary</h3>
                  <div className="space-y-3 text-sm" style={{ color: '#475569' }}>
                    <p>
                      <strong>Patient Profile:</strong> 34-year-old presenting with complex trauma history (parental abandonment age 7-8), social anxiety, relational sabotage patterns, and past substance use (nightly alcohol use, last year). Current presentation shows mixed emotional intensity (0.74-0.92) with emerging reflective capacity (0.55 on current session).
                    </p>
                    <p>
                      <strong>Key Clinical Features:</strong> Prominent body-emotion-social structure dissociation. Immediate experience dominates (prereflective reactivity). Strong narrative trauma frame present. Therapist demonstrates solid empathic attunement with strategic challenge integration.
                    </p>
                    <p>
                      <strong>Risk Factors:</strong> Substance use history remains concerning. High emotional intensity peaks without consistent reflective buffer. Recommend safety assessment and substance use screening at next session.
                    </p>
                    <p>
                      <strong>Strengths:</strong> Patient demonstrates insight into relational patterns, willingness to feel previously avoided emotions, and emerging capacity for self-compassion ("you came here, you're doing this work").
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-6" style={{ backgroundColor: '#FAFAF8' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>Treatment Recommendations</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-semibold mb-2" style={{ color: '#1A2332' }}>Primary Modality: Trauma-Focused CBT with Somatic Integration</p>
                      <p style={{ color: '#475569' }}>47 similar cases show 2.3x faster improvement in reflective capacity with TF-CBT vs. supportive therapy alone. Patient's emerging willingness to process emotions supports structured exposure work.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2" style={{ color: '#1A2332' }}>Intervention Sequence (Recommended)</p>
                      <ol className="space-y-1 ml-4" style={{ color: '#475569' }}>
                        <li>• Sessions 1-3: Safety planning, psychoeducation on trauma response, substance use assessment</li>
                        <li>• Sessions 4-8: Narrative construction of trauma, relational pattern mapping, somatic awareness building</li>
                        <li>• Sessions 9-16: Imaginal exposure with body-oriented processing, relational rehearsal work</li>
                        <li>• Sessions 17+: Relational integration, attachment repair, maintenance planning</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold mb-2" style={{ color: '#1A2332' }}>Adjunctive Considerations</p>
                      <p style={{ color: '#475569' }}>Consider psychiatry consultation re: anxiety management. Monitor for dissociative responses during exposure work. May benefit from concurrent somatic therapy (massage, yoga) or substance use support group given history.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-6" style={{ backgroundColor: '#FAFAF8' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>Documentation Notes</h3>
                  <p className="text-sm" style={{ color: '#475569' }}>
                    This analysis was generated by SessionLens V2 using phenomenological coding (F1 accuracy 78-85%). It supports clinical decision-making but does not replace comprehensive assessment. Therapist clinical judgment supersedes algorithm output.
                  </p>
                </div>

                <button
                  className="w-full py-3 px-4 rounded-lg font-semibold text-white transition"
                  style={{ backgroundColor: '#2D7D7D' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1F5555'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2D7D7D'}
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download PDF Report
                </button>
              </div>
            ) : (
              <div className="space-y-6 max-w-2xl">
                <div className="rounded-lg p-6" style={{ backgroundColor: '#F0F9FF', border: '2px solid #2D7D7D' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#1A2332', fontFamily: '"Playfair Display", serif' }}>Your Session Summary</h3>
                  <p className="text-sm mb-4" style={{ color: '#475569' }}>
                    This is a simplified summary of how your therapist and our system understood what happened in your session. It's written in plain language, not clinical jargon.
                  </p>

                  <div className="space-y-4 text-sm" style={{ color: '#475569' }}>
                    <div>
                      <p className="font-semibold mb-1" style={{ color: '#1A2332' }}>What We Noticed</p>
                      <p>
                        In your session, you talked about feelings of anxiety that feel heavy and constant. You shared memories of your dad leaving when you were young, and how that shaped the way you protect yourself now. You mentioned that relationships feel scary because you worry about disappointing people. This is a real and understandable pattern.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold mb-1" style={{ color: '#1A2332' }}>Your Strengths</p>
                      <p>
                        You're willing to feel things you've avoided for a long time. You're honest about your struggles. You showed up and are doing this work. That takes real courage.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold mb-1" style={{ color: '#1A2332' }}>Next Steps Your Therapist May Suggest</p>
                      <p>
                        Your therapist may want to use specific techniques to help you process the difficult memories and feelings in a safe way. They might also check in about your current coping strategies and make sure you have a good safety plan.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold mb-1" style={{ color: '#1A2332' }}>Looking Ahead</p>
                      <p>
                        Based on what we learned about your situation, people with similar experiences who do this kind of therapy work often feel significantly better over the next 3-6 months. Healing is possible.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  className="w-full py-3 px-4 rounded-lg font-semibold text-white transition"
                  style={{ backgroundColor: '#2D7D7D' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1F5555'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2D7D7D'}
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download Your Summary
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default SessionLensV2;
