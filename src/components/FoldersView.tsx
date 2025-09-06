import React, { useState } from 'react';
import { MediaItem, MediaFolder, ContextMenuPosition } from '../types/app';
import { MediaGrid } from './MediaGrid';
import { Folder, FolderOpen, Edit2, Trash2, ArrowLeft, Plus, Check, X, Play, Images, MoreVertical, Trash, ImageIcon } from 'lucide-react';

interface FoldersViewProps {
  folders: MediaFolder[];
  mediaItems: MediaItem[];
  onItemClick: (item: MediaItem, index: number) => void;
  onCreateFolder: (name: string, color: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onRemoveFromFolder: (folderId: string, mediaId: string) => void;
  onSetFolderThumbnail: (folderId: string, thumbnailUrl: string) => void;
  theme: 'light' | 'dark' | 'off';
  selectedFolderId?: string;
  onFolderSelect: (folderId: string | null) => void;
}

interface FolderMediaGridProps {
  items: MediaItem[];
  onItemClick: (item: MediaItem, index: number) => void;
  onRemoveFromFolder: (mediaId: string) => void;
  onSetAsThumbnail: (mediaId: string) => void;
  theme: 'light' | 'dark' | 'off';
}

function FolderMediaGrid({ items, onItemClick, onRemoveFromFolder, onSetAsThumbnail, theme }: FolderMediaGridProps) {
  const [contextMenu, setContextMenu] = useState<{
    position: ContextMenuPosition;
    mediaId: string;
  } | null>(null);

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-gradient-to-br from-pink-50 via-white to-rose-50',
          card: 'bg-white/70 backdrop-blur-sm border-white/20 hover:bg-white/80',
          overlay: 'bg-black/20 group-hover:bg-black/40',
          contextMenu: 'bg-white/95 backdrop-blur-xl border-white/20',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          hover: 'hover:bg-gray-50',
        };
      case 'dark':
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-pink-900/20',
          card: 'bg-gray-800/70 backdrop-blur-sm border-gray-700/20 hover:bg-gray-700/80',
          overlay: 'bg-black/30 group-hover:bg-black/50',
          contextMenu: 'bg-gray-800/95 backdrop-blur-xl border-gray-700/20',
          text: 'text-white',
          subtext: 'text-gray-300',
          hover: 'hover:bg-gray-700',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 via-gray-50 to-pink-50',
          card: 'bg-gray-50/70 backdrop-blur-sm border-gray-200/20 hover:bg-gray-100/80',
          overlay: 'bg-black/20 group-hover:bg-black/40',
          contextMenu: 'bg-gray-50/95 backdrop-blur-xl border-gray-200/20',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          hover: 'hover:bg-gray-100',
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

  return (
    <div className="relative">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="group cursor-pointer transition-all duration-300 hover:scale-105 break-inside-avoid mb-4"
            onClick={() => onItemClick(item, index)}
            onContextMenu={(e) => handleContextMenu(e, item.id)}
          >
            <div className={`relative ${themeClasses.card} border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300`}>
              <img
                src={item.thumbnail || item.url}
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== item.url && item.url) {
                    target.src = item.url;
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
              
              <div className={`absolute inset-0 ${themeClasses.overlay} transition-all duration-300`} />
              
              <div className="absolute top-3 right-3">
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

      {/* Context Menu for Folder Media */}
      {contextMenu && (
        <div
          className={`fixed z-50 ${themeClasses.contextMenu} border rounded-2xl shadow-2xl p-4 min-w-[200px]`}
          style={{
            left: Math.min(contextMenu.position.x, window.innerWidth - 220),
            top: Math.min(contextMenu.position.y, window.innerHeight - 200),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <button
              onClick={() => {
                onSetAsThumbnail(contextMenu.mediaId);
                handleCloseContextMenu();
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl ${themeClasses.hover} transition-all duration-200`}
            >
              <ImageIcon className={`w-5 h-5 ${themeClasses.text}`} />
              <span className={`${themeClasses.text} font-medium`}>Set as Thumbnail</span>
            </button>
            
            <button
              onClick={() => {
                onRemoveFromFolder(contextMenu.mediaId);
                handleCloseContextMenu();
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-600 transition-all duration-200`}
            >
              <Trash className="w-5 h-5" />
              <span className="font-medium">Remove from Folder</span>
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close context menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleCloseContextMenu}
        />
      )}
    </div>
  );
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

export function FoldersView({
  folders,
  mediaItems,
  onItemClick,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onRemoveFromFolder,
  onSetFolderThumbnail,
  theme,
  selectedFolderId,
  onFolderSelect
}: FoldersViewProps) {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(folderColors[0]);

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-gradient-to-br from-pink-50 via-white to-rose-50',
          card: 'bg-white/70 backdrop-blur-xl border-white/20 hover:bg-white/80',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          button: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
          secondaryButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          input: 'bg-white border-gray-200 focus:border-pink-400',
        };
      case 'dark':
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-pink-900/20',
          card: 'bg-gray-800/70 backdrop-blur-xl border-gray-700/20 hover:bg-gray-700/80',
          text: 'text-white',
          subtext: 'text-gray-300',
          button: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700',
          secondaryButton: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
          input: 'bg-gray-700 border-gray-600 focus:border-pink-400 text-white',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 via-gray-50 to-pink-50',
          card: 'bg-gray-50/70 backdrop-blur-xl border-gray-200/20 hover:bg-gray-100/80',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          button: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
          secondaryButton: 'bg-gray-200 hover:bg-gray-300 text-gray-600',
          input: 'bg-gray-100 border-gray-300 focus:border-pink-400',
        };
    }
  };

  const themeClasses = getThemeClasses();

  const handleStartEdit = (folder: MediaFolder) => {
    setEditingFolderId(folder.id);
    setEditingName(folder.name);
  };

  const handleSaveEdit = () => {
    if (editingFolderId && editingName.trim()) {
      onRenameFolder(editingFolderId, editingName.trim());
      setEditingFolderId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingFolderId(null);
    setEditingName('');
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), selectedColor.value);
      setNewFolderName('');
      setSelectedColor(folderColors[0]);
      setShowCreateForm(false);
    }
  };

  const getFolderMediaItems = (folder: MediaFolder) => {
    return folder.mediaItems || [];
  };

  const getPreviewImage = (folder: MediaFolder) => {
    // Use custom thumbnail if set
    if (folder.customThumbnail) {
      return folder.customThumbnail;
    }
    
    // Otherwise use first media item
    const folderItems = getFolderMediaItems(folder);
    return folderItems[0]?.thumbnail || folderItems[0]?.url;
  };

  // If viewing a specific folder
  if (selectedFolderId) {
    const selectedFolder = folders.find(f => f.id === selectedFolderId);
    if (!selectedFolder) {
      onFolderSelect(null);
      return null;
    }

    const folderMediaItems = getFolderMediaItems(selectedFolder);

    return (
      <div className={`min-h-screen ${themeClasses.bg}`}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => onFolderSelect(null)}
              className={`p-2 rounded-xl ${themeClasses.secondaryButton} transition-all duration-200`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`w-8 h-8 rounded-full ${selectedFolder.color}`} />
            <div>
              <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
                {selectedFolder.name}
              </h1>
              <p className={`${themeClasses.subtext}`}>
                {folderMediaItems.length} items
              </p>
            </div>
          </div>

          {folderMediaItems.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className={`${themeClasses.subtext}`}>
                  Right-click on items to remove them or set as folder thumbnail
                </p>
              </div>
              <FolderMediaGrid
                items={folderMediaItems}
                onItemClick={onItemClick}
                onRemoveFromFolder={(mediaId) => onRemoveFromFolder(selectedFolder.id, mediaId)}
                onSetAsThumbnail={(mediaId) => {
                  const mediaItem = folderMediaItems.find(item => item.id === mediaId);
                  if (mediaItem) {
                    onSetFolderThumbnail(selectedFolder.id, mediaItem.thumbnail || mediaItem.url);
                  }
                }}
                theme={theme}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <FolderOpen className={`w-16 h-16 ${themeClasses.subtext} mx-auto mb-4`} />
                <h2 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
                  Empty Folder
                </h2>
                <p className={`${themeClasses.subtext}`}>
                  Right-click on media items to add them to this folder.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main folders view
  return (
    <div className={`min-h-screen ${themeClasses.bg} p-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>
              My Folders
            </h1>
            <p className={`${themeClasses.subtext}`}>
              Organize your media into custom folders
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className={`${themeClasses.button} text-white px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2`}
          >
            <Plus className="w-5 h-5" />
            New Folder
          </button>
        </div>

        {/* Create folder form */}
        {showCreateForm && (
          <div className={`${themeClasses.card} border rounded-2xl p-6 mb-8`}>
            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
              Create New Folder
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Ariana Grande"
                  className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} border focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition-all duration-200`}
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
                <div className="flex gap-2">
                  {folderColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full ${color.value} border-2 transition-all duration-200 ${
                        selectedColor.name === color.name 
                          ? 'border-white shadow-lg scale-110' 
                          : 'border-transparent hover:scale-105'
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className={`flex-1 px-4 py-3 rounded-xl ${themeClasses.secondaryButton} transition-all duration-200`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className={`flex-1 px-4 py-3 rounded-xl ${themeClasses.button} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
                >
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Folders grid */}
        {folders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {folders.map((folder) => {
              const folderItems = getFolderMediaItems(folder);
              const previewImage = getPreviewImage(folder);
              
              return (
                <div
                  key={folder.id}
                  className={`${themeClasses.card} border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl group cursor-pointer`}
                  onClick={() => onFolderSelect(folder.id)}
                >
                  {/* Preview image */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Folder className={`w-16 h-16 ${themeClasses.subtext}`} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all duration-300" />
                    <div className={`absolute top-3 left-3 w-6 h-6 rounded-full ${folder.color} border-2 border-white shadow-lg`} />
                  </div>

                  {/* Folder info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      {editingFolderId === folder.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className={`flex-1 px-2 py-1 rounded ${themeClasses.input} border text-sm`}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              handleSaveEdit();
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <h3 className={`font-semibold ${themeClasses.text} truncate flex-1`}>
                          {folder.name}
                        </h3>
                      )}
                      
                      <div className="flex items-center gap-1">
                        {editingFolderId === folder.id ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit();
                              }}
                              className={`p-1 rounded ${themeClasses.button} text-white`}
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                              className={`p-1 rounded ${themeClasses.secondaryButton}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(folder);
                              }}
                              className={`p-1 rounded transition-colors ${themeClasses.subtext} hover:${themeClasses.text}`}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete folder "${folder.name}"? This won't delete the media items.`)) {
                                  onDeleteFolder(folder.id);
                                }
                              }}
                              className={`p-1 rounded transition-colors text-red-400 hover:text-red-600`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm ${themeClasses.subtext}`}>
                      {folderItems.length} {folderItems.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="flex items-center justify-center mb-6">
                <Folder className={`w-16 h-16 ${themeClasses.subtext}`} />
              </div>
              <h2 className={`text-2xl font-bold ${themeClasses.text} mb-3`}>
                No Folders Yet
              </h2>
              <p className={`${themeClasses.subtext} leading-relaxed mb-6`}>
                Create folders to organize your media collection. Right-click on any media item to add it to a folder.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className={`${themeClasses.button} text-white px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto`}
              >
                <Plus className="w-5 h-5" />
                Create Your First Folder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}