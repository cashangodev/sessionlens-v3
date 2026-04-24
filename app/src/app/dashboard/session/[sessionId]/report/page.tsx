'use client';

import { redirect } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function ReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  redirect(`/dashboard/session/${sessionId}/summary`);
}
