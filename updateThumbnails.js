require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY; 

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase keys in environment!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function scrapePoster(title) {
  const encodedTitle = encodeURIComponent(title);
  const tmdbUrl = `https://www.themoviedb.org/search?query=${encodedTitle}`;

  const response = await fetch(tmdbUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) return null;

  const html = await response.text();
  const $ = cheerio.load(html);
  
  const firstImage = $('img.poster').first();
  let posterUrl = firstImage.attr('src');
  
  if (posterUrl) {
    posterUrl = posterUrl.replace(/w\d+_and_h\d+_face/, 'w500');
  }
  
  return posterUrl || null;
}

async function updateAllThumbnails() {
  console.log('Fetching all existing content from Supabase...');
  
  const { data: contents, error } = await supabase
    .from('movies')
    .select('id, title, type'); 

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  if (!contents || contents.length === 0) {
    console.log('No movies found to update.');
    return;
  }

  for (let item of contents) {
    try {
      console.log(`Scraping IMDb for: ${item.title}...`);
      const poster = await scrapePoster(item.title);

      if (poster) {
        await supabase
          .from('movies')
          .update({ 
            thumbnail_url: poster
          })
          .eq('id', item.id);

        console.log(`✅ Updated: ${item.title} -> ${poster}`);
      } else {
        console.log(`❌ Not found on IMDb: ${item.title}`);
      }
      
      // Delay 1 second to avoid IMDb rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      console.error(`Error processing ${item.title}:`, err.message);
    }
  }
  console.log('Migration Complete! 🎉 All old thumbnails are now IMDb scraped paths.');
}

updateAllThumbnails();
