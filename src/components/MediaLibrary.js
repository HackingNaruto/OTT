'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function MediaLibrary() {
  const [assets, setAssets] = useState([]);
  const [filter, setFilter] = useState('All'); // 'All', 'Video', 'Image'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMedia() {
      setLoading(true);
      const { data, error } = await supabase
        .from('movies')
        .select('id, title, type, video_url, thumbnail_url, landscape_thumbnail_url, content_data')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching media:", error);
        setLoading(false);
        return;
      }

      const extractedAssets = [];

      data.forEach(item => {
        const baseTitle = item.title;

        // Extract top-level URLs
        if (item.thumbnail_url) extractedAssets.push({ parentTitle: baseTitle, assetType: 'Image', url: item.thumbnail_url, sourceColumn: 'Portrait Thumbnail' });
        if (item.landscape_thumbnail_url) extractedAssets.push({ parentTitle: baseTitle, assetType: 'Image', url: item.landscape_thumbnail_url, sourceColumn: 'Landscape Thumbnail' });
        if (item.video_url) extractedAssets.push({ parentTitle: baseTitle, assetType: 'Video', url: item.video_url, sourceColumn: 'Fallback Video URL' });

        // Extract from JSONB content_data
        let contentData = item.content_data;
        if (typeof contentData === 'string') {
          try { contentData = JSON.parse(contentData); } catch (e) { contentData = null; }
        }

        if (Array.isArray(contentData)) {
          if (item.type === 'movie') {
            // content_data is array of qualities
            contentData.forEach(q => {
              if (q.url) extractedAssets.push({ parentTitle: baseTitle, assetType: 'Video', url: q.url, sourceColumn: `Video (${q.quality})` });
            });
          } else if (item.type === 'series') {
            // content_data is array of seasons
            contentData.forEach(season => {
              if (Array.isArray(season.episodes)) {
                season.episodes.forEach(ep => {
                  const epTitle = `${baseTitle} - S${season.season} E${ep.episode}`;
                  if (ep.thumbnail_url) extractedAssets.push({ parentTitle: epTitle, assetType: 'Image', url: ep.thumbnail_url, sourceColumn: 'Episode Thumbnail' });
                  
                  if (Array.isArray(ep.qualities)) {
                    ep.qualities.forEach(q => {
                      if (q.url) extractedAssets.push({ parentTitle: epTitle, assetType: 'Video', url: q.url, sourceColumn: `Episode Video (${q.quality})` });
                    });
                  }
                });
              }
            });
          }
        }
      });

      // Filter out empty URLs
      const validAssets = extractedAssets.filter(a => a.url && a.url.trim() !== '');
      setAssets(validAssets);
      setLoading(false);
    }

    fetchMedia();
  }, []);

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    // Optional: Add a small visual feedback here if desired
  };

  const filteredAssets = assets.filter(a => filter === 'All' || a.assetType === filter);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Media & Links Library</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage and preview all extracted URLs from your database.</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Video', 'Image'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition ${filter === f ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
            >
              {f === 'All' ? 'All' : f + 's'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500 animate-pulse">
          <i className="fas fa-circle-notch fa-spin text-2xl mb-2 text-red-600"></i>
          <p>Scanning database for media assets...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800 shadow-xl">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs uppercase bg-black/80 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Type</th>
                <th className="px-6 py-4 font-bold tracking-wider">Parent Title</th>
                <th className="px-6 py-4 font-bold tracking-wider">Source Column</th>
                <th className="px-6 py-4 font-bold tracking-wider w-1/2">URL</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/30">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-zinc-500 font-medium">No assets found for this filter.</td>
                </tr>
              ) : (
                filteredAssets.map((asset, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/80 transition group relative">
                    <td className="px-6 py-4">
                      {asset.assetType === 'Video' ? (
                        <span className="flex items-center gap-2 text-blue-400 font-bold bg-blue-900/20 px-3 py-1 rounded-full w-max"><i className="fas fa-video"></i> Video</span>
                      ) : (
                        <span className="flex items-center gap-2 text-pink-400 font-bold bg-pink-900/20 px-3 py-1 rounded-full w-max"><i className="fas fa-image"></i> Image</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">{asset.parentTitle}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500 uppercase tracking-wide">{asset.sourceColumn}</td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400 max-w-[200px] truncate relative">
                      <a href={asset.url} target="_blank" rel="noreferrer" className="hover:text-red-400 hover:underline transition">
                        {asset.url}
                      </a>
                      
                      {/* Interactive Image Preview Tooltip */}
                      {asset.assetType === 'Image' && (
                        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-black border border-zinc-700 p-1.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50">
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900">
                            <img src={asset.url} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                          </div>
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black border-b border-r border-zinc-700 rotate-45"></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => copyToClipboard(asset.url)} className="text-zinc-400 hover:text-white transition bg-zinc-800 hover:bg-zinc-600 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 ml-auto">
                        <i className="fas fa-copy"></i> Copy
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
