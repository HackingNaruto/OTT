'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

function PlayerUI() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [data, setData] = useState(null);
  const [settings, setSettings] = useState({ watermark_enabled: false, watermark_text: '' });
  const [loading, setLoading] = useState(true);
  
  // States
  const [activeSeasonIdx, setActiveSeasonIdx] = useState(0);
  const [activeEpisodeIdx, setActiveEpisodeIdx] = useState(0);
  const [activeQuality, setActiveQuality] = useState(null); // string like "1080p"
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      const [movieRes, settingsRes] = await Promise.all([
        supabase.from('movies').select('*').eq('id', id).single(),
        supabase.from('site_settings').select('*').eq('id', 1).single()
      ]);

      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }

      const movie = movieRes.data;
      if (movie) {
        setData(movie);
        
        // Initialize logic
        if (movie.type === 'series' && movie.content_data?.length > 0) {
           const firstSeason = movie.content_data[0];
           if (firstSeason.episodes?.length > 0) {
             const firstEp = firstSeason.episodes[0];
             if (firstEp.qualities?.length > 0) {
               setActiveQuality(firstEp.qualities[0].quality);
               setCurrentUrl(firstEp.qualities[0].url);
             }
           }
        } else if (movie.type === 'movie' && movie.content_data?.length > 0) {
           setActiveQuality(movie.content_data[0].quality);
           setCurrentUrl(movie.content_data[0].url);
        } else if (movie.video_url) {
           // Fallback for old schema
           setCurrentUrl(movie.video_url);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  // Handlers
  const handleEpisodeChange = (epIdx) => {
    setActiveEpisodeIdx(epIdx);
    const ep = data.content_data[activeSeasonIdx].episodes[epIdx];
    if (ep.qualities?.length > 0) {
      // try to keep same quality, or fallback to first
      const qMatch = ep.qualities.find(q => q.quality === activeQuality);
      if (qMatch) {
        setCurrentUrl(qMatch.url);
      } else {
        setActiveQuality(ep.qualities[0].quality);
        setCurrentUrl(ep.qualities[0].url);
      }
    }
  };

  const handleQualityChange = (qualObj) => {
    setActiveQuality(qualObj.quality);
    setCurrentUrl(qualObj.url);
  };

  if (!id) return <div className="text-white text-center mt-20">Invalid Content ID</div>;
  if (loading) return <div className="text-zinc-500 text-center mt-20 animate-pulse">Loading Content...</div>;
  if (!data) return <div className="text-white text-center mt-20">Content not found.</div>;

  let title = data.title;
  if (data.type === 'series' && data.content_data?.[activeSeasonIdx]?.episodes?.[activeEpisodeIdx]) {
      const ep = data.content_data[activeSeasonIdx].episodes[activeEpisodeIdx];
      title = `${data.title} - S${data.content_data[activeSeasonIdx].season} E${ep.episode}: ${ep.title}`;
  }

  // Get current qualities list based on type
  let currentQualities = [];
  if (data.type === 'series' && data.content_data?.[activeSeasonIdx]?.episodes?.[activeEpisodeIdx]) {
      currentQualities = data.content_data[activeSeasonIdx].episodes[activeEpisodeIdx].qualities || [];
  } else if (data.type === 'movie' && data.content_data?.length > 0) {
      currentQualities = data.content_data || [];
  }

  const iframeSrc = `/player.html?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(title)}&wm_text=${encodeURIComponent(settings?.watermark_text || '')}&wm_enable=${settings?.watermark_enabled || false}&site_name=${encodeURIComponent(settings?.site_name || 'StreamX')}&wm_move=${settings?.watermark_movement || 'static'}&wm_size=${settings?.watermark_size || '14px'}&wm_pos=${settings?.watermark_position || 'bottom-right'}`;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      {/* Consolidated Header */}
      <div className="sticky top-0 z-50 p-4 flex items-center gap-3 bg-black border-b border-zinc-900 shadow-md">
         <Link href="/" className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition shrink-0">
           <i className="fas fa-arrow-left text-sm"></i>
         </Link>
         
         <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-pink-500/20">
           <i className="fas fa-play text-white text-xs ml-0.5"></i>
         </div>
         
         <h1 className="text-base font-bold text-zinc-100 truncate w-full">{title}</h1>
      </div>

      {/* Edge-to-Edge Player Frame */}
      <div className="w-full bg-black aspect-video relative xl:h-[70vh] xl:aspect-auto">
        {currentUrl ? (
          <iframe 
            src={iframeSrc}
            className="w-full h-full border-none block"
            allowFullScreen
            allow="autoplay; encrypted-media"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-zinc-500">No Video Source Available</div>
        )}
      </div>

      <div className="max-w-7xl mx-auto w-full p-4 md:p-6 space-y-8">
        
        {/* Metadata Section */}
        <div className="pb-4 border-b border-zinc-900">
           <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{title}</h2>
           {data.type === 'series' && (
             <p className="text-xs md:text-sm font-semibold text-zinc-500 uppercase tracking-widest">Series • Season {data.content_data[activeSeasonIdx]?.season}</p>
           )}
           {data.type === 'movie' && (
             <p className="text-xs md:text-sm font-semibold text-zinc-500 uppercase tracking-widest">Movie</p>
           )}
        </div>
        
        {/* Quality Selector */}
        {currentQualities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Video Quality</h3>
            <div className="flex flex-wrap gap-3">
              {currentQualities.map((q, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleQualityChange(q)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition border ${activeQuality === q.quality ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                >
                  {q.quality}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Series Episode Selector */}
        {data.type === 'series' && data.content_data?.length > 0 && (
          <div className="space-y-6">
            {/* Seasons Dropdown / Tabs */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
               <h3 className="text-xl font-bold text-white">Episodes</h3>
               <select 
                 className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none"
                 value={activeSeasonIdx}
                 onChange={(e) => {
                   setActiveSeasonIdx(Number(e.target.value));
                   setActiveEpisodeIdx(0); // reset ep when season changes
                   
                   const firstEp = data.content_data[Number(e.target.value)]?.episodes?.[0];
                   if(firstEp?.qualities?.length > 0) {
                       setActiveQuality(firstEp.qualities[0].quality);
                       setCurrentUrl(firstEp.qualities[0].url);
                   }
                 }}
               >
                 {data.content_data.map((season, idx) => (
                   <option key={idx} value={idx}>Season {season.season}</option>
                 ))}
               </select>
            </div>

            {/* Episodes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {data.content_data[activeSeasonIdx]?.episodes?.map((ep, idx) => (
                 <button 
                   key={idx}
                   onClick={() => handleEpisodeChange(idx)}
                   className={`flex flex-col text-left p-4 rounded-xl border transition ${activeEpisodeIdx === idx ? 'bg-zinc-900 border-red-600' : 'bg-black border-zinc-800 hover:border-zinc-600'}`}
                 >
                   <span className={`text-xs font-bold mb-1 ${activeEpisodeIdx === idx ? 'text-red-500' : 'text-zinc-500'}`}>Episode {ep.episode}</span>
                   <span className="font-semibold text-zinc-200">{ep.title}</span>
                 </button>
               ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function Watch() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Suspense fallback={<div className="text-zinc-500 text-center mt-20 animate-pulse">Initializing Interface...</div>}>
        <PlayerUI />
      </Suspense>
    </div>
  );
}
