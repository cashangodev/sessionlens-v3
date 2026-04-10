import { NextResponse } from 'next/server';
import { dbListSessions, dbStoreSession, dbGetSessionsByClient } from '@/lib/supabase/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientCode = searchParams.get('clientCode');

    if (clientCode) {
      const sessions = await dbGetSessionsByClient(clientCode);
      return NextResponse.json({ sessions });
    }

    const sessions = await dbListSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('GET /api/sessions error:', error);
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientCode, transcript, treatmentGoals, sessionNumber, date, time, analysisResult } = body;

    if (!clientCode) {
      return NextResponse.json({ error: 'clientCode is required' }, { status: 400 });
    }

    const sessionId = await dbStoreSession({
      clientCode,
      transcript: transcript || '',
      treatmentGoals: treatmentGoals || '',
      sessionNumber: sessionNumber || 1,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '00:00',
      analysisResult: analysisResult || undefined,
    });

    if (!sessionId) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error('POST /api/sessions error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
