'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AnalysisRedirect() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  useEffect(() => {
    router.replace(`/dashboard/session/${sessionId}/summary`);
  }, [router, sessionId]);

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-gray-400 text-sm">Redirecting to Session Overview...</p>
    </div>
  );
}
