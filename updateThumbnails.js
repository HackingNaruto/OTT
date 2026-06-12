require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY; 
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'e547e17d4e91f3e62a571655cd1ccaff';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase keys in environment!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
      console.log(`Fetching TMDB Data for: ${item.title}...`);
      
      const searchType = item.type === 'movie' ? 'movie' : 'tv';
      const tmdbUrl = `https://api.themoviedb.org/3/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(item.title)}`;
      
      const res = await fetch(tmdbUrl);
      const tmdbData = await res.json();

      if (tmdbData.results && tmdbData.results.length > 0) {
        const poster = tmdbData.results[0].poster_path;     // Portrait
        const backdrop = tmdbData.results[0].backdrop_path; // Landscape

        await supabase
          .from('movies')
          .update({ 
            thumbnail_url: poster,
            landscape_thumbnail_url: backdrop
          })
          .eq('id', item.id);

        console.log(`✅ Updated: ${item.title} -> Poster: ${poster} | Landscape: ${backdrop}`);
      } else {
        console.log(`❌ Not found in TMDB API: ${item.title}`);
      }
      
      // Delay 250ms to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 250));

    } catch (err) {
      console.error(`Error processing ${item.title}:`, err.message);
    }
  }
  console.log('Migration Complete! 🎉 All old thumbnails are now TMDB paths.');
}

updateAllThumbnails();
