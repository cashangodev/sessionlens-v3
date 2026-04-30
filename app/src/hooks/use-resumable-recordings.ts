'use client';

/**
 * Shared hook for surfacing in-flight recordings stored in IndexedDB.
 *
 * Used by both the dashboard home and the session/new page so the user
 * sees the resume option no matter where they land after re-opening the
 * tab. Filters to the last 24 hours so we don't dredge up ancient orphans.
 *
 * Errors are surfaced via console.error rather than swallowed silently —
 * this is the diagnostic surface for "I closed the tab but nothing came
 * back" reports.
 */

import { useEffect, useState } from 'react';
import { listOpenRecordings, type RecordingMeta } from '@/lib/recording/chunk-store';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function useResumableRecordings(): {
  recordings: RecordingMeta[];
  /** Re-run the IDB query (after a discard, after a manual refresh). */
  refresh: () => void;
} {
  const [recordings, setRecordings] = useState<RecordingMeta[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    listOpenRecordings()
      .then((all) => {
        if (cancelled) return;
        const cutoff = Date.now() - TWENTY_FOUR_HOURS;
        const recent = all.filter((r) => r.startedAt >= cutoff);
        setRecordings(recent);
        // Diagnostic for the "nothing happened" case — observable in
        // browser DevTools without surfacing in the UI.
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug(
            `[resumable] found ${all.length} total / ${recent.length} within 24h`,
          );
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[resumable] listOpenRecordings failed:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return {
    recordings,
    refresh: () => setTick((n) => n + 1),
  };
}
