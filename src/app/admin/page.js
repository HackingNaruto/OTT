'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Admin() {
  const [form, setForm] = useState({ title: '', thumbnail_url: '', video_url: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.thumbnail_url || !form.video_url) return alert('Fill all fields!');

    setLoading(true);
    const { error } = await supabase.from('movies').insert([form]);
    setLoading(false);

    if (error) alert('Error: ' + error.message);
    else {
      alert('Stream Added Successfully!');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-red-600 mb-6">⚙️ Add New Stream</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Title (Eg: Leo 2023)" className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <input type="text" placeholder="Thumbnail Image URL" className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={form.thumbnail_url} onChange={e => setForm({...form, thumbnail_url: e.target.value})} />
          <input type="text" placeholder="Direct Video URL (.mp4/.mkv)" className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} />
          <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 font-bold py-3 rounded-xl transition text-sm disabled:opacity-50">
            {loading ? 'Publishing...' : 'Push to App'}
          </button>
        </form>
      </div>
    </div>
  );
}
