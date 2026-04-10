import { AnalysisResult } from '@/types';
import { listClientProfiles } from '@/lib/client-profile';

// Simple client-side in-memory store for analysis results
// In production, this would use Supabase when auth is connected

export interface StoredSession {
  analysisResult: AnalysisResult;
  transcript: string;
  treatmentGoals: string;
  sessionNumber: number;
  clientCode: string;
  date: string;      // YYYY-MM-DD (supports backdating)
  time: string;      // HH:MM
  createdAt: string;
}

// Flat session info for calendar/list views (no heavy analysis data)
export interface SessionSummary {
  id: string;
  clientCode: string;
  sessionNumber: number;
  date: string;
  time: string;
  createdAt: string;
}

// Use a Map for in-memory storage (will be lost on page reload in browser)
const sessionStore = new Map<string, StoredSession>();

export function storeSession(id: string, data: StoredSession): void {
  sessionStore.set(id, data);
}

export function getSession(id: string): StoredSession | null {
  return sessionStore.get(id) || null;
}

export function listSessions(): SessionSummary[] {
  return Array.from(sessionStore.entries()).map(([id, s]) => ({
    id,
    clientCode: s.clientCode,
    sessionNumber: s.sessionNumber,
    date: s.date,
    time: s.time,
    createdAt: s.createdAt,
  }));
}

export function deleteSession(id: string): boolean {
  return sessionStore.delete(id);
}

// ─── Client-oriented queries ───

export interface ClientInfo {
  clientCode: string;
  sessionCount: number;
  lastSessionDate: string;
  lastSessionTime: string;
  firstSessionDate: string;
}

/** Get unique client codes with aggregated info, sorted by last session date desc. */
export function getClientCodes(): ClientInfo[] {
  const map = new Map<string, ClientInfo>();

  for (const [, s] of Array.from(sessionStore.entries())) {
    const existing = map.get(s.clientCode);
    if (!existing) {
      map.set(s.clientCode, {
        clientCode: s.clientCode,
        sessionCount: 1,
        lastSessionDate: s.date,
        lastSessionTime: s.time,
        firstSessionDate: s.date,
      });
    } else {
      existing.sessionCount++;
      if (s.date > existing.lastSessionDate || (s.date === existing.lastSessionDate && s.time > existing.lastSessionTime)) {
        existing.lastSessionDate = s.date;
        existing.lastSessionTime = s.time;
      }
      if (s.date < existing.firstSessionDate) {
        existing.firstSessionDate = s.date;
      }
    }
  }

  // Also include clients from profile store that have no sessions yet
  const profiles = listClientProfiles();
  const today = new Date().toISOString().split('T')[0];
  for (const p of profiles) {
    if (!map.has(p.clientCode)) {
      map.set(p.clientCode, {
        clientCode: p.clientCode,
        sessionCount: 0,
        lastSessionDate: p.createdAt.split('T')[0] || today,
        lastSessionTime: '00:00',
        firstSessionDate: p.createdAt.split('T')[0] || today,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.lastSessionDate.localeCompare(a.lastSessionDate));
}

/** Get all sessions for a specific client, newest first. */
export function getSessionsByClient(clientCode: string): (SessionSummary & { treatmentGoals: string })[] {
  return Array.from(sessionStore.entries())
    .filter(([, s]) => s.clientCode.toLowerCase() === clientCode.toLowerCase())
    .map(([id, s]) => ({
      id,
      clientCode: s.clientCode,
      sessionNumber: s.sessionNumber,
      date: s.date,
      time: s.time,
      createdAt: s.createdAt,
      treatmentGoals: s.treatmentGoals,
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
}
