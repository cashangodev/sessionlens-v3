import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: Request) {
  // TODO: Add Clerk auth
  // TODO: Create client in Supabase
  return NextResponse.json({ message: 'Client creation - coming soon' });
}

export async function GET() {
  // TODO: Add Clerk auth
  // TODO: List clients from Supabase
  return NextResponse.json({ clients: [] });
}
