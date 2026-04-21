import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: Request) {
  // TODO: Add Clerk auth
  // TODO: Create session in Supabase
  return NextResponse.json({ message: 'Session creation - coming soon' });
}

export async function GET() {
  // TODO: Add Clerk auth
  // TODO: List sessions from Supabase
  return NextResponse.json({ sessions: [] });
}
