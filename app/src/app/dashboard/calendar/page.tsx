'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, ArrowLeft } from 'lucide-react';
import { useApi } from '@/hooks/use-api';

interface CalendarSession {
  id: string;
  clientCode: string;
  sessionDate: string; // ISO date
  sessionTime: string; // HH:MM
  sessionNumber: number;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: sessionsData } = useApi<{ sessions: { id: string; clientCode: string; sessionNumber: number; date: string; time: string; }[] }>('/api/sessions');
  const sessions = useMemo(() => {
    return (sessionsData?.sessions || []).map(s => ({
      id: s.id,
      clientCode: s.clientCode || 'CL-DEMO',
      sessionDate: s.date || new Date().toISOString().split('T')[0],
      sessionTime: s.time || '10:00',
      sessionNumber: s.sessionNumber || 1,
    }));
  }, [sessionsData]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Build session lookup by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, CalendarSession[]> = {};
    sessions.forEach((s) => {
      if (!map[s.sessionDate]) map[s.sessionDate] = [];
      map[s.sessionDate].push(s);
    });
    return map;
  }, [sessions]);

  // Sessions for selected date
  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] || []) : [];

  function goToPreviousMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  }

  function goToToday() {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(null);
  }

  function formatDateKey(day: number): string {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  }

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back to Home */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Home
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-playfair text-2xl font-bold text-gray-900">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <button
                onClick={goToToday}
                className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors"
              >
                Today
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = formatDateKey(day);
              const daySessions = sessionsByDate[dateKey] || [];
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDate;
              const hasSessions = daySessions.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  className={`
                    relative h-16 flex flex-col items-center justify-start pt-2 rounded-lg transition-all duration-150
                    ${isSelected
                      ? 'bg-primary text-white shadow-md'
                      : isToday
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'hover:bg-gray-50 text-gray-700'
                    }
                  `}
                >
                  <span className="text-sm">{day}</span>
                  {hasSessions && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {daySessions.slice(0, 3).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-primary'
                          }`}
                        />
                      ))}
                      {daySessions.length > 3 && (
                        <span className={`text-[9px] ml-0.5 ${isSelected ? 'text-white/80' : 'text-primary'}`}>
                          +{daySessions.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {selectedDate ? (
            <>
              <h3 className="font-semibold text-gray-900 mb-1">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''}
              </p>

              {selectedSessions.length > 0 ? (
                <div className="space-y-3">
                  {selectedSessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/dashboard/session/${session.id}/summary`}
                      className="block p-4 rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {session.clientCode}
                        </span>
                        <span className="text-xs text-gray-500">
                          Session #{session.sessionNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {session.sessionTime}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-4">No sessions on this date</p>
                  <Link
                    href={`/dashboard/session/new?date=${selectedDate}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    + Add a session for this date
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon />
              <p className="text-gray-400 text-sm mt-4">
                Select a date to view sessions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
      <Clock className="w-8 h-8 text-gray-300" />
    </div>
  );
}
