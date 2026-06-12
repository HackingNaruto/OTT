import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  try {
    const encodedTitle = encodeURIComponent(title);
    // Hardcoding the provided key per instructions, but falling back to env
    const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY || 'e547e17d4e91f3e62a571655cd1ccaff';
    
    // First try searching as a movie, then as TV if no poster found. To be simple, we just do a multi-search
    const tmdbUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodedTitle}`;

    const response = await fetch(tmdbUrl);
    
    if (!response.ok) {
      throw new Error(`TMDB API Failed. Status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      if (result.poster_path) {
        return NextResponse.json({ 
          posterUrl: result.poster_path,
          backdropUrl: result.backdrop_path || null 
        });
      }
    }

    return NextResponse.json({ error: 'No poster found on TMDB API for this title.' }, { status: 404 });
  } catch (error) {
    console.error('TMDB API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch from TMDB.' }, { status: 500 });
  }
}
