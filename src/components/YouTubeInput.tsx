import React, { useState } from 'react';
import { Search, Youtube, Play, Clock, Eye, User, Plus, Check, Link, X, Trash2 } from 'lucide-react';
import { YouTubeVideo } from '../types/app';
import { youtubeApi } from '../services/youtubeApi';

interface YouTubeInputProps {
  onVideosSelect: (videos: YouTubeVideo[]) => void;
  theme: 'light' | 'dark' | 'off';
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  selectedVideos: YouTubeVideo[];
  onToggleVideo: (video: YouTubeVideo) => void;
}

export function YouTubeInput({ 
  onVideosSelect, 
  theme, 
  apiKey, 
  onApiKeyChange,
  selectedVideos,
  onToggleVideo
}: YouTubeInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-gradient-to-br from-pink-50 via-white to-rose-50',
          card: 'bg-white/70 backdrop-blur-xl border-white/20',
          input: 'bg-white/50 border-pink-200/50 focus:border-pink-400',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          button: 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600',
          secondaryButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          videoCard: 'bg-white/50 hover:bg-white/70 border-red-100/50',
          selectedCard: 'bg-red-50 border-red-300',
        };
      case 'dark':
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-red-900/20',
          card: 'bg-gray-800/70 backdrop-blur-xl border-gray-700/20',
          input: 'bg-gray-700/50 border-gray-600/50 focus:border-red-400',
          text: 'text-white',
          subtext: 'text-gray-300',
          button: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
          secondaryButton: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
          videoCard: 'bg-gray-700/50 hover:bg-gray-600/70 border-gray-600/50',
          selectedCard: 'bg-red-900/30 border-red-500',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 via-gray-50 to-red-50',
          card: 'bg-gray-50/70 backdrop-blur-xl border-gray-200/20',
          input: 'bg-gray-100/50 border-gray-300/50 focus:border-red-400',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          button: 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600',
          secondaryButton: 'bg-gray-200 hover:bg-gray-300 text-gray-600',
          videoCard: 'bg-gray-100/50 hover:bg-gray-200/70 border-gray-200/50',
          selectedCard: 'bg-red-50 border-red-300',
        };
    }
  };

  const themeClasses = getThemeClasses();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setNextPageToken(null);

    try {
      const result = await youtubeApi.searchVideos(searchQuery.trim(), apiKey);
      setSearchResults(result.videos);
      setNextPageToken(result.nextPageToken || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search videos');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken || isSearching) return;

    setIsSearching(true);
    try {
      const result = await youtubeApi.searchVideos(searchQuery.trim(), apiKey, 25, nextPageToken);
      setSearchResults(prev => [...prev, ...result.videos]);
      setNextPageToken(result.nextPageToken || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more videos');
    } finally {
      setIsSearching(false);
    }
  };

  const handleWatchSelected = () => {
    if (selectedVideos.length > 0) {
      onVideosSelect(selectedVideos);
    }
  };

  const isVideoSelected = (video: YouTubeVideo) => {
    return selectedVideos.some(v => v.id === video.id);
  };

  const handleRemoveVideo = (video: YouTubeVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleVideo(video); // This will remove it since it's already selected
  };

  const handleClearSelected = () => {
    // Remove all selected videos
    selectedVideos.forEach(video => onToggleVideo(video));
  };

  const extractVideoIdFromUrl = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleAddFromUrls = async () => {
    if (!urlInput.trim()) return;

    const urls = urlInput.split('\n').map(url => url.trim()).filter(url => url);
    const videoIds: string[] = [];
    
    for (const url of urls) {
      const videoId = extractVideoIdFromUrl(url);
      if (videoId) {
        videoIds.push(videoId);
      }
    }

    if (videoIds.length === 0) {
      setError('No valid YouTube URLs found');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Fetch video details for all video IDs
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${apiKey}`;
      const response = await fetch(detailsUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch video details');
      }

      const data = await response.json();
      
      const videos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high.url,
        duration: item.contentDetails.duration,
        publishedAt: item.snippet.publishedAt,
        description: item.snippet.description,
        viewCount: item.statistics.viewCount,
      }));

      // Add all videos to selection
      videos.forEach(video => {
        if (!isVideoSelected(video)) {
          onToggleVideo(video);
        }
      });

      setUrlInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add videos from URLs');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} p-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Youtube className={`w-12 h-12 ${themeClasses.text} mr-3`} />
            <h1 className={`text-3xl font-bold ${themeClasses.text}`}>
              YouTube Multi-Viewer
            </h1>
          </div>
          <p className={`${themeClasses.subtext} text-lg`}>
            Search and watch multiple YouTube videos simultaneously
          </p>
        </div>

        {/* API Key Input */}
        {/* Search Form */}
        <div className={`${themeClasses.card} border rounded-2xl p-6 mb-6`}>
          <div className="space-y-6">
            {/* Search by Query */}
            <form onSubmit={handleSearch} className="space-y-4">
              <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                Search Videos
              </h3>
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.subtext}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search YouTube videos..."
                  className={`w-full pl-12 pr-4 py-4 rounded-xl ${themeClasses.input} ${themeClasses.text} placeholder-gray-400 border focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all duration-200`}
                />
              </div>
              <button
                type="submit"
                disabled={!searchQuery.trim() || isSearching}
                className={`w-full py-3 px-6 rounded-xl ${themeClasses.button} text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2`}
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search Videos
                  </>
                )}
              </button>
            </form>

            {/* Add from URLs */}
            <div className="border-t border-gray-200/20 pt-6">
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
                Add from URLs
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <Link className={`absolute left-4 top-4 w-5 h-5 ${themeClasses.subtext}`} />
                  <textarea
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste YouTube URLs (one per line)&#10;https://www.youtube.com/watch?v=...&#10;https://youtu.be/..."
                    rows={4}
                    className={`w-full pl-12 pr-4 py-4 rounded-xl ${themeClasses.input} ${themeClasses.text} placeholder-gray-400 border focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all duration-200 resize-none`}
                  />
                </div>
                <button
                  onClick={handleAddFromUrls}
                  disabled={!urlInput.trim() || isSearching}
                  className={`w-full py-3 px-6 rounded-xl ${themeClasses.button} text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2`}
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Adding Videos...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Videos from URLs
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Selected Videos Counter */}
          {selectedVideos.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200/20">
              <div className="flex items-center justify-between mb-4">
                <span className={`${themeClasses.text} font-medium`}>
                  {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearSelected}
                    className={`${themeClasses.secondaryButton} px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                  <button
                    onClick={handleWatchSelected}
                    className={`${themeClasses.button} text-white px-6 py-2 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2`}
                  >
                    <Play className="w-4 h-4" />
                    Watch Selected
                  </button>
                </div>
              </div>
              
              {/* Selected Videos List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`${themeClasses.videoCard} border rounded-xl p-3 flex items-center gap-3`}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-16 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium ${themeClasses.text} text-sm truncate`}>
                        {video.title}
                      </h4>
                      <p className={`text-xs ${themeClasses.subtext} truncate`}>
                        {video.channelTitle} • {youtubeApi.formatDuration(video.duration)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleRemoveVideo(video, e)}
                      className={`p-1 rounded-lg ${themeClasses.subtext} hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0`}
                      title="Remove video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

            {/* Error Display */}
            {error && (
              <div className={`${themeClasses.card} border border-red-200 rounded-2xl p-6 mb-6`}>
                <div className="flex items-center gap-3 text-red-600">
                  <Search className="w-5 h-5" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className={`${themeClasses.card} border rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
                  Search Results
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((video) => {
                    const isSelected = isVideoSelected(video);
                    
                    return (
                      <div
                        key={video.id}
                        className={`${isSelected ? themeClasses.selectedCard : themeClasses.videoCard} border rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 group cursor-pointer`}
                        onClick={() => onToggleVideo(video)}
                      >
                        {/* Thumbnail */}
                        <div className="relative">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300" />
                          
                          {/* Duration */}
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                            {youtubeApi.formatDuration(video.duration)}
                          </div>
                          
                          {/* Selection indicator */}
                          <div className="absolute top-2 right-2">
                            {isSelected ? (
                              <div className="bg-red-500 text-white p-2 rounded-full shadow-lg">
                                <Check className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          
                          {/* Remove button for selected videos */}
                          {isSelected && (
                            <div className="absolute top-2 left-2">
                              <button
                                onClick={(e) => handleRemoveVideo(video, e)}
                                className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-colors"
                                title="Remove video"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="p-4">
                          <h4 className={`font-semibold ${themeClasses.text} line-clamp-2 mb-2`}>
                            {video.title}
                          </h4>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className={`w-3 h-3 ${themeClasses.subtext}`} />
                              <span className={`text-sm ${themeClasses.subtext} truncate`}>
                                {video.channelTitle}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Eye className={`w-3 h-3 ${themeClasses.subtext}`} />
                              <span className={`text-sm ${themeClasses.subtext}`}>
                                {youtubeApi.formatViewCount(video.viewCount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load More Button */}
                {nextPageToken && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleLoadMore}
                      disabled={isSearching}
                      className={`${themeClasses.secondaryButton} px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2`}
                    >
                      {isSearching ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                          Loading...
                        </>
                      ) : (
                        'Load More Videos'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* No results message */}
            {!isSearching && searchQuery && searchResults.length === 0 && !error && (
              <div className="text-center py-12">
                <Youtube className={`w-16 h-16 ${themeClasses.subtext} mx-auto mb-4`} />
                <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
                  No Videos Found
                </h3>
                <p className={`${themeClasses.subtext}`}>
                  Try searching with different keywords
                </p>
              </div>
            )}
      </div>
    </div>
  );
}