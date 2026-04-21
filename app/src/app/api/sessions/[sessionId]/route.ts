import { NextResponse } from 'next/server';
import { dbGetSession, dbDeleteSession, dbUpdateSessionAnalysis } from '@/lib/supabase/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  try {
    const session = await dbGetSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (error) {
    console.error('GET /api/sessions/[sessionId] error:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  try {
    const deleted = await dbDeleteSession(sessionId);
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/sessions/[sessionId] error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  try {
    const body = await req.json();
    const { outcomeMeasures, editedAssessment } = body;

    if (!outcomeMeasures && !editedAssessment) {
      return NextResponse.json({ error: 'Missing outcomeMeasures or editedAssessment' }, { status: 400 });
    }

    // Get current session to merge with existing analysis
    const session = await dbGetSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const currentAnalysis = session.analysisResult as Record<string, unknown> || {};
    const updatedAnalysis: Record<string, unknown> = {
      ...currentAnalysis,
    };

    if (outcomeMeasures) {
      updatedAnalysis.outcomeMeasures = outcomeMeasures;
    }

    if (editedAssessment !== undefined) {
      updatedAnalysis.editedAssessment = editedAssessment;
    }

    const success = await dbUpdateSessionAnalysis(sessionId, updatedAnalysis);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/sessions/[sessionId] error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
