'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Admin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('movie'); // 'movie' or 'series'
  
  // Basic Info
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState(''); // Fallback

  // Content Data State
  const [movieQualities, setMovieQualities] = useState([{ quality: '1080p', url: '' }]);
  const [seasons, setSeasons] = useState([
    {
      season: 1,
      episodes: [
        {
          episode: 1,
          title: 'Episode 1',
          qualities: [{ quality: '1080p', url: '' }]
        }
      ]
    }
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !thumbnailUrl) return alert('Title and Thumbnail are required!');

    setLoading(true);

    let contentDataPayload = null;
    if (type === 'movie') {
      contentDataPayload = movieQualities;
    } else {
      contentDataPayload = seasons;
    }

    const payload = {
      title,
      thumbnail_url: thumbnailUrl,
      video_url: videoUrl,
      type,
      content_data: contentDataPayload
    };

    const { error } = await supabase.from('movies').insert([payload]);
    setLoading(false);

    if (error) alert('Error: ' + error.message);
    else {
      alert('Content Published Successfully!');
      router.push('/');
    }
  };

  // --- Movie Quality Handlers ---
  const addMovieQuality = () => setMovieQualities([...movieQualities, { quality: '', url: '' }]);
  const updateMovieQuality = (idx, field, val) => {
    const updated = [...movieQualities];
    updated[idx][field] = val;
    setMovieQualities(updated);
  };
  const removeMovieQuality = (idx) => setMovieQualities(movieQualities.filter((_, i) => i !== idx));

  // --- Series Handlers ---
  const addSeason = () => {
    setSeasons([...seasons, { season: seasons.length + 1, episodes: [] }]);
  };
  const updateSeasonNum = (sIdx, val) => {
    const updated = [...seasons];
    updated[sIdx].season = Number(val);
    setSeasons(updated);
  };
  const addEpisode = (sIdx) => {
    const updated = [...seasons];
    updated[sIdx].episodes.push({
      episode: updated[sIdx].episodes.length + 1,
      title: `Episode ${updated[sIdx].episodes.length + 1}`,
      qualities: [{ quality: '1080p', url: '' }]
    });
    setSeasons(updated);
  };
  const updateEpisode = (sIdx, eIdx, field, val) => {
    const updated = [...seasons];
    if (field === 'episode') updated[sIdx].episodes[eIdx][field] = Number(val);
    else updated[sIdx].episodes[eIdx][field] = val;
    setSeasons(updated);
  };
  const addEpisodeQuality = (sIdx, eIdx) => {
    const updated = [...seasons];
    updated[sIdx].episodes[eIdx].qualities.push({ quality: '', url: '' });
    setSeasons(updated);
  };
  const updateEpisodeQuality = (sIdx, eIdx, qIdx, field, val) => {
    const updated = [...seasons];
    updated[sIdx].episodes[eIdx].qualities[qIdx][field] = val;
    setSeasons(updated);
  };
  const removeEpisodeQuality = (sIdx, eIdx, qIdx) => {
    const updated = [...seasons];
    updated[sIdx].episodes[eIdx].qualities = updated[sIdx].episodes[eIdx].qualities.filter((_, i) => i !== qIdx);
    setSeasons(updated);
  };


  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-red-600">⚙️ Advanced CMS</h2>
            <Link href="/" className="text-sm text-zinc-400 hover:text-white">Back to Home</Link>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basic Info */}
          <div className="space-y-4 bg-black p-6 rounded-xl border border-zinc-800">
            <h3 className="text-lg font-bold border-b border-zinc-800 pb-2">Basic Info</h3>
            <input type="text" placeholder="Title (Eg: Breaking Bad)" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={title} onChange={e => setTitle(e.target.value)} required />
            <input type="text" placeholder="Thumbnail Image URL" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} required />
            <input type="text" placeholder="Fallback Video URL (Optional)" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
          </div>

          {/* Type Selector */}
          <div className="flex gap-4">
            <button type="button" onClick={() => setType('movie')} className={`flex-1 py-3 rounded-xl font-bold transition border ${type === 'movie' ? 'bg-red-600 border-red-500' : 'bg-black border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>🎬 Movie</button>
            <button type="button" onClick={() => setType('series')} className={`flex-1 py-3 rounded-xl font-bold transition border ${type === 'series' ? 'bg-red-600 border-red-500' : 'bg-black border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>📺 Series</button>
          </div>

          {/* Movie Builder */}
          {type === 'movie' && (
            <div className="space-y-4 bg-black p-6 rounded-xl border border-zinc-800">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h3 className="text-lg font-bold">Video Qualities</h3>
                <button type="button" onClick={addMovieQuality} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded">Add Quality +</button>
              </div>
              {movieQualities.map((q, idx) => (
                <div key={idx} className="flex gap-3">
                  <input type="text" placeholder="Quality (e.g. 1080p)" className="w-1/4 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-600" value={q.quality} onChange={e => updateMovieQuality(idx, 'quality', e.target.value)} required />
                  <input type="text" placeholder="Video URL" className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-600" value={q.url} onChange={e => updateMovieQuality(idx, 'url', e.target.value)} required />
                  {movieQualities.length > 1 && <button type="button" onClick={() => removeMovieQuality(idx)} className="bg-red-900 hover:bg-red-800 text-white px-3 rounded-lg"><i className="fas fa-trash"></i></button>}
                </div>
              ))}
            </div>
          )}

          {/* Series Builder */}
          {type === 'series' && (
            <div className="space-y-6">
              {seasons.map((season, sIdx) => (
                <div key={sIdx} className="bg-black p-6 rounded-xl border border-zinc-800 space-y-4">
                  
                  <div className="flex items-center gap-4 border-b border-zinc-800 pb-3">
                    <h3 className="text-lg font-bold text-red-500">Season</h3>
                    <input type="number" className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-center font-bold" value={season.season} onChange={e => updateSeasonNum(sIdx, e.target.value)} required />
                  </div>

                  <div className="space-y-6 pl-4 border-l-2 border-zinc-800">
                    {season.episodes.map((ep, eIdx) => (
                      <div key={eIdx} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 space-y-3">
                        <div className="flex gap-3">
                          <input type="number" placeholder="Ep #" className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none" value={ep.episode} onChange={e => updateEpisode(sIdx, eIdx, 'episode', e.target.value)} required />
                          <input type="text" placeholder="Episode Title" className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none" value={ep.title} onChange={e => updateEpisode(sIdx, eIdx, 'title', e.target.value)} required />
                        </div>

                        {/* Episode Qualities */}
                        <div className="pl-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-zinc-500 font-bold uppercase">Sources</span>
                            <button type="button" onClick={() => addEpisodeQuality(sIdx, eIdx)} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">Add Source +</button>
                          </div>
                          {ep.qualities.map((q, qIdx) => (
                            <div key={qIdx} className="flex gap-2">
                               <input type="text" placeholder="1080p" className="w-20 bg-black border border-zinc-700 rounded px-2 py-1 text-xs outline-none focus:border-red-600" value={q.quality} onChange={e => updateEpisodeQuality(sIdx, eIdx, qIdx, 'quality', e.target.value)} required />
                               <input type="text" placeholder="URL" className="flex-1 bg-black border border-zinc-700 rounded px-2 py-1 text-xs outline-none focus:border-red-600" value={q.url} onChange={e => updateEpisodeQuality(sIdx, eIdx, qIdx, 'url', e.target.value)} required />
                               {ep.qualities.length > 1 && <button type="button" onClick={() => removeEpisodeQuality(sIdx, eIdx, qIdx)} className="text-red-500 hover:text-red-400 px-2 text-xs"><i className="fas fa-times"></i></button>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => addEpisode(sIdx)} className="text-sm bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg w-full text-zinc-300 border border-zinc-700 border-dashed">+ Add Episode</button>
                  </div>

                </div>
              ))}
              <button type="button" onClick={addSeason} className="w-full py-4 rounded-xl border-2 border-dashed border-red-900/50 text-red-500 font-bold hover:bg-red-900/10 hover:border-red-600 transition">
                + Add New Season
              </button>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 font-bold py-4 rounded-xl transition text-lg disabled:opacity-50 mt-8 shadow-lg shadow-red-900/50">
            {loading ? 'Publishing...' : 'Push to App'}
          </button>
        </form>
      </div>
    </div>
  );
}
