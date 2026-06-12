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
    const imdbUrl = `https://www.imdb.com/find/?q=${encodedTitle}`;

    // Spoof User-Agent to avoid getting 403 Forbidden from IMDb
    const response = await fetch(imdbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from IMDb. Status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for the first high-quality image inside IMDb's search results
    // IMDb usually uses img.ipc-image for movie posters in lists
    const firstImage = $('img.ipc-image').first();
    let posterUrl = firstImage.attr('src');
    
    // Sometimes IMDb lazy-loads and stores the high-res URL in a srcset or another attribute
    // If src is a placeholder or base64, we might need to parse srcset. 
    // We'll check the 'srcset' and extract the highest resolution if possible.
    const srcSet = firstImage.attr('srcset');
    if (srcSet) {
      // srcset looks like: "url 100w, url 200w" -> we want the last one for best quality
      const srcList = srcSet.split(',').map(s => s.trim().split(' '));
      if (srcList.length > 0) {
        posterUrl = srcList[srcList.length - 1][0]; // grab the highest resolution URL
      }
    }

    if (!posterUrl) {
      return NextResponse.json({ error: 'No poster found on IMDb for this title.' }, { status: 404 });
    }

    return NextResponse.json({ posterUrl });
  } catch (error) {
    console.error('Scraping Error:', error);
    return NextResponse.json({ error: 'Failed to scrape poster.' }, { status: 500 });
  }
}
