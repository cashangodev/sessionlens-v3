'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult, CBTAnalysisResult } from '@/types';
import {
  generateMockLongitudinalData,
  generateProgressSummary,
  formatSessionDate,
} from '@/lib/longitudinal-data';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Target,
  Calendar,
  MessageSquare,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Lightbulb,
  Clock,
  Loader2,
} from 'lucide-react';
import { TopicEvolution, TreatmentPlanItem } from '@/types';

interface SessionData {
  id: string;
  clientCode: string;
  sessionNumber: number;
  transcript: string;
  treatmentGoals: string;
  date: string;
  time: string;
  status: string;
  analysisResult: AnalysisResult | null;
  createdAt: string;
}

// ========== MOCK DATA GENERATORS ==========

function generateTopicEvolution(
  sessionCount: number,
  structureProfile: Record<string, number>,
  cbt?: CBTAnalysisResult
): TopicEvolution[] {
  const topics: TopicEvolution[] = [];

  // Add CBT dominant patterns as topics (real data)
  if (cbt && cbt.dominantPatterns.length > 0) {
    cbt.dominantPatterns.forEach((pattern) => {
      topics.push({
        topic: pattern,
        sessions: [sessionCount], // Only current session has real data
        trend: 'stable',
      });
    });
  }

  // Add top structures from real profile
  const topStructures = Object.entries(structureProfile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  topStructures.forEach(([name]) => {
    const label = name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    if (!topics.some((t) => t.topic.toLowerCase() === label.toLowerCase())) {
      topics.push({
        topic: label,
        sessions: [sessionCount],
        trend: 'stable',
      });
    }
  });

  // If very few topics, add behavioral patterns from CBT
  if (cbt && topics.length < 4) {
    cbt.behavioralPatterns.slice(0, 2).forEach((pattern) => {
      const short = pattern.length > 40 ? pattern.slice(0, 37) + '...' : pattern;
      topics.push({
        topic: short,
        sessions: [sessionCount],
        trend: 'stable',
      });
    });
  }

  // Ensure at least a few entries
  if (topics.length === 0) {
    topics.push(
      { topic: 'Emotional Processing', sessions: [sessionCount], trend: 'stable' },
      { topic: 'Self-Reflection', sessions: [sessionCount], trend: 'stable' },
    );
  }

  return topics.slice(0, 8);
}

function generateTreatmentPlan(sessionNumber: number, cbt?: CBTAnalysisResult): TreatmentPlanItem[] {
  const items: TreatmentPlanItem[] = [];

  // Generate goals from CBT data when available
  if (cbt && cbt.dominantPatterns.length > 0) {
    cbt.dominantPatterns.forEach((pattern, i) => {
      const distortionCount = cbt.distortions.filter((d) => d.type === pattern).length;
      const loadFactor = cbt.overallDistortionLoad;
      const status: 'not_started' | 'in_progress' | 'achieved' =
        loadFactor > 0.6 ? 'not_started' : loadFactor > 0.3 ? 'in_progress' : 'in_progress';
      const progress = Math.round(cbt.treatmentReadiness * 100 * (1 - loadFactor));

      items.push({
        id: `goal-cbt-${i}`,
        goal: `Address ${pattern} thinking patterns`,
        status,
        progressPercent: Math.max(5, Math.min(90, progress)),
        lastUpdatedSession: sessionNumber,
        notes: `${distortionCount} instance(s) detected. Treatment readiness: ${Math.round(cbt.treatmentReadiness * 100)}%`,
      });
    });

    // Add behavioral pattern goals
    cbt.behavioralPatterns.slice(0, 2).forEach((pattern, i) => {
      items.push({
        id: `goal-behavioral-${i}`,
        goal: `Address: ${pattern.length > 60 ? pattern.slice(0, 57) + '...' : pattern}`,
        status: 'not_started',
        progressPercent: 0,
        lastUpdatedSession: sessionNumber,
        notes: 'Identified through CBT behavioral pattern analysis',
      });
    });
  } else {
    // Fallback generic goals when no CBT data
    items.push(
      {
        id: 'goal-1',
        goal: 'Reduce presenting symptoms',
        status: sessionNumber >= 4 ? 'in_progress' : 'not_started',
        progressPercent: Math.min(70, sessionNumber * 15),
        lastUpdatedSession: sessionNumber,
        notes: 'Track with standardized outcome measures',
      },
      {
        id: 'goal-2',
        goal: 'Develop healthy coping strategies',
        status: sessionNumber >= 3 ? 'in_progress' : 'not_started',
        progressPercent: Math.min(60, sessionNumber * 12),
        lastUpdatedSession: sessionNumber,
        notes: 'Introduce evidence-based coping techniques',
      }
    );
  }

  // Always add self-compassion goal
  items.push({
    id: 'goal-selfcomp',
    goal: 'Build self-compassion and emotional resilience',
    status: 'not_started',
    progressPercent: Math.min(20, sessionNumber * 5),
    lastUpdatedSession: sessionNumber,
    notes: cbt ? `Distortion load: ${Math.round(cbt.overallDistortionLoad * 100)}% — self-compassion work may help reduce self-critical patterns` : 'To be introduced in upcoming sessions',
  });

  return items;
}

interface AIDecisionPrompt {
  id: string;
  question: string;
  context: string;
  options: string[];
  confidence: number;
}

function generateAIDecisionPrompts(sessionNumber: number, cbt?: CBTAnalysisResult): AIDecisionPrompt[] {
  const prompts: AIDecisionPrompt[] = [];

  if (cbt && cbt.distortions.length > 0) {
    const dominant = cbt.dominantPatterns[0] || cbt.distortions[0]?.type;

    if (cbt.treatmentReadiness > 0.7 && cbt.overallDistortionLoad > 0.5) {
      prompts.push({
        id: 'prompt-cbt-ready',
        question: `Client shows high treatment readiness (${Math.round(cbt.treatmentReadiness * 100)}%). Begin active cognitive restructuring?`,
        context: `${cbt.distortions.length} cognitive distortion(s) detected with ${Math.round(cbt.overallDistortionLoad * 100)}% distortion load. Dominant pattern: ${dominant}. Client appears ready for structured CBT work.`,
        options: [`Start ${dominant} restructuring`, 'Psychoeducation first', 'Continue current approach'],
        confidence: Math.min(0.95, cbt.treatmentReadiness),
      });
    }

    if (cbt.behavioralPatterns.some((p) => p.toLowerCase().includes('avoid'))) {
      prompts.push({
        id: 'prompt-exposure',
        question: 'Avoidance patterns detected. Consider introducing exposure work?',
        context: `Behavioral analysis identified avoidance patterns: ${cbt.behavioralPatterns.filter((p) => p.toLowerCase().includes('avoid')).join('; ')}. Graded exposure may break the avoidance-anxiety cycle.`,
        options: ['Design graded exposure hierarchy', 'Start with behavioral experiments', 'Focus on cognitive work first'],
        confidence: 0.72,
      });
    }

    if (cbt.automaticThoughts.length > 0) {
      const negativeThoughts = cbt.automaticThoughts.filter((t) => !t.supportsWellbeing);
      if (negativeThoughts.length >= 2) {
        prompts.push({
          id: 'prompt-thoughts',
          question: `${negativeThoughts.length} negative automatic thoughts identified. Assign thought record homework?`,
          context: `Automatic thoughts detected with average belief strength of ${Math.round(negativeThoughts.reduce((s, t) => s + t.beliefStrength, 0) / negativeThoughts.length * 100)}%. Thought records help clients catch and challenge these in real-time.`,
          options: ['Assign standard thought record', 'Use simplified 3-column record', 'Address in session only'],
          confidence: 0.76,
        });
      }
    }
  }

  // Generic prompts as fallback
  if (prompts.length < 2) {
    prompts.push({
      id: 'prompt-generic-1',
      question: 'Consider adjusting therapeutic approach based on session patterns?',
      context: `Session ${sessionNumber} complete. Review phenomenological profile to guide intervention selection.`,
      options: ['Adjust approach', 'Continue current approach', 'Seek supervision'],
      confidence: 0.65,
    });
  }

  if (sessionNumber >= 4) {
    prompts.push({
      id: 'prompt-measures',
      question: 'Consider outcome measure re-assessment?',
      context: `${sessionNumber} sessions completed. Regular monitoring with standardized measures recommended.`,
      options: ['Administer PHQ-9 + GAD-7 next session', 'Schedule for session after next', 'Not yet needed'],
      confidence: 0.82,
    });
  }

  return prompts;
}

// ========== COMPONENT ==========

export default function ProgressPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { data, loading } = useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`);
  const session = data?.session || null;

  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  const sessionNumber = session?.sessionNumber || 5;
  const analysis = session?.analysisResult as AnalysisResult | null;
  const cbt = analysis?.cbtAnalysis as CBTAnalysisResult | undefined;
  const structureProfile = analysis?.structureProfile || {};

  const sessionData = useMemo(() => generateMockLongitudinalData(sessionNumber), [sessionNumber]);
  const progressSummary = useMemo(() => generateProgressSummary(sessionData), [sessionData]);
  const topicEvolution = useMemo(() => generateTopicEvolution(sessionNumber, structureProfile, cbt), [sessionNumber, structureProfile, cbt]);
  const treatmentPlan = useMemo(() => generateTreatmentPlan(sessionNumber, cbt), [sessionNumber, cbt]);
  const aiPrompts = useMemo(() => generateAIDecisionPrompts(sessionNumber, cbt), [sessionNumber, cbt]);

  // Chart data
  const outcomeChartData = sessionData
    .filter((s) => s.outcomeMeasures.phq9 || s.outcomeMeasures.gad7)
    .map((s) => ({
      session: `S${s.sessionNumber}`,
      PHQ9: s.outcomeMeasures.phq9,
      GAD7: s.outcomeMeasures.gad7,
    }));

  const metricChartData = sessionData.map((s) => ({
    session: `S${s.sessionNumber}`,
    'Therapeutic Alliance': Number(s.therapeuticAlliance.toFixed(1)),
    'Emotional Regulation': Number(s.emotionalRegulation.toFixed(1)),
    'Reflective Capacity': Number(s.reflectiveCapacity.toFixed(1)),
  }));

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-3.5 h-3.5 text-blue-500" />;
      case 'decreasing': return <TrendingDown className="w-3.5 h-3.5 text-green-500" />;
      default: return <ArrowRight className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'achieved': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!session) {
    return (
      <Card className="p-8 text-center">
        <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Session Not Found</h3>
        <p className="text-gray-600 mb-6">This session may have expired.</p>
        <Link
          href="/dashboard/session/new"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition"
        >
          Create New Session
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      {/* Demo Data Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Demo Data — Not Real Patient Progress</p>
          <p className="text-xs text-amber-700 mt-1">
            The timeline, charts, and outcome scores below are simulated to demonstrate how multi-session tracking will look.
            Real longitudinal data requires 2+ analyzed sessions for this client. Session-specific analysis on the other tabs is based on your actual transcript.
          </p>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-6 md:p-8 border border-primary/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {progressSummary.overallTrend === 'improving' ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <ArrowRight className="w-5 h-5 text-gray-400" />
              )}
              <p className="text-sm text-gray-600 font-medium">Overall Trend</p>
            </div>
            <p className="text-xl font-bold text-gray-900 capitalize">{progressSummary.overallTrend}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <p className="text-sm text-gray-600 font-medium">Key Improvement</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">{progressSummary.keyImprovement}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <p className="text-sm text-gray-600 font-medium">Recommended Focus</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">{progressSummary.recommendedFocus}</p>
          </div>
        </div>
        {progressSummary.areasOfConcern.length > 0 && (
          <div className="mt-6 pt-5 border-t border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-800 font-medium">Areas of Concern</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {progressSummary.areasOfConcern.map((concern, i) => (
                <span key={i} className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                  {concern}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Session Timeline */}
      <section>
        <h3 className="font-playfair text-xl font-bold text-gray-900 mb-5">Session Timeline</h3>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {sessionData.map((s, idx) => (
              <div key={s.sessionNumber} className="relative pl-12">
                {/* Dot */}
                <div
                  className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 border-white ${
                    idx === sessionData.length - 1 ? 'bg-primary ring-2 ring-primary/20' : 'bg-gray-300'
                  }`}
                />
                <Card className={`p-4 ${idx === sessionData.length - 1 ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">Session {s.sessionNumber}</span>
                        <Badge
                          label={s.riskLevel.charAt(0).toUpperCase() + s.riskLevel.slice(1)}
                          variant={s.riskLevel === 'high' ? 'risk-high' : s.riskLevel === 'medium' ? 'risk-medium' : 'risk-low'}
                        />
                        {idx === sessionData.length - 1 && (
                          <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Current</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{s.keyTheme}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatSessionDate(s.date)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PHQ-9: {s.outcomeMeasures.phq9} / GAD-7: {s.outcomeMeasures.gad7}
                        <span className="text-amber-500 ml-1">(demo)</span>
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcome Trend Charts */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <h3 className="font-playfair text-xl font-bold text-gray-900">Outcome Trends</h3>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Simulated trend data for demonstration
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Outcome Measures */}
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">PHQ-9 & GAD-7</h4>
            <div className="w-full h-64" suppressHydrationWarning>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={outcomeChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="session" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 27]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="PHQ9" stroke="#DC2626" name="PHQ-9" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="GAD7" stroke="#F59E0B" name="GAD-7" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Lower = better</p>
          </Card>

          {/* Therapeutic Metrics */}
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Therapeutic Metrics</h4>
            <div className="w-full h-64" suppressHydrationWarning>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="session" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Therapeutic Alliance" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Emotional Regulation" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Reflective Capacity" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Higher = better</p>
          </Card>
        </div>
      </section>

      {/* Topic Evolution */}
      <section>
        <h3 className="font-playfair text-xl font-bold text-gray-900 mb-5">Topic Evolution</h3>
        <Card className="p-6">
          <div className="space-y-3">
            {topicEvolution.map((topic) => (
              <div key={topic.topic} className="flex items-center gap-4">
                <div className="w-32 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-900">{topic.topic}</span>
                </div>
                <div className="flex-1 flex items-center gap-1">
                  {Array.from({ length: sessionNumber }, (_, i) => i + 1).map((sNum) => {
                    const isPresent = topic.sessions.includes(sNum);
                    return (
                      <div
                        key={sNum}
                        className={`flex-1 h-6 rounded ${
                          isPresent ? 'bg-primary/70' : 'bg-gray-100'
                        } ${sNum === sessionNumber && isPresent ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                        title={`Session ${sNum}: ${isPresent ? 'discussed' : 'not discussed'}`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-1 w-24 flex-shrink-0 justify-end">
                  {getTrendIcon(topic.trend)}
                  <span className="text-xs text-gray-500 capitalize">{topic.trend}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary/70" /> Discussed
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-100 border" /> Not discussed
            </span>
          </div>
        </Card>
      </section>

      {/* Treatment Plan Progress */}
      <section>
        <h3 className="font-playfair text-xl font-bold text-gray-900 mb-5">Treatment Plan Progress</h3>
        <div className="space-y-3">
          {treatmentPlan.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900 text-sm">{item.goal}</p>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">{item.notes}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusStyles(item.status)}`}>
                  {item.status === 'achieved' ? 'Achieved' : item.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                </span>
              </div>
              <div className="ml-6 flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.progressPercent >= 70 ? 'bg-green-500' : item.progressPercent >= 30 ? 'bg-primary' : 'bg-gray-300'
                    }`}
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-mono w-10 text-right">{item.progressPercent}%</span>
              </div>
              <p className="text-xs text-gray-400 ml-6 mt-2">
                Last updated: Session {item.lastUpdatedSession}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* AI Decision Prompts */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <h3 className="font-playfair text-xl font-bold text-gray-900">AI Decision Prompts</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">AI-generated</span>
        </div>

        <div className="space-y-3">
          {aiPrompts.map((prompt) => (
            <Card
              key={prompt.id}
              className="p-5 cursor-pointer"
              onClick={() => setExpandedPrompt(expandedPrompt === prompt.id ? null : prompt.id)}
            >
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-gray-900">{prompt.question}</p>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs text-gray-400">{Math.round(prompt.confidence * 100)}% conf.</span>
                      {expandedPrompt === prompt.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {expandedPrompt === prompt.id && (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-gray-600">{prompt.context}</p>
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-2">Options to consider:</p>
                        <div className="flex flex-wrap gap-2">
                          {prompt.options.map((option) => (
                            <button
                              key={option}
                              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-primary/10 hover:text-primary transition"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI suggestion based on longitudinal session data. Clinical judgment should guide final decision.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
