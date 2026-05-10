import { NextResponse } from 'next/server';
import {
  buildDtryxBookingUrl,
  getDtryxFallbackUrl,
  isSupportedDtryxTheater,
} from '@/lib/dtryxBooking';
import {
  buildMovieeBookingUrl,
  getMovieeFallbackUrl,
  isSupportedMovieeTheater,
} from '@/lib/movieeBooking';
import {
  buildCineQBookingUrl,
  getCineQFallbackUrl,
  isSupportedCineQTheater,
} from '@/lib/cineqBooking';
import {
  buildCGVBookingUrl,
  getCGVFallbackUrl,
  isSupportedCGVTheater,
} from '@/lib/cgvBooking';
import {
  buildLotteBookingUrl,
  getLotteFallbackUrl,
  isSupportedLotteTheater,
} from '@/lib/lotteCinemaBooking';

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

  if (isSupportedDtryxTheater(theater)) {
    const result = await buildDtryxBookingUrl(theater, title, time, date);
    if (!result) {
      const fallback = getDtryxFallbackUrl(theater);
      return NextResponse.json({ success: false, url: fallback, isFallback: true });
    }
    return NextResponse.json({ success: true, url: result.url, isFallback: result.isFallback });
  }

  if (isSupportedMovieeTheater(theater)) {
    const result = await buildMovieeBookingUrl(theater, title, time, date);
    if (!result) {
      const fallback = getMovieeFallbackUrl(theater);
      return NextResponse.json({ success: false, url: fallback, isFallback: true });
    }
    return NextResponse.json({ success: true, url: result.url, isFallback: result.isFallback });
  }

  if (isSupportedCGVTheater(theater)) {
    const result = await buildCGVBookingUrl(theater, title, time, date);
    if (!result) {
      return NextResponse.json({ success: false, url: getCGVFallbackUrl(theater), isFallback: true });
    }
    return NextResponse.json({ success: true, url: result.url, isFallback: result.isFallback });
  }

  if (isSupportedCineQTheater(theater)) {
    const result = await buildCineQBookingUrl(theater, title, time, date);
    if (!result) {
      return NextResponse.json({ success: false, url: getCineQFallbackUrl(), isFallback: true });
    }
    return NextResponse.json({ success: true, url: result.url, isFallback: result.isFallback });
  }

  if (isSupportedLotteTheater(theater)) {
    const result = await buildLotteBookingUrl(theater, title, time, date);
    if (!result) {
      return NextResponse.json({ success: false, url: getLotteFallbackUrl(theater), isFallback: true });
    }
    return NextResponse.json({ success: true, url: result.url, isFallback: result.isFallback });
  }

  return NextResponse.json({ success: false, url: null, reason: 'unsupported' });
}
