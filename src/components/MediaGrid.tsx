import React, { useState } from 'react';
import { MediaItem } from '../types/app';
import { ContextMenu } from './ContextMenu';
import { MediaFolder, ContextMenuPosition } from '../types/app';
import { Play, Images } from 'lucide-react';

interface MediaGridProps {
  items: MediaItem[];
  onItemClick: (item: MediaItem, index: number) => void;
  isLoading?: boolean;
  theme: 'light' | 'dark' | 'off';
  onLoadMore?: () => void;
  hasMore?: boolean;
  folders?: MediaFolder[];
  onAddToFolder?: (folderId: string, mediaId: string) => void;
  onCreateFolder?: (name: string, color: string, mediaId: string) => void;
  selectedMediaIds?: Set<string>;
  onMediaSelect?: (mediaId: string, ctrlKey: boolean) => void;
  isMultiSelectMode?: boolean;
  allMediaItems?: MediaItem[];
}

export function MediaGrid({ 
  items, 
  onItemClick, 
  isLoading, 
  theme,
  onLoadMore,
  hasMore,
  folders = [],
  onAddToFolder,
  onCreateFolder,
  selectedMediaIds = new Set(),
  onMediaSelect,
  isMultiSelectMode = false,
  allMediaItems = []
}: MediaGridProps) {
  const [contextMenu, setContextMenu] = useState<{
    position: ContextMenuPosition;
    mediaId: string;
  } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-gradient-to-br from-pink-50 via-white to-rose-50',
          card: 'bg-white/70 backdrop-blur-sm border-white/20 hover:bg-white/80',
          overlay: 'bg-black/20 group-hover:bg-black/40',
          button: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
        };
      case 'dark':
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-pink-900/20',
          card: 'bg-gray-800/70 backdrop-blur-sm border-gray-700/20 hover:bg-gray-700/80',
          overlay: 'bg-black/30 group-hover:bg-black/50',
          button: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 via-gray-50 to-pink-50',
          card: 'bg-gray-50/70 backdrop-blur-sm border-gray-200/20 hover:bg-gray-100/80',
          overlay: 'bg-black/20 group-hover:bg-black/40',
          button: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
        };
    }
  };

  const themeClasses = getThemeClasses();

  const handleContextMenu = (e: React.MouseEvent, mediaId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If in multi-select mode and this item is selected, show context menu for all selected
    const targetMediaId = isMultiSelectMode && selectedMediaIds.has(mediaId) && selectedMediaIds.size > 1
      ? Array.from(selectedMediaIds)[0] // Use first selected item as representative
      : mediaId;
    
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      mediaId: targetMediaId
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleLoadMore = async () => {
    if (!onLoadMore || isLoading || isLoadingMore) return;
    
    // Store current scroll position and the last visible item
    const scrollPosition = window.scrollY;
    const lastItemElement = document.querySelector('[data-media-item]:last-child');
    const lastItemId = lastItemElement?.getAttribute('data-media-id');
    
    setIsLoadingMore(true);
    
    try {
      await onLoadMore();
      
      // After new items are loaded, restore scroll position
      // We need to wait for the DOM to update
      setTimeout(() => {
        if (lastItemId) {
          // Find the element that was previously the last item
          const previousLastItem = document.querySelector(`[data-media-id="${lastItemId}"]`);
          if (previousLastItem) {
            // Scroll to maintain the user's position relative to the previous last item
            previousLastItem.scrollIntoView({ 
              behavior: 'instant',
              block: 'center'
            });
          }
        } else {
          // Fallback: restore the exact scroll position
          window.scrollTo(0, scrollPosition);
        }
        setIsLoadingMore(false);
      }, 100);
    } catch (error) {
      console.error('Error loading more items:', error);
      setIsLoadingMore(false);
    }
  };
  if (isLoading && items.length === 0) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} p-6`}>
        <div className="media-grid">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className={`${themeClasses.card} border rounded-2xl animate-pulse aspect-[3/4]`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} p-6`}>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            data-media-item
            data-media-id={item.id}
            className={`group cursor-pointer transition-all duration-300 hover:scale-105 ${
              selectedMediaIds.has(item.id) ? 'ring-4 ring-blue-400 ring-opacity-70' : ''
            }`}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                onMediaSelect?.(item.id, true);
              } else if (isMultiSelectMode && selectedMediaIds.size > 0) {
                // If in multi-select mode, toggle selection
                onMediaSelect?.(item.id, true);
              } else {
                onItemClick(item, index);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, item.id)}
          >
            <div className={`relative ${themeClasses.card} border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 aspect-[3/4]`}>
              {/* Media */}
              <img
                src={item.thumbnail || item.url}
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Try fallback to main URL if thumbnail fails
                  if (target.src !== item.url && item.url) {
                    target.src = item.url;
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
              
              {/* Overlay */}
              <div className={`absolute inset-0 ${themeClasses.overlay} transition-all duration-300`} />
              
              {/* Media type indicator */}
              <div className="absolute top-3 right-3">
                {selectedMediaIds.has(item.id) && (
                  <div className="bg-blue-500 text-white p-2 rounded-full backdrop-blur-sm mb-2">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                )}
                {item.type === 'video' && (
                  <div className="bg-black/70 text-white p-2 rounded-full backdrop-blur-sm">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                )}
                {item.type === 'gallery' && (
                  <div className="bg-black/70 text-white p-2 rounded-full backdrop-blur-sm">
                    <Images className="w-4 h-4" />
                  </div>
                )}
                {item.type === 'embed' && (
                  <div className="bg-black/70 text-white p-2 rounded-full backdrop-blur-sm">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center mt-12 mb-8">
          <button
            onClick={handleLoadMore}
            disabled={isLoading || isLoadingMore}
            className={`${themeClasses.button} text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isLoading || isLoadingMore ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
      
      {/* Context Menu */}
      {contextMenu && onAddToFolder && onCreateFolder && (
        <ContextMenu
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
          mediaId={contextMenu.mediaId}
          folders={folders}
          onAddToFolder={onAddToFolder}
          onCreateFolder={onCreateFolder}
          theme={theme}
          isMultiSelectMode={isMultiSelectMode}
          selectedCount={selectedMediaIds.size}
          allMediaItems={allMediaItems.length > 0 ? allMediaItems : items}
        />
      )}
    </div>
  );
}