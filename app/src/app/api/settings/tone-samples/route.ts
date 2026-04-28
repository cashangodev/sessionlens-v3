import { NextResponse } from 'next/server';

/**
 * Stub route for the doctor-tone mimicry settings demo.
 * Real file ingestion + tone-modeling is post-demo work.
 */
export async function POST(_req: Request) {
  return NextResponse.json(
    { success: true, message: 'Sample uploaded' },
    { status: 200 },
  );
}

export async function GET() {
  return NextResponse.json(
    { samples: [], status: 'inactive' },
    { status: 200 },
  );
}
