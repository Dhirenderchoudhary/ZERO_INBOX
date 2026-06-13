import { processWebhook } from 'corsair';
import { corsair } from '@/server/corsair';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  try {
    const result = await processWebhook(corsair, headers, body, {
      tenantId: process.env.TENANT_ID ?? 'dev',
    });
    return NextResponse.json(result.response ?? { ok: true });
  } catch {
    return NextResponse.json({ error: 'not handled' }, { status: 404 });
  }
}
