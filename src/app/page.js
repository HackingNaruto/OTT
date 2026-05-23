'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [siteName, setSiteName] = useState('STREAMX');
  const [loading, setLoading] = useState(true);
  const [trendingEnabled, setTrendingEnabled] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [moviesRes, settingsRes] = await Promise.all([
        supabase.from('movies').select('*').order('created_at', { ascending: false }),
        supabase.from('site_settings').select('site_name, trending_carousel_enabled').eq('id', 1).single()
      ]);
      if (moviesRes.data) setMovies(moviesRes.data);
      if (settingsRes.data) {
        if (settingsRes.data.site_name) setSiteName(settingsRes.data.site_name.toUpperCase());
        setTrendingEnabled(settingsRes.data.trending_carousel_enabled || false);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const trendingList = movies.filter(m => m.is_trending);
  const movieList = movies.filter(m => m.type === 'movie' && !m.is_trending);
  const seriesList = movies.filter(m => m.type === 'series' && !m.is_trending);

  const MovieCard = ({ movie, isTrending = false }) => (
    <Link href={`/watch?id=${movie.id}`} key={movie.id} className={`${isTrending ? 'min-w-[280px] md:min-w-[400px]' : 'w-full'} flex-none block`}>
      <div className="bg-black rounded-xl overflow-hidden border border-zinc-800 hover:border-red-600 transition group cursor-pointer shadow-lg h-full">
        <div className="aspect-video relative overflow-hidden">
          <img src={movie.thumbnail_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
          {movie.type && (
            <div className="absolute top-2 right-2 bg-black/80 text-[10px] font-bold px-2 py-1 rounded border border-zinc-700 uppercase tracking-wider text-zinc-300">
              {movie.type}
            </div>
          )}
          {movie.is_trending && (
            <div className="absolute top-2 left-2 bg-red-600/90 text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-wider text-white">
              🔥 Trending
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
            <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-bold">PLAY</span>
          </div>
        </div>
        <div className="p-3"><h3 className="font-semibold text-sm truncate text-zinc-200">{movie.title}</h3></div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <header className="flex justify-between items-center mb-8 max-w-7xl mx-auto border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider text-red-600">{siteName}</h1>
      </header>

      {loading ? (
        <div className="text-center text-zinc-500 mt-20 animate-pulse">Loading Catalog...</div>
      ) : (
        <main className="max-w-7xl mx-auto space-y-12">
          
          {/* Trending Carousel */}
          {trendingEnabled && trendingList.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 text-zinc-100 flex items-center gap-2">🔥 Trending Now</h2>
              <div className="flex gap-4 overflow-x-auto whitespace-nowrap hide-scrollbar pb-4">
                {trendingList.map(movie => <MovieCard key={movie.id} movie={movie} isTrending={true} />)}
              </div>
            </section>
          )}

          {/* Latest Movies */}
          {movieList.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 text-zinc-100">🎬 Latest Movies</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {movieList.map(movie => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            </section>
          )}

          {/* Latest Series */}
          {seriesList.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 text-zinc-100">📺 Latest Series</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {seriesList.map(movie => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            </section>
          )}

        </main>
      )}
    </div>
  );
}
