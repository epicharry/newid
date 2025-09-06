import React, { useState, useEffect, useRef } from 'react';
import { MediaFolder, ContextMenuPosition } from '../types/app';
import { FolderPlus, Folder, X, Check, Edit2, Trash2 } from 'lucide-react';

interface ContextMenuProps {
  position: ContextMenuPosition;
  onClose: () => void;
  mediaId: string;
  folders: MediaFolder[];
  onAddToFolder: (folderId: string, mediaId: string) => void;
  onCreateFolder: (name: string, color: string, mediaId: string) => void;
  theme: 'light' | 'dark' | 'off';
  isMultiSelectMode?: boolean;
  selectedCount?: number;
  allMediaItems?: MediaItem[];
}

const folderColors = [
  { name: 'Pink', value: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-600' },
  { name: 'Blue', value: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600' },
  { name: 'Green', value: 'bg-green-500', border: 'border-green-500', text: 'text-green-600' },
  { name: 'Purple', value: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-600' },
  { name: 'Orange', value: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-600' },
  { name: 'Red', value: 'bg-red-500', border: 'border-red-500', text: 'text-red-600' },
  { name: 'Indigo', value: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-600' },
  { name: 'Teal', value: 'bg-teal-500', border: 'border-teal-500', text: 'text-teal-600' },
];

export function ContextMenu({
  position,
  onClose,
  mediaId,
  folders,
  onAddToFolder,
  onCreateFolder,
  theme,
  isMultiSelectMode = false,
  selectedCount = 0,
  allMediaItems = []
}: ContextMenuProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(folderColors[0]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-white/95 backdrop-blur-xl border-white/20',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          hover: 'hover:bg-gray-50',
          input: 'bg-white border-gray-200 focus:border-pink-400',
          button: 'bg-pink-500 hover:bg-pink-600 text-white',
          secondaryButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        };
      case 'dark':
        return {
          bg: 'bg-gray-800/95 backdrop-blur-xl border-gray-700/20',
          text: 'text-white',
          subtext: 'text-gray-300',
          hover: 'hover:bg-gray-700',
          input: 'bg-gray-700 border-gray-600 focus:border-pink-400 text-white',
          button: 'bg-pink-600 hover:bg-pink-700 text-white',
          secondaryButton: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
        };
      default:
        return {
          bg: 'bg-gray-50/95 backdrop-blur-xl border-gray-200/20',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          hover: 'hover:bg-gray-100',
          input: 'bg-gray-100 border-gray-300 focus:border-pink-400',
          button: 'bg-pink-500 hover:bg-pink-600 text-white',
          secondaryButton: 'bg-gray-200 hover:bg-gray-300 text-gray-600',
        };
    }
  };

  const themeClasses = getThemeClasses();

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      // Find the media item to pass to create folder
      const mediaItem = allMediaItems.find(item => item.id === mediaId);
      if (mediaItem) {
        onCreateFolder(newFolderName.trim(), selectedColor.value, mediaId);
      }
      setNewFolderName('');
      setSelectedColor(folderColors[0]);
      setShowCreateForm(false);
      onClose();
    }
  };

  const handleAddToFolder = (folderId: string) => {
    // Verify the media item exists before adding
    const mediaItem = allMediaItems.find(item => item.id === mediaId);
    
    if (!mediaItem) {
      console.error('Media item not found:', mediaId);
      return;
    }
    
    onAddToFolder(folderId, mediaId);
    onClose();
  };

  // Calculate menu position to keep it within viewport
  const menuStyle = {
    left: Math.min(position.x, window.innerWidth - 300),
    top: Math.min(position.y, window.innerHeight - 400),
  };

  // Filter folders that don't already contain this media
  const availableFolders = folders.filter(folder => 
    !folder.mediaItems.some(item => item.id === mediaId)
  );

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 ${themeClasses.bg} border rounded-2xl shadow-2xl p-4 min-w-[280px] max-w-[320px]`}
      style={menuStyle}
    >
      {!showCreateForm ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${themeClasses.text}`}>
              Add to Folder {isMultiSelectMode && selectedCount > 1 && `(${selectedCount} items)`}
            </h3>
            <button
              onClick={onClose}
              className={`p-1 rounded-lg ${themeClasses.hover} transition-colors`}
            >
              <X className={`w-4 h-4 ${themeClasses.subtext}`} />
            </button>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl ${themeClasses.hover} transition-all duration-200`}
          >
            <FolderPlus className={`w-5 h-5 ${themeClasses.text}`} />
            <span className={`${themeClasses.text} font-medium`}>Create New Folder</span>
          </button>

          {availableFolders.length > 0 && (
            <div className="border-t border-gray-200/20 pt-2 mt-2">
              <p className={`text-xs ${themeClasses.subtext} mb-2 px-1`}>
                Add to existing folder:
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {availableFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleAddToFolder(folder.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl ${themeClasses.hover} transition-all duration-200`}
                  >
                    <div className={`w-4 h-4 rounded-full ${folder.color}`} />
                    <span className={`${themeClasses.text} font-medium flex-1 text-left`}>
                      {folder.name}
                    </span>
                    <span className={`text-xs ${themeClasses.subtext}`}>
                      {folder.mediaItems.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableFolders.length === 0 && (
            <div className="text-center py-4">
              <Folder className={`w-8 h-8 ${themeClasses.subtext} mx-auto mb-2`} />
              <p className={`text-sm ${themeClasses.subtext}`}>
                No available folders. Create one to get started!
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${themeClasses.text}`}>Create Folder</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className={`p-1 rounded-lg ${themeClasses.hover} transition-colors`}
            >
              <X className={`w-4 h-4 ${themeClasses.subtext}`} />
            </button>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Folder Name
            </label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g., Ariana Grande"
              className={`w-full px-3 py-2 rounded-xl ${themeClasses.input} border focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition-all duration-200`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                }
              }}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {folderColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full ${color.value} border-2 transition-all duration-200 ${
                    selectedColor.name === color.name 
                      ? 'border-white shadow-lg scale-110' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowCreateForm(false)}
              className={`flex-1 px-4 py-2 rounded-xl ${themeClasses.secondaryButton} transition-all duration-200`}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className={`flex-1 px-4 py-2 rounded-xl ${themeClasses.button} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}