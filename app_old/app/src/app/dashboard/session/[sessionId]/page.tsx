import { redirect } from 'next/navigation';

export default function SessionPage({ params }: { params: { sessionId: string } }) {
  redirect(`/dashboard/session/${params.sessionId}/summary`);
}
