import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Movie } from '@/models/Movie';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const city = searchParams.get('city');

    const query: any = {
      'theater.type': 'arthouse'
    };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.showtime = { $gte: startDate, $lt: endDate };
    }

    if (city) {
      query['theater.location'] = new RegExp(`^${city}`);
    }

    const movies = await Movie.find(query)
      .sort({ showtime: 1 })
      .limit(100);

    return NextResponse.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}