import { NextResponse } from 'next/server';
import { dbGetClientCodes, dbCreateBlankClient, dbGenerateClientCode } from '@/lib/supabase/db';

export async function GET() {
  try {
    const clients = await dbGetClientCodes();
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('GET /api/clients error:', error);
    return NextResponse.json({ error: 'Failed to list clients' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientCode, gender, ageRange, clinicalNotes, autoGenerate } = body;

    const code = autoGenerate ? await dbGenerateClientCode() : clientCode;
    if (!code) {
      return NextResponse.json({ error: 'Client code is required' }, { status: 400 });
    }

    const client = await dbCreateBlankClient(code, gender || '', ageRange || '', clinicalNotes || '');
    if (!client) {
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    return NextResponse.json({ client: { clientCode: client.client_code, id: client.client_id } });
  } catch (error) {
    console.error('POST /api/clients error:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
