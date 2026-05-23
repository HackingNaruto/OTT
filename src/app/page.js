'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      const { data } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
      if (data) setMovies(data);
      setLoading(false);
    }
    fetchMovies();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <header className="flex justify-between items-center mb-8 max-w-7xl mx-auto border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider text-red-600">STREAM<span className="text-white">X</span></h1>
        <Link href="/admin" className="bg-zinc-800 hover:bg-zinc-700 text-xs px-4 py-2 rounded-lg transition">
          Admin Panel
        </Link>
      </header>

      {loading ? (
        <div className="text-center text-zinc-500 mt-20 animate-pulse">Loading Catalog...</div>
      ) : (
        <main className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <Link href={`/watch?url=${encodeURIComponent(movie.video_url)}&title=${encodeURIComponent(movie.title)}`} key={movie.id}>
              <div className="bg-black rounded-xl overflow-hidden border border-zinc-800 hover:border-red-600 transition group cursor-pointer shadow-lg">
                <div className="aspect-video relative overflow-hidden">
                  <img src={movie.thumbnail_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-bold">PLAY</span>
                  </div>
                </div>
                <div className="p-3"><h3 className="font-semibold text-sm truncate text-zinc-200">{movie.title}</h3></div>
              </div>
            </Link>
          ))}
        </main>
      )}
    </div>
  );
}
