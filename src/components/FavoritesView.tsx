import React, { useState } from 'react';
import { MediaItem, MediaFolder, ContextMenuPosition } from '../types/app';
import { MediaGrid } from './MediaGrid';
import { ContextMenu } from './ContextMenu';
import { Heart, Sparkles } from 'lucide-react';

interface FavoritesViewProps {
  favoriteMedia: MediaItem[];
  onItemClick: (item: MediaItem, index: number) => void;
  theme: 'light' | 'dark' | 'off';
  folders: MediaFolder[];
  onAddToFolder: (folderId: string, mediaId: string) => void;
  onCreateFolder: (name: string, color: string, mediaId: string) => void;
}

export function FavoritesView({ 
  favoriteMedia, 
  onItemClick, 
  theme, 
  folders, 
  onAddToFolder, 
  onCreateFolder 
}: FavoritesViewProps) {
  const [contextMenu, setContextMenu] = useState<{
    position: ContextMenuPosition;
    mediaId: string;
  } | null>(null);

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-gradient-to-br from-pink-50 via-white to-rose-50',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
        };
      case 'dark':
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-pink-900/20',
          text: 'text-white',
          subtext: 'text-gray-300',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 via-gray-50 to-pink-50',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
        };
    }
  };

  const themeClasses = getThemeClasses();

  const handleContextMenu = (e: React.MouseEvent, mediaId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      mediaId
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  if (favoriteMedia.length === 0) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center p-6`}>
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Heart className={`w-16 h-16 ${themeClasses.subtext}`} />
            <Sparkles className={`w-8 h-8 ${themeClasses.subtext} -ml-2 -mt-4`} />
          </div>
          <h2 className={`text-2xl font-bold ${themeClasses.text} mb-3`}>
            No Favorites Yet
          </h2>
          <p className={`${themeClasses.subtext} leading-relaxed`}>
            Start exploring media and tap the heart icon to save your favorite images and videos here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MediaGrid
        items={favoriteMedia}
        onItemClick={onItemClick}
        theme={theme}
        isLoading={false}
        hasMore={false}
        folders={folders}
        onAddToFolder={onAddToFolder}
        onCreateFolder={onCreateFolder}
        selectedMediaIds={new Set()}
        onMediaSelect={() => {}}
        isMultiSelectMode={false}
      />
      
      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
          mediaId={contextMenu.mediaId}
          folders={folders}
          onAddToFolder={onAddToFolder}
          onCreateFolder={onCreateFolder}
          theme={theme}
        />
      )}
    </>
  );
}