'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [siteName, setSiteName] = useState('STREAMX');
  const [loading, setLoading] = useState(true);
  const [trendingEnabled, setTrendingEnabled] = useState(false);
  const [themeToggleEnabled, setThemeToggleEnabled] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [moviesRes, settingsRes, trendingRes] = await Promise.all([
        supabase.from('movies').select('*').order('created_at', { ascending: false }),
        supabase.from('site_settings').select('site_name, trending_carousel_enabled, theme_toggle_enabled').eq('id', 1).single(),
        supabase.from('movies').select('*').order('views', { ascending: false }).limit(10)
      ]);
      if (moviesRes.data) setMovies(moviesRes.data);
      if (trendingRes.data) setTrendingMovies(trendingRes.data);
      if (settingsRes.data) {
        if (settingsRes.data.site_name) setSiteName(settingsRes.data.site_name.toUpperCase());
        setTrendingEnabled(settingsRes.data.trending_carousel_enabled || false);
        setThemeToggleEnabled(settingsRes.data.theme_toggle_enabled || false);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
  };

  const trendingList = trendingMovies;
  const movieList = movies.filter(m => m.type === 'movie');
  const seriesList = movies.filter(m => m.type === 'series');

  const MovieCard = ({ movie }) => (
    <Link href={`/watch?id=${movie.id}`} key={movie.id} className="w-full flex-none block">
      <div className="bg-white dark:bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 hover:border-red-500 dark:hover:border-red-600 transition group cursor-pointer shadow-lg h-full">
        <div className="aspect-[2/3] relative overflow-hidden bg-gray-100 dark:bg-zinc-900">
          <img src={movie.thumbnail_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
          {movie.type && (
            <div className="absolute top-2 right-2 bg-black/80 text-[10px] font-bold px-2 py-1 rounded border border-zinc-700 uppercase tracking-wider text-zinc-300">
              {movie.type}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
            <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg">PLAY</span>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-zinc-200">{movie.short_title || movie.title}</h3>
        </div>
      </div>
    </Link>
  );

  const TrendingCard = ({ movie, idx }) => (
    <Link href={`/watch?id=${movie.id}`} key={`${movie.id}-${idx}`} className="min-w-[300px] md:min-w-[480px] flex-none block mx-2">
      <div className="bg-white dark:bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 hover:border-red-500 dark:hover:border-red-600 transition group cursor-pointer shadow-xl h-full">
        <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-zinc-900">
          <img src={movie.landscape_thumbnail_url || movie.thumbnail_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          {movie.type && (
            <div className="absolute top-2 right-2 bg-black/80 text-[10px] font-bold px-2 py-1 rounded border border-zinc-700 uppercase tracking-wider text-zinc-300">
              {movie.type}
            </div>
          )}
          <div className="absolute top-2 left-2 bg-red-600/90 text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-wider text-white">
            🔥 Top {idx % trendingMovies.length + 1}
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
            <span className="bg-red-600 px-4 py-2 rounded-full text-sm font-bold text-white shadow-xl shadow-red-500/50">PLAY NOW</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-base truncate text-gray-900 dark:text-zinc-100">{movie.title}</h3>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white p-6 transition-colors">
      <style>{`
        .carousel-track {
          display: flex;
          width: max-content;
          animation: scroll 40s linear infinite;
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <header className="flex justify-between items-center mb-8 max-w-7xl mx-auto border-b border-gray-200 dark:border-zinc-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider text-red-600">{siteName}</h1>
        {themeToggleEnabled && (
           <button onClick={toggleTheme} className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition w-10 h-10 rounded-full bg-white dark:bg-zinc-900 shadow-md border border-gray-200 dark:border-zinc-800 flex items-center justify-center">
             <i className="fas fa-sun block dark:hidden"></i>
             <i className="fas fa-moon hidden dark:block"></i>
           </button>
        )}
      </header>

      {loading ? (
        <div className="text-center text-gray-500 dark:text-zinc-500 mt-20 animate-pulse">Loading Catalog...</div>
      ) : (
        <main className="max-w-7xl mx-auto space-y-12">
          
          {/* Trending Carousel */}
          {trendingEnabled && trendingList.length > 0 && (
            <section className="overflow-hidden">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-zinc-100 flex items-center gap-2">🔥 Trending Now</h2>
              <div className="overflow-hidden relative pb-4">
                <div className="carousel-track">
                  {[...trendingList, ...trendingList].map((movie, idx) => (
                     <TrendingCard key={`${movie.id}-${idx}`} movie={movie} idx={idx} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Latest Movies */}
          {movieList.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-zinc-100">🎬 Latest Movies</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {movieList.map(movie => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            </section>
          )}

          {/* Latest Series */}
          {seriesList.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-zinc-100">📺 Latest Series</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {seriesList.map(movie => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            </section>
          )}

        </main>
      )}
    </div>
  );
}
