'use client';
import { useState } from 'react';

export default function ImageWithFallback({ item, type = 'portrait', className = '' }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(() => {
    // 1. Strictly prioritize the manual thumbnail_url
    if (item?.thumbnail_url) {
      if (item.thumbnail_url.startsWith('/')) return `https://image.tmdb.org/t/p/w500${item.thumbnail_url}`;
      return item.thumbnail_url;
    }
    // 2. Fallback to landscape thumbnail if available
    if (item?.landscape_thumbnail_url) {
      if (item.landscape_thumbnail_url.startsWith('/')) return `https://image.tmdb.org/t/p/w500${item.landscape_thumbnail_url}`;
      return item.landscape_thumbnail_url;
    }
    // 3. Absolute Fallback to local placeholder
    return type === 'portrait' ? '/images/placeholder-portrait.png' : '/images/placeholder-landscape.png';
  });

  return (
    <div className={`relative bg-zinc-900 overflow-hidden ${className}`}>
      {/* Smooth Shimmering Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
           <i className="fas fa-image text-zinc-700 text-2xl"></i>
        </div>
      )}
      
      {/* Standard img tag (bypasses Next.js external domain blocks) */}
      <img 
        src={imgSrc} 
        alt={item?.title || "Thumbnail"} 
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setImgSrc(type === 'portrait' ? '/images/placeholder-portrait.png' : '/images/placeholder-landscape.png');
          setIsLoaded(true); // Stop the shimmer
        }}
        draggable="false"
        loading="lazy"
      />
    </div>
  );
}
