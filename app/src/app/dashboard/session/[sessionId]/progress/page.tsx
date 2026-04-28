'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { LineagePopover, type LineageSnippet } from '@/components/ui/LineagePopover';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult } from '@/types';
import {
  generateProgressSummary,
  formatSessionDate,
  type ProgressData,
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
  AlertCircle,
  CheckCircle2,
  Target,
  Calendar,
  ArrowRight,
  Info,
  Loader2,
} from 'lucide-react';

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

// ========== COMPONENT ==========

export default function ProgressPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { data, loading } = useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`);
  const session = data?.session || null;

  // Fetch real longitudinal data from the rewired progress API.
  const clientCode = session?.clientCode;
  const { data: progressData, loading: progressLoading } = useApi<ProgressData>(
    clientCode ? `/api/clients/${clientCode}/progress` : null
  );

  // P0-1 + P0-5 audit: all longitudinal cards are gated on real data.
  // Mock fallbacks have been removed — fabricated PHQ-9/GAD-7 trajectories,
  // synthetic alliance/regulation/reflective metrics, and invented topic
  // evolutions are never shown.
  const sessionData = useMemo(() => progressData?.sessions || [], [progressData]);
  const hasEnoughRealData = sessionData.length >= 2;
  const treatmentPlan = progressData?.treatmentPlan || [];
  const hasOutcomeTrend = !!progressData?.hasOutcomeTrend;
  const hasTopicData = !!progressData?.hasTopicData;

  const progressSummary = useMemo(
    () => (hasEnoughRealData ? generateProgressSummary(sessionData) : null),
    [hasEnoughRealData, sessionData]
  );

  // Outcome chart data — only real, only when present.
  const outcomeChartData = useMemo(
    () =>
      sessionData
        .filter((s) => s.outcomeMeasures.phq9 != null || s.outcomeMeasures.gad7 != null)
        .map((s) => ({
          session: `S${s.sessionNumber}`,
          PHQ9: s.outcomeMeasures.phq9,
          GAD7: s.outcomeMeasures.gad7,
        })),
    [sessionData]
  );

  // Topic recurrence: union of topics across sessions, with per-session
  // count + supporting snippets for the lineage popover.
  const topicRecurrence = useMemo(() => {
    type Row = {
      topic: string;
      label: string;
      perSession: Map<number, { count: number; snippets: LineageSnippet[] }>;
      totalCount: number;
    };
    const rows = new Map<string, Row>();
    for (const s of sessionData) {
      for (const t of s.dominantTopics) {
        if (!rows.has(t.topic)) {
          rows.set(t.topic, {
            topic: t.topic,
            label: t.label,
            perSession: new Map(),
            totalCount: 0,
          });
        }
        const row = rows.get(t.topic)!;
        const snippets: LineageSnippet[] = (t.snippets || [])
          .filter((sn) => sn.quote && sn.quote.trim().length > 0)
          .map((sn) => ({
            text: sn.quote!,
            timestamp: sn.timestamp,
            momentId: sn.id,
            speaker: 'client',
          }));
        row.perSession.set(s.sessionNumber, { count: t.count, snippets });
        row.totalCount += t.count;
      }
    }
    return Array.from(rows.values()).sort((a, b) => b.totalCount - a.totalCount);
  }, [sessionData]);

  // Dominant-structures evolution: per-session, the top structure intensity
  // values for a small stacked bar across sessions.
  const structureEvolutionData = useMemo(
    () =>
      sessionData.map((s) => ({
        session: `S${s.sessionNumber}`,
        Body: s.structureIntensity.body,
        Emotion: s.structureIntensity.emotion,
        Cognitive: s.structureIntensity.cognitive,
        Social: s.structureIntensity.social,
        Reflective: s.structureIntensity.reflective,
        Narrative: s.structureIntensity.narrative,
      })),
    [sessionData]
  );
  const hasStructureData = sessionData.some(
    (s) =>
      s.structureIntensity.body +
        s.structureIntensity.emotion +
        s.structureIntensity.cognitive +
        s.structureIntensity.social +
        s.structureIntensity.reflective +
        s.structureIntensity.narrative >
      0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
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

  const sessionNumbers = sessionData.map((s) => s.sessionNumber);

  return (
    <div className="space-y-10">
      {/* Notice when we don't yet have ≥2 real sessions. */}
      {!hasEnoughRealData && !progressLoading && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Need at least 2 sessions to show a trend
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Timelines, outcome charts, topic recurrence, and trend summaries appear once
              this client has at least two completed and analyzed sessions. Per-session
              findings are still available on the other tabs.
            </p>
          </div>
        </div>
      )}

      {/* Progress Summary */}
      {hasEnoughRealData && progressSummary && (
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
              <p className="text-xl font-bold text-gray-900 capitalize">
                {progressSummary.overallTrend}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <p className="text-sm text-gray-600 font-medium">Key Improvement</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {progressSummary.keyImprovement}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <p className="text-sm text-gray-600 font-medium">Recommended Focus</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {progressSummary.recommendedFocus}
              </p>
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
                  <span
                    key={i}
                    className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full"
                  >
                    {concern}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Timeline */}
      {hasEnoughRealData && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <h3 className="font-playfair text-xl font-bold text-gray-900">Session Timeline</h3>
            <InfoTooltip
              title="Session Timeline"
              description="Chronological view of completed sessions for this client. Outcome scores are pulled from the client's outcome-tracking record."
              methodology="Sessions joined to outcome_scores by date (day-precision)."
            />
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {sessionData.map((s, idx) => (
                <div key={s.sessionNumber} className="relative pl-12">
                  <div
                    className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 border-white ${
                      idx === sessionData.length - 1
                        ? 'bg-primary ring-2 ring-primary/20'
                        : 'bg-gray-300'
                    }`}
                  />
                  <Card
                    className={`p-4 ${
                      idx === sessionData.length - 1 ? 'border-primary/30 bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            Session {s.sessionNumber}
                          </span>
                          {idx === sessionData.length - 1 && (
                            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                          {s.riskFlagCount > 0 && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              {s.riskFlagCount} risk flag{s.riskFlagCount === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{s.keyTheme}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          {formatSessionDate(s.date)}
                        </p>
                        {(s.outcomeMeasures.phq9 != null ||
                          s.outcomeMeasures.gad7 != null) && (
                          <p className="text-xs text-gray-400 mt-1">
                            {s.outcomeMeasures.phq9 != null
                              ? `PHQ-9: ${s.outcomeMeasures.phq9}`
                              : ''}
                            {s.outcomeMeasures.phq9 != null && s.outcomeMeasures.gad7 != null
                              ? ' / '
                              : ''}
                            {s.outcomeMeasures.gad7 != null
                              ? `GAD-7: ${s.outcomeMeasures.gad7}`
                              : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Outcome Trend Chart — only when ≥2 sessions have real outcome scores */}
      {hasEnoughRealData && hasOutcomeTrend && outcomeChartData.length >= 2 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <h3 className="font-playfair text-xl font-bold text-gray-900">Outcome Trends</h3>
            <InfoTooltip
              title="Outcome Tracking"
              description="Standardized clinical outcome measures tracked across sessions. PHQ-9 measures depression severity (0-27 scale), GAD-7 measures anxiety severity (0-21 scale). Scores are clinician-entered at each session."
              methodology="PHQ-9: Kroenke et al., 2001. GAD-7: Spitzer et al., 2006."
            />
          </div>
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">PHQ-9 & GAD-7</h4>
            <div className="w-full h-64" suppressHydrationWarning>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={outcomeChartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="session" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 27]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="PHQ9"
                    stroke="#DC2626"
                    name="PHQ-9"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="GAD7"
                    stroke="#F59E0B"
                    name="GAD-7"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Lower = better</p>
          </Card>
        </section>
      )}

      {/* Topic Recurrence Heatmap — real per-session structure tags only */}
      {hasEnoughRealData && hasTopicData && topicRecurrence.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <h3 className="font-playfair text-xl font-bold text-gray-900">Topic Recurrence</h3>
            <InfoTooltip
              title="Topic Recurrence"
              description="Phenomenological structures tagged on each session's analyzed moments, summed by session. Click a cell to see the supporting client quotes."
              methodology="Counted from analysis_result.moments[].structures across the client's completed sessions."
            />
          </div>
          <Card className="p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4 pb-2 border-b border-gray-100">
                <div className="w-40 flex-shrink-0 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Topic
                </div>
                <div className="flex-1 flex items-center gap-1">
                  {sessionNumbers.map((n) => (
                    <div
                      key={n}
                      className="flex-1 text-center text-[10px] font-mono text-gray-400"
                    >
                      S{n}
                    </div>
                  ))}
                </div>
              </div>
              {topicRecurrence.map((row) => {
                const max = Math.max(
                  1,
                  ...Array.from(row.perSession.values()).map((v) => v.count)
                );
                return (
                  <div key={row.topic} className="flex items-center gap-4">
                    <div className="w-40 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-900">{row.label}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-1">
                      {sessionNumbers.map((n) => {
                        const cell = row.perSession.get(n);
                        const count = cell?.count || 0;
                        const intensity = count / max; // 0..1
                        const bg =
                          count === 0
                            ? 'bg-gray-50'
                            : intensity > 0.66
                              ? 'bg-primary/80'
                              : intensity > 0.33
                                ? 'bg-primary/50'
                                : 'bg-primary/25';
                        return (
                          <div key={n} className="flex-1">
                            <LineagePopover
                              mode="block"
                              snippets={cell?.snippets || []}
                              methodology={`Structure tag "${row.label}" appeared in ${count} moment(s) of Session ${n}.`}
                            >
                              <div
                                className={`h-7 rounded ${bg} flex items-center justify-center hover:ring-2 hover:ring-primary/40 transition`}
                                title={`Session ${n}: ${count} moment${count === 1 ? '' : 's'}`}
                              >
                                {count > 0 && (
                                  <span className="text-[11px] font-mono text-white font-semibold">
                                    {count}
                                  </span>
                                )}
                              </div>
                            </LineagePopover>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary/25" /> Light
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary/50" /> Moderate
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary/80" /> Heavy
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-50 border" /> Not present
              </span>
            </div>
          </Card>
        </section>
      )}

      {/* Dominant-structures evolution — small multiples across sessions */}
      {hasEnoughRealData && hasStructureData && structureEvolutionData.length >= 2 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <h3 className="font-playfair text-xl font-bold text-gray-900">
              Dominant Structures
            </h3>
            <InfoTooltip
              title="Structure intensity over time"
              description="Per-session intensity of the top phenomenological structures, derived from the analysis pipeline's structure profile."
              methodology="Values come from analysis_result.structureProfile (0-1 scale) plotted per session."
            />
          </div>
          <Card className="p-6">
            <div className="w-full h-64" suppressHydrationWarning>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={structureEvolutionData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="session" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Body" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Emotion" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Cognitive" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Social" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Reflective" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Narrative" stroke="#EC4899" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      )}

      {/* Treatment Plan — per-session engagement signal (no fabricated %) */}
      {hasEnoughRealData && treatmentPlan.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <h3 className="font-playfair text-xl font-bold text-gray-900">
              Treatment Plan Engagement
            </h3>
            <InfoTooltip
              title="Treatment Plan Engagement"
              description="For each treatment goal on this client, we surface which sessions contained moments matching that goal's keywords. We do not fabricate completion percentages."
              methodology="Keyword overlap between clients.treatment_goals[i] and each session's treatment_goals + moment quotes."
            />
          </div>
          <div className="space-y-3">
            {treatmentPlan.map((goal) => {
              const addressedSessions = goal.perSession
                .filter((p) => p.addressed)
                .map((p) => p.sessionNumber);
              const allSnippets: LineageSnippet[] = goal.perSession
                .flatMap((p) =>
                  (p.snippets || [])
                    .filter((s) => s.quote)
                    .map((s) => ({
                      text: s.quote!,
                      timestamp: s.timestamp,
                      momentId: s.id,
                      speaker: 'client' as const,
                    }))
                )
                .slice(0, 5);
              return (
                <Card key={goal.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-2">
                        <Target className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            <LineagePopover
                              snippets={allSnippets}
                              methodology="Goal-to-moment keyword overlap. Snippets are quotes from sessions where the goal was discussed."
                            >
                              <span>{goal.goal}</span>
                            </LineagePopover>
                          </p>
                          <div className="mt-2 flex items-center gap-1 flex-wrap">
                            {goal.perSession.map((p) => (
                              <span
                                key={p.sessionNumber}
                                className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                                  p.addressed
                                    ? 'bg-primary/15 text-primary'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                                title={
                                  p.addressed
                                    ? `Addressed in Session ${p.sessionNumber}`
                                    : `Not addressed in Session ${p.sessionNumber}`
                                }
                              >
                                S{p.sessionNumber}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {addressedSessions.length === 0
                        ? 'Not yet addressed'
                        : `Addressed in ${addressedSessions.length}/${goal.perSession.length} session${
                            goal.perSession.length === 1 ? '' : 's'
                          }`}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
