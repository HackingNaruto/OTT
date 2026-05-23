'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function IframeWrapper() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  const title = searchParams.get('title');

  if (!url) return <div className="text-white text-center mt-20">Invalid Stream URL</div>;

  return (
    <iframe 
      src={`/player.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`} 
      className="w-full h-screen border-none bg-black"
      allowFullScreen
      allow="autoplay; encrypted-media"
    />
  );
}

export default function Watch() {
  return (
    <div className="min-h-screen bg-black">
      <Suspense fallback={<div className="text-zinc-500 text-center mt-20 animate-pulse">Initializing Secure Player...</div>}>
        <IframeWrapper />
      </Suspense>
    </div>
  );
}
