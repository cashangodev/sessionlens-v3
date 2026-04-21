import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  // TODO: Add Clerk auth
  // TODO: Run analysis pipeline
  return NextResponse.json({ message: 'Analysis - coming soon', sessionId: params.sessionId });
}
