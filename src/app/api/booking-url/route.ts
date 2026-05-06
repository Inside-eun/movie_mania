import { NextResponse } from 'next/server';
import {
  buildDtryxBookingUrl,
  getDtryxFallbackUrl,
  isSupportedDtryxTheater,
} from '@/lib/dtryxBooking';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const theater = searchParams.get('theater') ?? '';
  const title = searchParams.get('title') ?? '';
  const time = searchParams.get('time') ?? '';
  const date = searchParams.get('date') ?? '';

  if (!theater || !date) {
    return NextResponse.json({ success: false, url: null });
  }

  if (!isSupportedDtryxTheater(theater)) {
    return NextResponse.json({ success: false, url: null, reason: 'unsupported' });
  }

  const result = await buildDtryxBookingUrl(theater, title, time, date);

  if (!result) {
    const fallback = getDtryxFallbackUrl(theater);
    return NextResponse.json({ success: false, url: fallback, isFallback: true });
  }

  return NextResponse.json({
    success: true,
    url: result.url,
    isFallback: result.isFallback,
  });
}
