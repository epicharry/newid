import React, { useRef, useEffect, useState } from 'react';

interface VideoPlayerProps {
  videoData: {
    fallback_url: string;
    has_audio: boolean;
    height: number;
    width: number;
    duration: number;
    hls_url?: string;
  };
  theme: 'light' | 'dark' | 'off';
}

export function VideoPlayer({ videoData, theme }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [plyrLoaded, setPlyrLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    // Dynamically load Plyr
    const loadPlyr = async () => {
      if (plyrLoaded) return;
      
      try {
        // Load Plyr CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
        document.head.appendChild(link);
        
        // Load Plyr JS
        const script = document.createElement('script');
        script.src = 'https://cdn.plyr.io/3.7.8/plyr.polyfilled.js';
        script.onload = () => {
          setPlyrLoaded(true);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load Plyr:', error);
      }
    };
    
    loadPlyr();
  }, [plyrLoaded]);
  
  useEffect(() => {
    // Calculate responsive dimensions that fit within viewport
    const maxWidth = Math.min(videoData.width, window.innerWidth - 64);
    const maxHeight = Math.min(videoData.height, window.innerHeight - 64);
    
    // Maintain aspect ratio while fitting in container
    const aspectRatio = videoData.width / videoData.height;
    let finalWidth = maxWidth;
    let finalHeight = maxWidth / aspectRatio;
    
    if (finalHeight > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = maxHeight * aspectRatio;
    }
    
    // Ensure minimum size for usability
    const minWidth = Math.min(400, window.innerWidth - 64);
    const minHeight = Math.min(300, window.innerHeight - 64);
    
    if (finalWidth < minWidth) {
      finalWidth = minWidth;
      finalHeight = minWidth / aspectRatio;
    }
    
    if (finalHeight < minHeight) {
      finalHeight = minHeight;
      finalWidth = minHeight * aspectRatio;
    }
    
    setDimensions({ width: finalWidth, height: finalHeight });
  }, [videoData.width, videoData.height]);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !plyrLoaded || !(window as any).Plyr) return;

    // Initialize Plyr with enhanced options
    playerRef.current = new (window as any).Plyr(video, {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'settings',
        'fullscreen'
      ],
      settings: ['quality', 'speed'],
      quality: {
        default: 720,
        options: [1080, 720, 480, 360],
        forced: true,
        onChange: (quality: number) => {
          console.log('Quality changed to:', quality);
        },
      },
      speed: {
        selected: 1,
        options: [0.5, 0.75, 1, 1.25, 1.5, 2]
      },
      keyboard: { focused: true, global: false },
      tooltips: { controls: true, seek: true },
      captions: { active: false },
      hideControls: true,
      clickToPlay: true,
      disableContextMenu: true,
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoData.fallback_url, plyrLoaded]);

  const getPlayerTheme = () => {
    return theme === 'light' ? 'plyr--light' : 'plyr--dark';
  };

  return (
    <div 
      className={`relative w-full h-full flex items-center justify-center ${getPlayerTheme()}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="relative"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
      <video
        ref={videoRef}
        src={videoData.fallback_url}
        className="w-full h-full object-contain rounded-2xl"
        controls={!plyrLoaded}
        loop
        playsInline
        autoPlay={false}
        preload="metadata"
      />
      </div>
      {!plyrLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      )}
    </div>
  );
}