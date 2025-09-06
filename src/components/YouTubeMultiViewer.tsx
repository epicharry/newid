import React, { useState, useRef, useEffect } from 'react';
import { YouTubeVideo } from '../types/app';
import { Play, Pause, Volume2, VolumeX, X, Grid, List, RotateCcw, Settings, Eye, EyeOff, Maximize, SkipBack, SkipForward, Trash2 } from 'lucide-react';

interface YouTubeMultiViewerProps {
  videos: YouTubeVideo[];
  onClose: () => void;
  theme: 'light' | 'dark' | 'off';
  onRemoveVideo?: (videoId: string) => void;
}

interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
  startTime: number;
  loop: boolean;
  quality: string;
}

interface VideoPanel {
  id: string;
  video: YouTubeVideo;
  position: { x: number; y: number };
  size: { width: number; height: number };
  player?: any;
  isPiP: boolean;
  zIndex: number;
}

interface GridPreset {
  name: string;
  cols: number;
  rows: number;
}

const gridPresets: GridPreset[] = [
  { name: '1×1', cols: 1, rows: 1 },
  { name: '2×1', cols: 2, rows: 1 },
  { name: '2×2', cols: 2, rows: 2 },
  { name: '3×2', cols: 3, rows: 2 },
  { name: '3×3', cols: 3, rows: 3 },
  { name: '4×3', cols: 4, rows: 3 },
  { name: '4×4', cols: 4, rows: 4 },
];

export function YouTubeMultiViewer({ videos, onClose, theme }: YouTubeMultiViewerProps) {
  const [globalPlayerState, setGlobalPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isMuted: false,
    volume: 50,
    playbackRate: 1,
    startTime: 0,
    loop: false,
    quality: 'hd1080',
  });
  
  const [videoPanels, setVideoPanels] = useState<VideoPanel[]>([]);
  const [showUI, setShowUI] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'free' | 'grid'>('grid');
  const [selectedPreset, setSelectedPreset] = useState<GridPreset>(gridPresets[1]); // Start with 2×1
  const [stretchToFill, setStretchToFill] = useState(false);
  const [plyrLoaded, setPlyrLoaded] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    panelId: string | null;
    startPos: { x: number; y: number };
    startPanelPos: { x: number; y: number };
  }>({
    isDragging: false,
    panelId: null,
    startPos: { x: 0, y: 0 },
    startPanelPos: { x: 0, y: 0 },
  });
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    panelId: string | null;
    startPos: { x: number; y: number };
    startSize: { width: number; height: number };
  }>({
    isResizing: false,
    panelId: null,
    startPos: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 },
  });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Plyr
  useEffect(() => {
    const loadPlyr = async () => {
      if (plyrLoaded || (window as any).Plyr) {
        setPlyrLoaded(true);
        return;
      }
      
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
  }, []);

  // Initialize video panels
  useEffect(() => {
    if (!plyrLoaded || videos.length === 0) return;

    const containerWidth = window.innerWidth - 32;
    const containerHeight = window.innerHeight - 200;
    
    const panels: VideoPanel[] = videos.map((video, index) => {
      const defaultSize = calculateDefaultSize(videos.length, containerWidth, containerHeight, index);
      const defaultPosition = calculateDefaultPosition(videos.length, containerWidth, containerHeight, index, defaultSize);
      
      return {
        id: video.id,
        video,
        position: defaultPosition,
        size: defaultSize,
        isPiP: false,
        zIndex: 10 + index,
      };
    });
    
    setVideoPanels(panels);
    setMaxZIndex(10 + videos.length);
  }, [videos, plyrLoaded]);

  // Apply grid preset
  useEffect(() => {
    if (layoutMode === 'grid' && videoPanels.length > 0) {
      applyGridPreset(selectedPreset);
    }
  }, [selectedPreset, layoutMode, stretchToFill]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          handleGlobalPlayPause();
          break;
        case 'm':
          e.preventDefault();
          handleGlobalMute();
          break;
        case 'u':
          e.preventDefault();
          setShowUI(!showUI);
          break;
        case 'escape':
          if (showSettings) {
            setShowSettings(false);
          } else if (videoPanels.some(p => p.isPiP)) {
            // Exit all PiP modes
            setVideoPanels(prev => prev.map(panel => ({ ...panel, isPiP: false })));
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showUI, showSettings]);

  // Mouse event handlers for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging && dragState.panelId) {
        const deltaX = e.clientX - dragState.startPos.x;
        const deltaY = e.clientY - dragState.startPos.y;
        
        setVideoPanels(prev => prev.map(panel => 
          panel.id === dragState.panelId 
            ? {
                ...panel,
                position: {
                  x: Math.max(0, dragState.startPanelPos.x + deltaX),
                  y: Math.max(0, dragState.startPanelPos.y + deltaY),
                }
              }
            : panel
        ));
      }
      
      if (resizeState.isResizing && resizeState.panelId) {
        const deltaX = e.clientX - resizeState.startPos.x;
        const deltaY = e.clientY - resizeState.startPos.y;
        
        setVideoPanels(prev => prev.map(panel => 
          panel.id === resizeState.panelId 
            ? {
                ...panel,
                size: {
                  width: Math.max(200, resizeState.startSize.width + deltaX),
                  height: Math.max(113, resizeState.startSize.height + deltaY),
                }
              }
            : panel
        ));
      }
    };

    const handleMouseUp = () => {
      setDragState(prev => ({ ...prev, isDragging: false, panelId: null }));
      setResizeState(prev => ({ ...prev, isResizing: false, panelId: null }));
    };

    if (dragState.isDragging || resizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, resizeState]);

  const calculateDefaultSize = (videoCount: number, containerWidth: number, containerHeight: number, index: number) => {
    if (videoCount === 1) {
      return { width: Math.min(800, containerWidth * 0.8), height: Math.min(450, containerHeight * 0.8) };
    } else if (videoCount === 2) {
      return { width: Math.min(600, containerWidth * 0.45), height: Math.min(338, containerHeight * 0.6) };
    } else if (videoCount <= 4) {
      return { width: Math.min(400, containerWidth * 0.4), height: Math.min(225, containerHeight * 0.4) };
    } else {
      return { width: Math.min(320, containerWidth * 0.3), height: Math.min(180, containerHeight * 0.3) };
    }
  };

  const calculateDefaultPosition = (videoCount: number, containerWidth: number, containerHeight: number, index: number, size: { width: number; height: number }) => {
    const padding = 20;
    
    if (videoCount === 1) {
      return { 
        x: (containerWidth - size.width) / 2, 
        y: (containerHeight - size.height) / 2 
      };
    } else if (videoCount === 2) {
      return {
        x: index === 0 ? padding : containerWidth - size.width - padding,
        y: (containerHeight - size.height) / 2
      };
    } else {
      const cols = Math.ceil(Math.sqrt(videoCount));
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      return {
        x: col * (size.width + padding) + padding,
        y: row * (size.height + padding) + padding
      };
    }
  };

  const applyGridPreset = (preset: GridPreset) => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const padding = 16;
    
    const cellWidth = (containerWidth - padding * (preset.cols + 1)) / preset.cols;
    const cellHeight = (containerHeight - padding * (preset.rows + 1)) / preset.rows;
    
    setVideoPanels(prev => prev.map((panel, index) => {
      const row = Math.floor(index / preset.cols);
      const col = index % preset.cols;
      
      const size = stretchToFill 
        ? { width: cellWidth, height: cellHeight }
        : { 
            width: Math.min(cellWidth, 400), 
            height: Math.min(cellHeight, 225) 
          };
      
      return {
        ...panel,
        position: {
          x: col * (cellWidth + padding) + padding,
          y: row * (cellHeight + padding) + padding
        },
        size
      };
    }));
  };

  const initializePlayer = (videoId: string, element: HTMLDivElement) => {
    if (!plyrLoaded || !(window as any).Plyr) return;

    // Create video element for Plyr YouTube provider
    const videoElement = document.createElement('div');
    videoElement.setAttribute('data-plyr-provider', 'youtube');
    videoElement.setAttribute('data-plyr-embed-id', videoId);
    
    element.innerHTML = '';
    element.appendChild(videoElement);

    const player = new (window as any).Plyr(videoElement, {
      controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'fullscreen'],
      settings: ['quality', 'speed'],
      volume: globalPlayerState.volume / 100,
      muted: globalPlayerState.isMuted,
      speed: { selected: globalPlayerState.playbackRate },
      quality: { default: globalPlayerState.quality, options: ['hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small'] },
      keyboard: { focused: false, global: false },
      clickToPlay: true,
      youtube: {
        noCookie: false,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        hd: 1,
        vq: globalPlayerState.quality,
        start: globalPlayerState.startTime,
        loop: globalPlayerState.loop ? 1 : 0,
        playlist: globalPlayerState.loop ? videoId : undefined,
      },
    });

    setVideoPanels(prev => prev.map(panel => 
      panel.id === videoId ? { ...panel, player } : panel
    ));
  };

  const handleGlobalPlayPause = () => {
    videoPanels.forEach(panel => {
      if (panel.player) {
        try {
          if (globalPlayerState.isPlaying) {
            panel.player.pause();
          } else {
            panel.player.play();
          }
        } catch (e) {
          console.warn('Error controlling player:', e);
        }
      }
    });
    setGlobalPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleGlobalMute = () => {
    videoPanels.forEach(panel => {
      if (panel.player) {
        try {
          panel.player.muted = !globalPlayerState.isMuted;
        } catch (e) {
          console.warn('Error controlling player:', e);
        }
      }
    });
    setGlobalPlayerState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const handleVolumeChange = (volume: number) => {
    videoPanels.forEach(panel => {
      if (panel.player) {
        try {
          panel.player.volume = volume / 100;
        } catch (e) {
          console.warn('Error controlling player:', e);
        }
      }
    });
    setGlobalPlayerState(prev => ({ ...prev, volume }));
  };

  const handlePlaybackRateChange = (rate: number) => {
    videoPanels.forEach(panel => {
      if (panel.player) {
        try {
          panel.player.speed = rate;
        } catch (e) {
          console.warn('Error controlling player:', e);
        }
      }
    });
    setGlobalPlayerState(prev => ({ ...prev, playbackRate: rate }));
  };

  const handleQualityChange = (quality: string) => {
    videoPanels.forEach(panel => {
      if (panel.player) {
        try {
          panel.player.quality = quality;
        } catch (e) {
          console.warn('Error controlling player:', e);
        }
      }
    });
    setGlobalPlayerState(prev => ({ ...prev, quality }));
  };

  const handleStartTimeChange = (startTime: number) => {
    setGlobalPlayerState(prev => ({ ...prev, startTime }));
  };

  const handleLoopToggle = () => {
    const newLoop = !globalPlayerState.loop;
    videoPanels.forEach(panel => {
      if (panel.player) {
        try {
          panel.player.loop = newLoop;
        } catch (e) {
          console.warn('Error controlling player:', e);
        }
      }
    });
    setGlobalPlayerState(prev => ({ ...prev, loop: newLoop }));
  };

  const handleRestart = () => {
    videoPanels.forEach(panel => {
      if (panel.player) {
        try {
          panel.player.currentTime = globalPlayerState.startTime;
          panel.player.pause();
        } catch (e) {
          console.warn('Error restarting player:', e);
        }
      }
    });
    setGlobalPlayerState(prev => ({ ...prev, isPlaying: false }));
  };

  const handleTogglePiP = (panelId: string) => {
    const panel = videoPanels.find(p => p.id === panelId);
    if (!panel) return;

    if (!panel.isPiP) {
      // Enter PiP mode
      if (panel.player && panel.player.media && panel.player.media.requestPictureInPicture) {
        panel.player.media.requestPictureInPicture().catch((error: any) => {
          console.warn('PiP not supported or failed:', error);
          // Fallback to custom PiP
          setVideoPanels(prev => prev.map(p => {
            if (p.id === panelId) {
              const newZIndex = maxZIndex + 1;
              setMaxZIndex(newZIndex);
              return { ...p, isPiP: true, zIndex: newZIndex };
            }
            return p;
          }));
        });
      } else {
        // Fallback to custom PiP
        setVideoPanels(prev => prev.map(p => {
          if (p.id === panelId) {
            const newZIndex = maxZIndex + 1;
            setMaxZIndex(newZIndex);
            return { ...p, isPiP: true, zIndex: newZIndex };
          }
          return p;
        }));
      }
    } else {
      // Exit PiP mode
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(console.warn);
      }
      setVideoPanels(prev => prev.map(p => {
        if (p.id === panelId) {
          return { ...p, isPiP: false };
        }
        return p;
      }));
    }
  };

  const bringToFront = (panelId: string) => {
    setVideoPanels(prev => prev.map(panel => {
      if (panel.id === panelId) {
        const newZIndex = maxZIndex + 1;
        setMaxZIndex(newZIndex);
        return { ...panel, zIndex: newZIndex };
      }
      return panel;
    }));
  };

  const handleRemoveVideo = (videoId: string) => {
    if (onRemoveVideo) {
      onRemoveVideo(videoId);
    }
  };

  const handleDragStart = (e: React.MouseEvent, panelId: string) => {
    const panel = videoPanels.find(p => p.id === panelId);
    if (!panel) return;
    
    // Allow dragging in free mode or when in PiP mode
    if (layoutMode !== 'free' && !panel.isPiP) return;
    
    // Don't drag if in browser PiP mode
    if (document.pictureInPictureElement) return;
    
    // Bring to front when starting to drag
    bringToFront(panelId);
    
    setDragState({
      isDragging: true,
      panelId,
      startPos: { x: e.clientX, y: e.clientY },
      startPanelPos: panel.position,
    });
  };

  const handleResizeStart = (e: React.MouseEvent, panelId: string) => {
    e.stopPropagation();
    
    const panel = videoPanels.find(p => p.id === panelId);
    if (!panel) return;
    
    setResizeState({
      isResizing: true,
      panelId,
      startPos: { x: e.clientX, y: e.clientY },
      startSize: panel.size,
    });
  };

  const formatDuration = (duration: string): string => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-gradient-to-br from-pink-50 via-white to-rose-50',
          controlBar: 'bg-white/90 backdrop-blur-xl border-white/20',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          button: 'bg-red-500 hover:bg-red-600 text-white',
          secondaryButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          panel: 'bg-white/90 backdrop-blur-sm border-white/20',
          input: 'bg-white border-gray-200 focus:border-red-400',
        };
      case 'dark':
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-red-900/20',
          controlBar: 'bg-gray-800/90 backdrop-blur-xl border-gray-700/20',
          text: 'text-white',
          subtext: 'text-gray-300',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          secondaryButton: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
          panel: 'bg-gray-800/90 backdrop-blur-sm border-gray-700/20',
          input: 'bg-gray-700 border-gray-600 focus:border-red-400 text-white',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 via-gray-50 to-red-50',
          controlBar: 'bg-gray-50/90 backdrop-blur-xl border-gray-200/20',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          button: 'bg-red-500 hover:bg-red-600 text-white',
          secondaryButton: 'bg-gray-200 hover:bg-gray-300 text-gray-600',
          panel: 'bg-gray-50/90 backdrop-blur-sm border-gray-200/20',
          input: 'bg-gray-100 border-gray-300 focus:border-red-400',
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.bg} relative overflow-hidden`}>
      {/* Control Bar */}
      <div className={`${showUI ? 'translate-y-0' : '-translate-y-full'} transition-transform duration-300 sticky top-0 z-50 ${themeClasses.controlBar} border-b p-4`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className={`p-2 rounded-xl ${themeClasses.secondaryButton} transition-all duration-200`}
              >
                <X className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className={`text-xl font-bold ${themeClasses.text}`}>
                  YouTube Multi-Viewer
                </h1>
                <p className={`text-sm ${themeClasses.subtext}`}>
                  {videos.length} video{videos.length !== 1 ? 's' : ''} • Press U to toggle UI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Global Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRestart}
                  className={`p-2 rounded-xl ${themeClasses.secondaryButton} transition-all duration-200`}
                  title="Restart All (to start time)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleGlobalPlayPause}
                  className={`p-2 rounded-xl ${themeClasses.button} transition-all duration-200`}
                  title="Space: Play/Pause All"
                >
                  {globalPlayerState.isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                
                <button
                  onClick={handleGlobalMute}
                  className={`p-2 rounded-xl ${themeClasses.secondaryButton} transition-all duration-200`}
                  title="M: Mute/Unmute All"
                >
                  {globalPlayerState.isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={globalPlayerState.volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  className="w-20 accent-red-500"
                  title="Global Volume"
                />
              </div>

              {/* Layout Controls */}
              <div className={`${themeClasses.panel} border rounded-xl p-1 flex gap-1`}>
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    layoutMode === 'grid' 
                      ? 'bg-red-500 text-white' 
                      : `${themeClasses.secondaryButton}`
                  }`}
                  title="Grid Layout"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayoutMode('free')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    layoutMode === 'free' 
                      ? 'bg-red-500 text-white' 
                      : `${themeClasses.secondaryButton}`
                  }`}
                  title="Free Layout"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl ${themeClasses.secondaryButton} transition-all duration-200`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowUI(!showUI)}
                className={`p-2 rounded-xl ${themeClasses.secondaryButton} transition-all duration-200`}
                title="U: Toggle UI"
              >
                {showUI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Grid Presets */}
          {layoutMode === 'grid' && (
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-sm ${themeClasses.subtext} mr-2`}>Grid:</span>
              {gridPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(preset)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                    selectedPreset.name === preset.name
                      ? 'bg-red-500 text-white'
                      : `${themeClasses.secondaryButton}`
                  }`}
                >
                  {preset.name}
                </button>
              ))}
              <button
                onClick={() => setStretchToFill(!stretchToFill)}
                className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                  stretchToFill
                    ? 'bg-blue-500 text-white'
                    : `${themeClasses.secondaryButton}`
                }`}
              >
                Stretch to Fill
              </button>
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <div className={`${themeClasses.panel} border rounded-2xl p-6 space-y-4`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
                Global Player Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Video Quality
                  </label>
                  <select
                    value={globalPlayerState.quality}
                    onChange={(e) => handleQualityChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} border focus:outline-none focus:ring-2 focus:ring-red-400/50`}
                  >
                    <option value="hd2160">4K (2160p)</option>
                    <option value="hd1440">1440p</option>
                    <option value="hd1080">1080p (HD)</option>
                    <option value="hd720">720p</option>
                    <option value="large">480p</option>
                    <option value="medium">360p</option>
                    <option value="small">240p</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Playback Speed
                  </label>
                  <select
                    value={globalPlayerState.playbackRate}
                    onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} border focus:outline-none focus:ring-2 focus:ring-red-400/50`}
                  >
                    <option value={0.25}>0.25x</option>
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x (Normal)</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Start Time (seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={globalPlayerState.startTime}
                    onChange={(e) => handleStartTimeChange(parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} border focus:outline-none focus:ring-2 focus:ring-red-400/50`}
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalPlayerState.loop}
                      onChange={handleLoopToggle}
                      className="w-4 h-4 text-red-500 rounded focus:ring-red-400"
                    />
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                      Loop All Videos
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Container */}
      <div 
        ref={containerRef}
        className={`relative w-full h-screen ${showUI ? 'overflow-hidden' : 'overflow-visible'}`}
        style={{ height: 'calc(100vh - 120px)' }}
      >
        {videoPanels.map((panel) => (
          <div
            key={panel.id}
            className={`${panel.isPiP || !showUI ? 'fixed' : 'absolute'} ${themeClasses.panel} border rounded-2xl overflow-hidden shadow-2xl ${
              (layoutMode === 'free' || panel.isPiP) ? 'cursor-move' : ''
            }`}
            style={{ 
              left: panel.position.x,
              top: panel.position.y,
              width: panel.size.width, 
              height: panel.size.height,
              userSelect: 'none',
              zIndex: panel.isPiP || !showUI ? panel.zIndex + 1000 : panel.zIndex,
            }}
            onClick={() => bringToFront(panel.id)}
          >
            {/* Invisible Drag Handle - only visible on hover when UI is shown */}
            {showUI && (
              <div 
                className={`absolute top-0 left-0 right-0 h-8 bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-move z-10 flex items-center justify-between px-3`}
                onMouseDown={(e) => handleDragStart(e, panel.id)}
              >
                <span className={`text-xs font-medium text-white truncate flex-1`}>
                  {panel.video.title}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePiP(panel.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      panel.isPiP 
                        ? 'bg-blue-500 text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/20'
                    }`}
                    title={panel.isPiP ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}
                  >
                    <Maximize className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveVideo(panel.id);
                    }}
                    className={`p-1 rounded transition-colors text-red-400 hover:text-red-300 hover:bg-red-500/20`}
                    title="Remove video"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Video Player */}
            <div 
              className="w-full h-full relative"
              ref={(el) => {
                if (el && plyrLoaded && !panel.player) {
                  initializePlayer(panel.id, el);
                }
              }}
            />

            {/* Resize Handle */}
            <div
              className={`absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-70 transition-opacity ${
                showUI ? 'block' : 'hidden'
              }`}
              style={{
                background: `linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.8) 70%, transparent 70%)`,
              }}
              onMouseDown={(e) => handleResizeStart(e, panel.id)}
            />
          </div>
        ))}
      </div>

      {/* Hotkey Help */}
      {showUI && (
        <div className="absolute bottom-4 left-4 z-40">
          <div className={`${themeClasses.panel} border rounded-xl px-4 py-2`}>
            <div className={`text-xs ${themeClasses.subtext} space-y-1`}>
              <div><kbd className="bg-gray-200 px-1 rounded text-gray-800">Space</kbd> Play/Pause</div>
              <div><kbd className="bg-gray-200 px-1 rounded text-gray-800">M</kbd> Mute/Unmute</div>
              <div><kbd className="bg-gray-200 px-1 rounded text-gray-800">U</kbd> Toggle UI</div>
              <div><kbd className="bg-gray-200 px-1 rounded text-gray-800">Hover</kbd> Show Controls</div>
              <div><kbd className="bg-gray-200 px-1 rounded text-gray-800">Click</kbd> Bring to Front</div>
              <div><kbd className="bg-gray-200 px-1 rounded text-gray-800">Esc</kbd> Close</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {!plyrLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video players...</p>
          </div>
        </div>
      )}
    </div>
  );
}