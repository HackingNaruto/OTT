require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Automatically pulling from Vercel / local .env.local file
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY; 
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateAllThumbnails() {
  console.log('Fetching all existing content from Supabase...');
  
  // 'movies' table-la irukkira ellathayum edukkum (Movie/Series type include panni)
  const { data: contents, error } = await supabase
    .from('movies')
    .select('id, title, type'); // type column 'movie' illa 'series' nu irukkum nu nenaikiren

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
      let tmdbUrl = '';
      if (item.type === 'movie') {
        tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(item.title)}`;
      } else {
        // Series ah irundha TV search
        tmdbUrl = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(item.title)}`;
      }

      const res = await fetch(tmdbUrl);
      const tmdbData = await res.json();

      if (tmdbData.results && tmdbData.results.length > 0) {
        const poster = tmdbData.results[0].poster_path;     // Portrait
        const backdrop = tmdbData.results[0].backdrop_path; // Landscape

        // Supabase-la update pandradhu
        await supabase
          .from('movies')
          .update({ 
            thumbnail_url: poster,    // Unga column name yetha maari maathikonga
            landscape_thumbnail_url: backdrop  // Unga column name yetha maari maathikonga
          })
          .eq('id', item.id);

        console.log(`✅ Updated: ${item.title}`);
      } else {
        console.log(`❌ Not found in TMDB: ${item.title}`);
      }
      
      // API block aagama irukka delay
      await new Promise(resolve => setTimeout(resolve, 250));

    } catch (err) {
      console.error(`Error processing ${item.title}:`, err.message);
    }
  }
  console.log('Migration Complete! 🎉 All old thumbnails are now TMDB paths.');
}

updateAllThumbnails();
