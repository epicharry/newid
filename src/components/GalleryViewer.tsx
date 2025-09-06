import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryViewerProps {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  theme: 'light' | 'dark' | 'off';
}

export function GalleryViewer({ images, theme }: GalleryViewerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentImage = images[currentImageIndex];

  // Handle zoom with mouse wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.5, Math.min(5, scale + delta));
      setScale(newScale);
      
      // Reset position when zooming out to fit
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [scale]);

  // Handle keyboard navigation for gallery (prevent parent media navigation)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Stop propagation to prevent parent media viewer from handling these keys
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.stopPropagation();
        e.preventDefault();
        
        if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
          goToPrevious();
        } else if (e.key === 'ArrowRight' && currentImageIndex < images.length - 1) {
          goToNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyPress, { capture: true });
  }, [currentImageIndex, images.length]);

  const goToPrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      // Reset zoom when changing images
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const goToNext = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      // Reset zoom when changing images
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          button: 'bg-white/20 hover:bg-white/30 text-gray-800',
          counter: 'bg-white/20 text-gray-800',
          thumbnail: 'border-pink-400 hover:border-white/50',
        };
      case 'dark':
        return {
          button: 'bg-black/20 hover:bg-black/30 text-white',
          counter: 'bg-black/20 text-white',
          thumbnail: 'border-pink-400 hover:border-white/50',
        };
      default:
        return {
          button: 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-700',
          counter: 'bg-gray-500/20 text-gray-700',
          thumbnail: 'border-pink-400 hover:border-gray-500/50',
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Main image */}
      <img
        ref={imageRef}
        src={currentImage.url}
        alt=""
        className="max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] object-contain rounded-2xl transition-transform duration-200"
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
        }}
        draggable={false}
        onLoad={() => {
          // Reset zoom when new image loads
          setScale(1);
          setPosition({ x: 0, y: 0 });
        }}
      />

      {/* Zoom indicator */}
      {scale !== 1 && (
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          {currentImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className={`absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl ${themeClasses.button} backdrop-blur-sm transition-all duration-200 z-10`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {currentImageIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl ${themeClasses.button} backdrop-blur-sm transition-all duration-200 z-10`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image counter - centered at top */}
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 ${themeClasses.counter} backdrop-blur-sm px-4 py-2 rounded-2xl text-sm font-medium z-10`}>
            {currentImageIndex + 1} / {images.length}
          </div>

          {/* Thumbnail strip */}
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 ${themeClasses.counter} backdrop-blur-sm p-3 rounded-2xl max-w-full overflow-x-auto z-10`}>
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                  // Reset zoom when changing images
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className={`flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  index === currentImageIndex ? themeClasses.thumbnail.split(' ')[0] : `border-transparent ${themeClasses.thumbnail.split(' ')[1]}`
                }`}
              >
                <img
                  src={image.url} 
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}