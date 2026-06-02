'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAdmin } from '../actions/auth';

export default function Admin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // -- Auth Gateway --
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('cms'); // 'cms', 'manage', or 'settings'
  
  // -- CMS Form State --
  const [editId, setEditId] = useState(null);
  const [type, setType] = useState('movie'); // 'movie' or 'series'
  
  const [title, setTitle] = useState('');
  const [shortTitle, setShortTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [landscapeThumbnailUrl, setLandscapeThumbnailUrl] = useState('');
  const [backupThumbnailUrl, setBackupThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const [movieQualities, setMovieQualities] = useState([{ quality: '1080p', url: '' }]);
  const [seasons, setSeasons] = useState([{ season: 1, episodes: [{ episode: 1, title: 'Episode 1', qualities: [{ quality: '1080p', url: '' }] }] }]);
  const [bulkImportText, setBulkImportText] = useState('');
  const [movieBulkImportText, setMovieBulkImportText] = useState('');

  // -- Manage List State --
  const [existingContent, setExistingContent] = useState([]);
  const [isFetchingList, setIsFetchingList] = useState(false);

  // -- Settings State --
  const [siteName, setSiteName] = useState('StreamX');
  const [trendingCarouselEnabled, setTrendingCarouselEnabled] = useState(false);
  const [themeToggleEnabled, setThemeToggleEnabled] = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkMovement, setWatermarkMovement] = useState('static');
  const [watermarkSize, setWatermarkSize] = useState('14px');
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-right');
  const [autoFullscreenEnabled, setAutoFullscreenEnabled] = useState(false);
  const [showContinueWatching, setShowContinueWatching] = useState(true);
  const [showNewArrivals, setShowNewArrivals] = useState(true);

  // Fetch Settings on Mount
  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single();
      if (data) {
        setSiteName(data.site_name || 'StreamX');
        setTrendingCarouselEnabled(data.trending_carousel_enabled || false);
        setThemeToggleEnabled(data.theme_toggle_enabled || false);
        setWatermarkEnabled(data.watermark_enabled || false);
        setWatermarkText(data.watermark_text || '');
        setWatermarkMovement(data.watermark_movement || 'static');
        setWatermarkSize(data.watermark_size || '14px');
        setWatermarkPosition(data.watermark_position || 'bottom-right');
        setAutoFullscreenEnabled(data.auto_fullscreen_enabled || false);
        setShowContinueWatching(data.show_continue_watching !== false);
        setShowNewArrivals(data.show_new_arrivals !== false);
      }
    }
    fetchSettings();
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  function toggleSiteFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen().catch(err => console.log(err));
    }
  }

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
  };

  // Fetch Content List when Manage Tab is active
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchExistingContent();
    }
  }, [activeTab]);

  const fetchExistingContent = async () => {
    setIsFetchingList(true);
    const { data, error } = await supabase.from('movies').select('id, title, type, created_at, content_data, video_url, thumbnail_url').order('created_at', { ascending: false });
    if (!error && data) {
      setExistingContent(data);
    }
    setIsFetchingList(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    const res = await loginAdmin(loginUser, loginPass);
    setLoading(false);
    if (res.success) {
      setIsAuthenticated(true);
    } else {
      setLoginError(res.error || 'Invalid credentials');
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setTitle(item.title);
    setShortTitle(item.short_title || '');
    setThumbnailUrl(item.thumbnail_url || '');
    setLandscapeThumbnailUrl(item.landscape_thumbnail_url || '');
    setBackupThumbnailUrl(item.backup_thumbnail_url || '');
    setVideoUrl(item.video_url || '');
    setType(item.type || 'movie');

    let parsedData = item.content_data;
    if (typeof parsedData === 'string') {
      try { parsedData = JSON.parse(parsedData); } 
      catch (e) { parsedData = null; }
    }

    if (item.type === 'movie') {
      setMovieQualities((Array.isArray(parsedData) && parsedData.length > 0) ? parsedData : [{ quality: '1080p', url: '' }]);
    } else {
      setSeasons((Array.isArray(parsedData) && parsedData.length > 0) ? parsedData : [{ season: 1, episodes: [{ episode: 1, title: 'Episode 1', qualities: [{ quality: '1080p', url: '' }] }] }]);
    }
    setActiveTab('cms');
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to completely delete "${title}"? This cannot be undone.`)) {
      setLoading(true);
      const { error } = await supabase.from('movies').delete().eq('id', id);
      setLoading(false);
      if (error) alert('Error deleting: ' + error.message);
      else fetchExistingContent(); // Refresh list
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setTitle('');
    setShortTitle('');
    setThumbnailUrl('');
    setLandscapeThumbnailUrl('');
    setBackupThumbnailUrl('');
    setVideoUrl('');
    setType('movie');
    setMovieQualities([{ quality: '1080p', url: '' }]);
    setSeasons([{ season: 1, episodes: [{ episode: 1, title: 'Episode 1', qualities: [{ quality: '1080p', url: '' }] }] }]);
  };

  const handleSubmitCMS = async (e) => {
    e.preventDefault();
    if (!title) return alert('Title is required!');

    setLoading(true);

    let contentDataPayload = null;
    if (type === 'movie') {
      contentDataPayload = movieQualities;
    } else {
      contentDataPayload = seasons;
    }

    const payload = {
      title,
      short_title: shortTitle,
      thumbnail_url: thumbnailUrl || null,
      landscape_thumbnail_url: landscapeThumbnailUrl || null,
      backup_thumbnail_url: backupThumbnailUrl || null,
      video_url: videoUrl || null,
      type,
      content_data: contentDataPayload
    };

    let error;
    if (editId) {
      const { data, error: updateError } = await supabase.from('movies').update(payload).eq('id', editId).select();
      error = updateError;
      console.log("Supabase Update Response:", { data, error });
      
      if (!error && data) {
         setExistingContent(prev => prev.map(item => item.id === editId ? { ...item, ...payload } : item));
      }
    } else {
      const { data, error: insertError } = await supabase.from('movies').insert([payload]).select();
      error = insertError;
      console.log("Supabase Insert Response:", { data, error });
      
      if (!error && data && data.length > 0) {
         setExistingContent(prev => [data[0], ...prev]);
      }
    }

    setLoading(false);

    if (error) {
      alert('Error updating content: ' + error.message);
    } else {
      alert(editId ? 'Content updated successfully!' : 'Content published successfully!');
      router.refresh();
      cancelEdit(); // Reset form
      setActiveTab('manage'); // Switch back to manage list
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('site_settings').upsert({ 
      id: 1, 
      site_name: siteName,
      trending_carousel_enabled: trendingCarouselEnabled,
      theme_toggle_enabled: themeToggleEnabled,
      watermark_enabled: watermarkEnabled, 
      watermark_text: watermarkText,
      watermark_movement: watermarkMovement,
      watermark_size: watermarkSize,
      watermark_position: watermarkPosition,
      auto_fullscreen_enabled: autoFullscreenEnabled,
      show_continue_watching: showContinueWatching,
      show_new_arrivals: showNewArrivals
    });
    setLoading(false);
    if (error) alert('Error saving settings: ' + error.message);
    else alert('Player Settings saved!');
  };

  const [isGeneratingInstantThumb, setIsGeneratingInstantThumb] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState(null);

  const generateInstantThumbnail = async (passedUrl, sIdx = null, eIdx = null) => {
    let targetUrl = passedUrl;
    
    if (!targetUrl || targetUrl.trim() === '') {
        if (type === 'movie') {
            targetUrl = videoUrl;
        } else if (type === 'series') {
            if (seasons && seasons.length > 0 && 
                seasons[0].episodes && seasons[0].episodes.length > 0 && 
                seasons[0].episodes[0].qualities && seasons[0].episodes[0].qualities.length > 0) {
                targetUrl = seasons[0].episodes[0].qualities[0].url;
            }
        }
    }

    if (!targetUrl || targetUrl.trim() === '') {
        return alert("Please enter a Video URL (or add at least one episode source for a series) first.");
    }
    setIsGeneratingInstantThumb(true);
    setGeneratingIndex(sIdx !== null && eIdx !== null ? `${sIdx}-${eIdx}` : 'main');
    try {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      await new Promise((resolve, reject) => {
         let timeoutFired = false;
         const timeoutId = setTimeout(() => {
             timeoutFired = true;
             captureAndUpload();
         }, 1500);

         video.onloadedmetadata = () => {
             let targetTime = video.duration / 2;
             if (!video.duration || isNaN(video.duration) || !isFinite(video.duration) || video.duration <= 0) {
                 targetTime = 30; // Instantly skip 0:00
             }
             video.currentTime = targetTime;
         };

         const captureAndUpload = () => {
             video.pause();
             const canvas = document.createElement('canvas');
             canvas.width = 640;
             canvas.height = 360;
             const ctx = canvas.getContext('2d');
             ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

             canvas.toBlob(async (blob) => {
                 if (blob) {
                     const catboxFormData = new FormData();
                     catboxFormData.append('reqtype', 'fileupload');
                     catboxFormData.append('fileToUpload', blob, 'thumb.jpg');

                     const imgbbFormData = new FormData();
                     imgbbFormData.append('image', blob, 'thumb.jpg');
                     const IMGBB_API_KEY = 'YOUR_IMGBB_API_KEY';

                     const uploadToCatbox = fetch('https://catbox.moe/user/api.php', {
                         method: 'POST',
                         body: catboxFormData
                     }).then(res => res.text()).catch(() => null);

                     const uploadToImgbb = fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                         method: 'POST',
                         body: imgbbFormData
                     }).then(res => res.json()).then(d => d?.data?.url).catch(() => null);

                     const [catboxUrl, imgbbUrl] = await Promise.all([uploadToCatbox, uploadToImgbb]);

                     if ((catboxUrl && catboxUrl.startsWith('http')) || (imgbbUrl && imgbbUrl.startsWith('http'))) {
                         if (sIdx !== null && eIdx !== null) {
                             const newSeasons = [...seasons];
                             if (catboxUrl && catboxUrl.startsWith('http')) newSeasons[sIdx].episodes[eIdx].landscape_thumbnail_url = catboxUrl;
                             if (imgbbUrl && imgbbUrl.startsWith('http')) newSeasons[sIdx].episodes[eIdx].backup_thumbnail_url = imgbbUrl;
                             setSeasons(newSeasons);
                         } else {
                             if (catboxUrl && catboxUrl.startsWith('http')) setLandscapeThumbnailUrl(catboxUrl);
                             if (imgbbUrl && imgbbUrl.startsWith('http')) setBackupThumbnailUrl(imgbbUrl);
                         }
                     }

                     alert("Thumbnail Captured Instantly!");
                 }
                 resolve();
             }, 'image/jpeg', 0.4);
         };

         video.onseeked = () => {
             if (!timeoutFired) {
                 clearTimeout(timeoutId);
                 captureAndUpload();
             }
         };

         video.onerror = (e) => {
             if (!timeoutFired) {
                 clearTimeout(timeoutId);
                 reject(e);
             }
         };

         video.src = targetUrl;
      });
    } catch(e) {
      alert("Failed to capture thumbnail. Make sure the video URL is valid and supports CORS.");
      console.log(e);
    setIsGeneratingInstantThumb(false);
    setGeneratingIndex(null);
  };

  // --- Movie Quality Handlers ---
  const addMovieQuality = () => setMovieQualities([...movieQualities, { quality: '', url: '' }]);
  const updateMovieQuality = (idx, field, val) => { const u = [...movieQualities]; u[idx][field] = val; setMovieQualities(u); };
  const removeMovieQuality = (idx) => setMovieQualities(movieQualities.filter((_, i) => i !== idx));

  // --- Series Handlers ---
  const addSeason = () => setSeasons([...seasons, { season: seasons.length + 1, episodes: [] }]);
  const updateSeasonNum = (sIdx, val) => { const u = [...seasons]; u[sIdx].season = Number(val); setSeasons(u); };
  const removeSeason = (sIdx) => { if(window.confirm('Delete this entire season?')) setSeasons(seasons.filter((_, i) => i !== sIdx)); };

  const addEpisode = (sIdx) => {
    const u = [...seasons];
    u[sIdx].episodes.push({ episode: u[sIdx].episodes.length + 1, title: `Episode ${u[sIdx].episodes.length + 1}`, qualities: [{ quality: '1080p', url: '' }] });
    setSeasons(u);
  };
  const updateEpisode = (sIdx, eIdx, field, val) => { const u = [...seasons]; if(field === 'episode') u[sIdx].episodes[eIdx][field] = Number(val); else u[sIdx].episodes[eIdx][field] = val; setSeasons(u); };
  const removeEpisode = (sIdx, eIdx) => { if(window.confirm('Delete this episode?')) { const u=[...seasons]; u[sIdx].episodes = u[sIdx].episodes.filter((_, i) => i !== eIdx); setSeasons(u); }};

  const addEpisodeQuality = (sIdx, eIdx) => { const u = [...seasons]; u[sIdx].episodes[eIdx].qualities.push({ quality: '', url: '' }); setSeasons(u); };
  const updateEpisodeQuality = (sIdx, eIdx, qIdx, field, val) => { const u = [...seasons]; u[sIdx].episodes[eIdx].qualities[qIdx][field] = val; setSeasons(u); };
  const removeEpisodeQuality = (sIdx, eIdx, qIdx) => { const u = [...seasons]; u[sIdx].episodes[eIdx].qualities = u[sIdx].episodes[eIdx].qualities.filter((_, i) => i !== qIdx); setSeasons(u); };

  const handleBulkImport = () => {
    if (!bulkImportText.trim()) return;
    const lines = bulkImportText.split('\n');
    const newSeasonsMap = {};
    
    lines.forEach(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 4) {
        const [seasonStr, title, quality, url] = parts;
        const seasonNum = parseInt(seasonStr, 10);
        if (isNaN(seasonNum)) return;
        
        if (!newSeasonsMap[seasonNum]) {
          newSeasonsMap[seasonNum] = { season: seasonNum, episodes: [] };
        }
        
        let ep = newSeasonsMap[seasonNum].episodes.find(e => e.title === title);
        if (!ep) {
          ep = { episode: newSeasonsMap[seasonNum].episodes.length + 1, title, qualities: [] };
          newSeasonsMap[seasonNum].episodes.push(ep);
        }
        
        ep.qualities.push({ quality, url });
      }
    });

    const parsedSeasons = Object.values(newSeasonsMap).sort((a, b) => a.season - b.season);
    if (parsedSeasons.length > 0) {
      setSeasons(parsedSeasons);
      setBulkImportText('');
      alert('Bulk import processed successfully! Review below before saving.');
    } else {
      alert('No valid episodes found. Ensure format is: Season | Episode Title | Quality | Video URL');
    }
  };

  const handleMovieBulkImport = async () => {
    if (!movieBulkImportText.trim()) return;
    const lines = movieBulkImportText.split('\n');
    const moviesToInsert = [];
    
    lines.forEach(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 6) {
        const [mTitle, mType, thumb, landThumb, url, quality] = parts;
        if (mType.toLowerCase() === 'movie') {
          moviesToInsert.push({
            title: mTitle,
            short_title: mTitle,
            thumbnail_url: thumb || '',
            landscape_thumbnail_url: landThumb || '',
            type: 'movie',
            content_data: [{ quality: quality, url: url }]
          });
        }
      }
    });

    if (moviesToInsert.length > 0) {
      setLoading(true);
      const { data, error } = await supabase.from('movies').insert(moviesToInsert).select();
      setLoading(false);
      
      if (error) {
        alert('Error during bulk import: ' + error.message);
      } else {
        setMovieBulkImportText('');
        if (data) setExistingContent(prev => [...data, ...prev]);
        alert(`Successfully imported ${moviesToInsert.length} movies!`);
        setActiveTab('manage');
      }
    } else {
      alert('No valid movies found. Ensure format is: Title | Type | Thumbnail URL | Landscape URL | Content URL | Quality');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white flex items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-extrabold text-red-600 mb-6 text-center">Secure Admin Gateway</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-500 dark:text-zinc-400">Username</label>
              <input type="text" className="w-full mt-1 bg-gray-100 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-red-600 text-gray-900 dark:text-white" value={loginUser} onChange={e => setLoginUser(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 dark:text-zinc-400">Password</label>
              <input type="password" className="w-full mt-1 bg-gray-100 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-red-600 text-gray-900 dark:text-white" value={loginPass} onChange={e => setLoginPass(e.target.value)} required />
            </div>
            {loginError && <p className="text-red-500 text-sm font-bold text-center">{loginError}</p>}
            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition mt-4">{loading ? 'Authenticating...' : 'Login'}</button>
          </form>
          <div className="mt-6 text-center"><Link href="/" className="text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 text-sm">Return to Site</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white p-4 md:p-6 pb-24 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-red-600">⚙️ Admin CMS</h2>
            <div className="flex items-center gap-2">
              {themeToggleEnabled && (
                <button onClick={toggleTheme} className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center">
                  <i className="fas fa-sun block dark:hidden text-sm"></i>
                  <i className="fas fa-moon hidden dark:block text-sm"></i>
                </button>
              )}
              <button onClick={toggleSiteFullscreen} className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center">
                <i className={isFullscreen ? "fas fa-compress text-sm" : "fas fa-expand text-sm"}></i>
              </button>
              <Link href="/" className="text-sm font-bold text-zinc-400 hover:text-white ml-2 bg-zinc-900 px-3 py-1.5 rounded-lg">View Site</Link>
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <button onClick={() => setActiveTab('cms')} className={`px-4 py-2 text-sm md:text-base font-bold rounded-lg transition ${activeTab === 'cms' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>Add/Edit Content</button>
          <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 text-sm md:text-base font-bold rounded-lg transition ${activeTab === 'manage' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>Manage List</button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-sm md:text-base font-bold rounded-lg transition ${activeTab === 'settings' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>Player Settings</button>
        </div>
        
        {/* --- ADD / EDIT CONTENT TAB --- */}
        {activeTab === 'cms' && (
          <form onSubmit={handleSubmitCMS} className="space-y-8">
            {editId && (
               <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex justify-between items-center">
                 <div>
                   <p className="text-sm font-bold text-red-400">Editing Mode Active</p>
                   <p className="text-xs text-zinc-400">You are modifying existing content.</p>
                 </div>
                 <button type="button" onClick={cancelEdit} className="text-xs bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg font-bold">Cancel Edit</button>
               </div>
            )}

            {/* Basic Info (Manual Entry) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest border-b border-gray-200 dark:border-zinc-800 pb-2">Method 1: Manual Data Entry</h3>
              <div className="flex flex-col gap-3">
                 <input type="text" placeholder="Title (Eg: Breaking Bad)" className="w-full bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={title} onChange={e => setTitle(e.target.value)} required />
                 <input type="text" placeholder="Short Title (Optional)" className="w-full bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={shortTitle} onChange={e => setShortTitle(e.target.value)} />
                 <input type="text" placeholder="Portrait Thumbnail URL (Optional)" className="w-full bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} />
                 <input type="text" placeholder="Landscape Thumbnail URL (Optional) (For Trending 16:9)" className="w-full bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={landscapeThumbnailUrl} onChange={e => setLandscapeThumbnailUrl(e.target.value)} />
                 <input type="text" placeholder="Backup Thumbnail URL (Optional) (For ImgBB Failover)" className="w-full bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={backupThumbnailUrl} onChange={e => setBackupThumbnailUrl(e.target.value)} />
                 
                 <div className="flex gap-2">
                   <input type="text" placeholder="Fallback Video URL (Optional)" className="w-full bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
                   <button type="button" onClick={() => generateInstantThumbnail(videoUrl)} disabled={isGeneratingInstantThumb} className="whitespace-nowrap px-4 py-3 bg-red-900/30 text-red-500 font-bold border border-red-900/50 rounded-xl hover:bg-red-600 hover:text-white transition disabled:opacity-50 text-sm">
                     {isGeneratingInstantThumb && generatingIndex === 'main' ? 'Capturing...' : '📸 Instant Auto-Thumb'}
                   </button>
                 </div>
              </div>
            </div>

            {/* Type Selector */}
            <div className="flex gap-3">
              <button type="button" onClick={() => setType('movie')} className={`flex-1 py-3 rounded-xl font-bold transition border ${type === 'movie' ? 'bg-red-600 border-red-500' : 'bg-transparent border-zinc-800 text-zinc-400'}`}>🎬 Movie</button>
              <button type="button" onClick={() => setType('series')} className={`flex-1 py-3 rounded-xl font-bold transition border ${type === 'series' ? 'bg-red-600 border-red-500' : 'bg-transparent border-zinc-800 text-zinc-400'}`}>📺 Series</button>
            </div>

            {/* Movie Builder */}
            {type === 'movie' && (
              <div className="space-y-8">
                {/* Bulk Import for Movies */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Method 2: Bulk Import Movies</h3>
                  <p className="text-xs text-zinc-500">Format: <code className="bg-black px-1 py-0.5 rounded text-red-400">Title | Type | Thumbnail URL | Landscape URL | Content URL | Quality</code></p>
                  <p className="text-xs text-zinc-500 italic">Leave thumbnails blank using empty pipes if needed: <code className="bg-black px-1 py-0.5 rounded text-zinc-400">Movie | movie | | | https://vid.mp4 | 1080p</code></p>
                  <textarea 
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:border-red-600 outline-none font-mono h-32"
                    placeholder="Fast 9 | movie | https://thumb.jpg | https://land.jpg | https://vid.mp4 | 1080p"
                    value={movieBulkImportText}
                    onChange={(e) => setMovieBulkImportText(e.target.value)}
                  />
                  <button type="button" onClick={handleMovieBulkImport} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition">
                    Process Bulk Import
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Manual Video Sources</h3>
                  </div>
                  {movieQualities.map((q, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input type="text" placeholder="Quality (e.g. 1080p)" className="w-full sm:w-1/4 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-600" value={q.quality} onChange={e => updateMovieQuality(idx, 'quality', e.target.value)} required />
                    <div className="flex w-full sm:flex-1 gap-2">
                      <input type="text" placeholder="Video URL" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-600" value={q.url} onChange={e => updateMovieQuality(idx, 'url', e.target.value)} required />
                      <button type="button" onClick={() => generateInstantThumbnail(q.url)} disabled={isGeneratingInstantThumb} className="whitespace-nowrap px-3 bg-red-900/30 text-red-500 hover:text-white rounded-lg text-xs font-bold border border-red-900/50 disabled:opacity-50">
                        {isGeneratingInstantThumb ? '...' : '📸'}
                      </button>
                      {movieQualities.length > 1 && <button type="button" onClick={() => removeMovieQuality(idx)} className="bg-red-900/50 text-red-500 hover:text-white px-3 rounded-lg"><i className="fas fa-trash"></i></button>}
                    </div>
                  </div>
                ))}
                  <button type="button" onClick={addMovieQuality} className="w-full py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800">+ Add Source</button>
                </div>
              </div>
            )}

            {/* Series Builder (Flat UI) */}
            {type === 'series' && (
              <div className="space-y-8">
                
                {/* Bulk Import */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Method 2: Bulk Import Episodes</h3>
                  <p className="text-xs text-zinc-500">Format: <code className="bg-black px-1 py-0.5 rounded text-red-400">Season Number | Episode Title | Quality | Video URL</code></p>
                  <textarea 
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:border-red-600 outline-none font-mono h-32"
                    placeholder="1 | Pilot | 1080p | https://link.mp4&#10;1 | Pilot | 720p | https://link2.mp4&#10;1 | Episode 2 | 1080p | https://link3.mp4"
                    value={bulkImportText}
                    onChange={(e) => setBulkImportText(e.target.value)}
                  />
                  <button type="button" onClick={handleBulkImport} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition">
                    Process Bulk Import
                  </button>
                </div>

                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Manual Season Builder</h3>
                </div>
                {seasons.map((season, sIdx) => (
                  <div key={sIdx} className="space-y-4">
                    
                    {/* Season Header */}
                    <div className="flex items-center justify-between border-b border-red-900/50 pb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-red-500">Season</h3>
                        <input type="number" className="w-16 bg-transparent border-b border-zinc-600 px-1 py-0 text-lg font-bold outline-none focus:border-red-500" value={season.season} onChange={e => updateSeasonNum(sIdx, e.target.value)} required />
                      </div>
                      <button type="button" onClick={() => removeSeason(sIdx)} className="text-red-500 text-xs"><i className="fas fa-trash"></i> Delete Season</button>
                    </div>

                    {/* Episodes List */}
                    <div className="pl-3 border-l border-zinc-800 space-y-6">
                      {season.episodes.map((ep, eIdx) => (
                        <div key={eIdx} className="space-y-3">
                          {/* Episode Inputs */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input type="number" placeholder="Ep #" className="w-full sm:w-20 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none" value={ep.episode} onChange={e => updateEpisode(sIdx, eIdx, 'episode', e.target.value)} required />
                            <div className="flex w-full sm:flex-1 gap-2">
                              <input type="text" placeholder="Episode Title" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none" value={ep.title} onChange={e => updateEpisode(sIdx, eIdx, 'title', e.target.value)} required />
                              <button type="button" onClick={() => removeEpisode(sIdx, eIdx)} className="text-zinc-600 hover:text-red-500 px-2"><i className="fas fa-times"></i></button>
                            </div>
                          </div>

                          {/* Episode Sources */}
                          <div className="pl-4 space-y-2">
                            {ep.qualities.map((q, qIdx) => (
                              <div key={qIdx} className="flex gap-2">
                                 <input type="text" placeholder="1080p" className="w-20 bg-black border border-zinc-800 rounded px-2 py-1 text-xs outline-none focus:border-red-600" value={q.quality} onChange={e => updateEpisodeQuality(sIdx, eIdx, qIdx, 'quality', e.target.value)} required />
                                 <input type="text" placeholder="Source URL" className="flex-1 bg-black border border-zinc-800 rounded px-2 py-1 text-xs outline-none focus:border-red-600" value={q.url} onChange={e => updateEpisodeQuality(sIdx, eIdx, qIdx, 'url', e.target.value)} required />
                                 <button type="button" onClick={() => generateInstantThumbnail(q.url, sIdx, eIdx)} disabled={isGeneratingInstantThumb} className="whitespace-nowrap px-2 bg-red-900/30 text-red-500 hover:text-white rounded text-[10px] font-bold border border-red-900/50 disabled:opacity-50">
                                   {isGeneratingInstantThumb && generatingIndex === `${sIdx}-${eIdx}` ? '...' : '📸'}
                                 </button>
                                 {ep.qualities.length > 1 && <button type="button" onClick={() => removeEpisodeQuality(sIdx, eIdx, qIdx)} className="text-red-900 hover:text-red-500 px-2 text-xs"><i className="fas fa-times"></i></button>}
                              </div>
                            ))}
                            <button type="button" onClick={() => addEpisodeQuality(sIdx, eIdx)} className="text-xs text-zinc-500 hover:text-white py-1">+ Add Source</button>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => addEpisode(sIdx)} className="w-full py-2 bg-zinc-900/30 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800">+ Add Episode</button>
                    </div>

                  </div>
                ))}
                <button type="button" onClick={addSeason} className="w-full py-3 rounded-xl border border-dashed border-red-900 text-red-500 font-bold hover:bg-red-900/20 transition">
                  + Add New Season
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 font-bold py-4 rounded-xl transition text-base disabled:opacity-50 mt-8 shadow-lg shadow-red-900/50">
              {loading ? 'Processing...' : (editId ? 'Update Content' : 'Push to App')}
            </button>
          </form>
        )}

        {/* --- MANAGE LIST TAB --- */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            {isFetchingList ? (
              <p className="text-zinc-500 text-center py-10 animate-pulse">Loading content...</p>
            ) : existingContent.length === 0 ? (
              <p className="text-zinc-500 text-center py-10">No content found.</p>
            ) : (
              existingContent.map((item) => (
                <div key={item.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-zinc-200">{item.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">{item.type}</span>
                      <span className="text-[10px] text-zinc-600">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => handleEdit(item)} className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition">Edit</button>
                    <button onClick={() => handleDelete(item.id, item.title)} className="flex-1 sm:flex-none bg-red-900/30 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition border border-red-900/50 hover:border-red-600">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* Site Branding */}
            <div className="bg-transparent space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Site Branding</h3>
              <div className="space-y-2">
                <label className="text-sm text-zinc-500 font-bold">Site Name</label>
                <input type="text" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={siteName} onChange={e => setSiteName(e.target.value)} required />
              </div>
              <label className="flex items-center gap-3 cursor-pointer mt-4">
                <input type="checkbox" className="w-5 h-5 accent-red-600" checked={trendingCarouselEnabled} onChange={e => setTrendingCarouselEnabled(e.target.checked)} />
                <span className="font-bold text-gray-700 dark:text-zinc-300">Enable Trending Carousel on Homepage</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer mt-4">
                <input type="checkbox" className="w-5 h-5 accent-red-600" checked={themeToggleEnabled} onChange={e => setThemeToggleEnabled(e.target.checked)} />
                <span className="font-bold text-gray-700 dark:text-zinc-300">Enable Light/Dark Mode Switcher</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer mt-4">
                <input type="checkbox" className="w-5 h-5 accent-red-600" checked={autoFullscreenEnabled} onChange={e => setAutoFullscreenEnabled(e.target.checked)} />
                <span className="font-bold text-gray-700 dark:text-zinc-300">Enable Auto-Fullscreen App Mode on Launch</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer mt-4">
                <input type="checkbox" className="w-5 h-5 accent-red-600" checked={showContinueWatching} onChange={e => setShowContinueWatching(e.target.checked)} />
                <span className="font-bold text-gray-700 dark:text-zinc-300">Show 'Continue Watching' Section on Homepage</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer mt-4">
                <input type="checkbox" className="w-5 h-5 accent-red-600" checked={showNewArrivals} onChange={e => setShowNewArrivals(e.target.checked)} />
                <span className="font-bold text-gray-700 dark:text-zinc-300">Show 'New Arrivals' Section on Homepage</span>
              </label>
            </div>

            {/* Global Watermark */}
            <div className="bg-transparent space-y-6 mt-8">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Player Watermark</h3>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-red-600" checked={watermarkEnabled} onChange={e => setWatermarkEnabled(e.target.checked)} />
                <span className="font-bold text-zinc-300">Enable Dynamic Watermark</span>
              </label>

              {watermarkEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-500 font-bold">Watermark Text</label>
                    <input type="text" placeholder="E.g., StreamX Protected" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={watermarkText} onChange={e => setWatermarkText(e.target.value)} required />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-zinc-500 font-bold">Movement</label>
                      <select className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={watermarkMovement} onChange={e => setWatermarkMovement(e.target.value)}>
                        <option value="static">Static (Fixed Corner)</option>
                        <option value="moving">Moving (Anti-Record)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-zinc-500 font-bold">Size</label>
                      <select className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={watermarkSize} onChange={e => setWatermarkSize(e.target.value)}>
                        <option value="10px">10px</option>
                        <option value="12px">12px</option>
                        <option value="14px">14px</option>
                        <option value="16px">16px</option>
                        <option value="18px">18px</option>
                        <option value="20px">20px</option>
                        <option value="24px">24px</option>
                        <option value="28px">28px</option>
                        <option value="32px">32px</option>
                      </select>
                    </div>

                    {watermarkMovement === 'static' && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm text-zinc-500 font-bold">Fixed Position</label>
                        <select className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none" value={watermarkPosition} onChange={e => setWatermarkPosition(e.target.value)}>
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                          <option value="center-right">Center Right</option>
                          <option value="center-left">Center Left</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 font-bold py-4 rounded-xl transition text-base disabled:opacity-50 mt-8 shadow-lg shadow-red-900/50">
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
