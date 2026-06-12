import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  try {
    const encodedTitle = encodeURIComponent(title);
    const tmdbUrl = `https://www.themoviedb.org/search?query=${encodedTitle}`;

    const response = await fetch(tmdbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from TMDB. Status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const firstImage = $('img.poster').first();
    let posterUrl = firstImage.attr('src');
    
    if (posterUrl) {
      // Convert low-res thumbnail to high-res
      posterUrl = posterUrl.replace(/w\d+_and_h\d+_face/, 'w500');
    }

    if (!posterUrl) {
      return NextResponse.json({ error: 'No poster found for this title.' }, { status: 404 });
    }

    return NextResponse.json({ posterUrl });
  } catch (error) {
    console.error('Scraping Error:', error);
    return NextResponse.json({ error: 'Failed to scrape poster.' }, { status: 500 });
  }
}
