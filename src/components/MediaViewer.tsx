import React, { useState, useEffect } from 'react';
import { MediaItem } from '../types/app';
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { GalleryViewer } from './GalleryViewer';
import { EmbedViewer } from './EmbedViewer';
import { ImageViewer } from './ImageViewer';

interface MediaViewerProps {
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  theme: 'light' | 'dark' | 'off';
  favoriteMedia: string[];
  onToggleFavorite: (mediaId: string) => void;
}

export function MediaViewer({ 
  items, 
  currentIndex, 
  onClose, 
  onNavigate, 
  theme,
  favoriteMedia,
      onToggleFavorite,
      onClose: handleCloseViewer
}: MediaViewerProps) {
  const [showUI, setShowUI] = useState(true);
  const currentItem = items[currentIndex];
  
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < items.length - 1) onNavigate(currentIndex + 1);
      if (e.key === ' ') {
        e.preventDefault();
        setShowUI(!showUI);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, items.length, onClose, onNavigate, showUI]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          button: 'bg-white/20 hover:bg-white/30 text-gray-800',
          closeButton: 'bg-white/20 hover:bg-white/30 text-gray-800',
        };
      case 'dark':
        return {
          button: 'bg-black/20 hover:bg-black/30 text-white',
          closeButton: 'bg-black/20 hover:bg-black/30 text-white',
        };
      default:
        return {
          button: 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-700',
          closeButton: 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-700',
        };
    }
  };

  const themeClasses = getThemeClasses();
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < items.length - 1;
  const isFavorited = currentItem ? favoriteMedia.includes(currentItem.id) : false;
  
  // Safety check - if currentItem is undefined, close the viewer
  if (!currentItem) {
    onClose();
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Navigation buttons */}
      {canGoPrev && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-4 rounded-2xl ${themeClasses.button} transition-all duration-300 ${showUI ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      
      {canGoNext && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-4 rounded-2xl ${themeClasses.button} transition-all duration-300 ${showUI ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Top UI Bar */}
      <div className={`absolute top-0 left-0 right-0 z-10 p-6 transition-all duration-300 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 ${themeClasses.button.includes('text-white') ? 'text-white' : 'text-gray-800'}`}>
            {currentItem.subreddit && (
              <span className="text-sm bg-pink-500 text-white px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                r/{currentItem.subreddit}
              </span>
            )}
          </div>
          
          {/* Center counter */}
          {currentItem.type !== 'gallery' && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="text-sm bg-black/30 text-white px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                {currentIndex + 1} of {items.length}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(currentItem.id)}
              className={`p-3 rounded-2xl ${themeClasses.button} backdrop-blur-sm transition-all duration-200 hover:scale-110`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-pink-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className={`p-3 rounded-2xl ${themeClasses.closeButton} backdrop-blur-sm transition-all duration-200 hover:scale-110`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Content */}
      <div 
        className="w-full h-full flex items-center justify-center p-4"
        onClick={() => setShowUI(!showUI)}
      >
        {currentItem.type === 'video' && currentItem.videoData && (
          <VideoPlayer videoData={currentItem.videoData} theme={theme} />
        )}
        
        {currentItem.type === 'gallery' && currentItem.galleryImages && (
          <GalleryViewer images={currentItem.galleryImages} theme={theme} />
        )}
        
        {currentItem.type === 'embed' && currentItem.embedData && (
          <EmbedViewer embedData={currentItem.embedData} theme={theme} />
        )}
        
        {currentItem.type === 'image' && (
          <ImageViewer imageUrl={currentItem.url} theme={theme} />
        )}
      </div>
    </div>
  );
}