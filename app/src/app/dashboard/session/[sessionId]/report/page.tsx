'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import type { AnalysisResult } from '@/types';
import { Card } from '@/components/ui/Card';
import {
  FileText,
  Download,
  User,
  Stethoscope,
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

function renderMarkdown(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={i} className="h-3" />;
    }
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={i} className="text-base font-bold text-gray-800 mt-4 mb-1">
          {trimmed.slice(4)}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={i} className="text-lg font-bold text-gray-900 mt-5 mb-2">
          {trimmed.slice(3)}
        </h3>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h2 key={i} className="font-playfair text-xl font-bold text-gray-900 mt-6 mb-2">
          {trimmed.slice(2)}
        </h2>
      );
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <li key={i} className="text-sm text-gray-700 leading-relaxed ml-4 list-disc">
          {trimmed.slice(2)}
        </li>
      );
    }
    if (/^\d+\.\s/.test(trimmed)) {
      return (
        <li key={i} className="text-sm text-gray-700 leading-relaxed ml-4 list-decimal">
          {trimmed.replace(/^\d+\.\s/, '')}
        </li>
      );
    }
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return (
        <p key={i} className="text-sm font-semibold text-gray-800 mt-2">
          {trimmed.slice(2, -2)}
        </p>
      );
    }
    return (
      <p key={i} className="text-sm text-gray-700 leading-relaxed">
        {trimmed}
      </p>
    );
  });
}

export default function ReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { data, loading } = useApi<{ session: SessionData }>(`/api/sessions/${sessionId}`);
  const session = data?.session ?? null;

  const [activeView, setActiveView] = useState<'clinician' | 'patient'>('clinician');

  const handleDownload = useCallback(() => {
    if (!session?.analysisResult) return;
    const analysis = session.analysisResult as AnalysisResult;
    const content =
      activeView === 'clinician'
        ? analysis.clinicianReport
        : analysis.patientReport;

    if (!content) return;

    const header =
      activeView === 'clinician' ? 'CLINICIAN REPORT' : 'PATIENT REPORT';
    const fullText = `${header}\nSession: ${session.clientCode} - Session #${session.sessionNumber}\nDate: ${session.date}\n\n${content}`;

    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.clientCode}-session${session.sessionNumber}-${activeView}-report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [session, activeView]);

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

  const analysis = session.analysisResult as AnalysisResult | null;
  const clinicianReport = analysis?.clinicianReport;
  const patientReport = analysis?.patientReport;
  const hasReports = Boolean(clinicianReport || patientReport);

  if (!hasReports) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-4" />
        <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">
          Reports Not Available
        </h3>
        <p className="text-gray-600">
          Reports not available for this session. The session may not have been analyzed yet.
        </p>
      </Card>
    );
  }

  const currentReport =
    activeView === 'clinician' ? clinicianReport : patientReport;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-gray-900">Full Report</h2>
          <p className="text-sm text-gray-500 mt-1">
            {session.clientCode} &middot; Session #{session.sessionNumber} &middot; {session.date}
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={!currentReport}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Download as Text
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-0 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveView('clinician')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeView === 'clinician'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Clinician View
        </button>
        <button
          onClick={() => setActiveView('patient')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeView === 'patient'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4" />
          Patient View
        </button>
      </div>

      {/* Report Content */}
      <Card className="p-6 sm:p-8">
        {currentReport ? (
          <div className="prose-sm max-w-none">{renderMarkdown(currentReport)}</div>
        ) : (
          <div className="text-center py-10">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {activeView === 'clinician'
                ? 'Clinician report not available for this session.'
                : 'Patient report not available for this session.'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
