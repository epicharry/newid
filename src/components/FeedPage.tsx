import React, { useState, useEffect } from 'react';
import { MediaItem, RedditSortType, SubredditInfo } from '../types/app';
import { redditApi } from '../services/redditApi';
import { MediaGrid } from './MediaGrid';
import { AlertCircle, RefreshCw, Rss, Grid, List, ExternalLink, Flame, Clock, Award, TrendingUp, Zap } from 'lucide-react';

interface FeedPageProps {
  favoriteSubreddits: string[];
  theme: 'light' | 'dark' | 'off';
  onSubredditSelect: (subreddit: string) => void;
  onItemClick: (item: MediaItem, index: number) => void;
  folders: any[];
  onAddToFolder: (folderId: string, mediaId: string) => void;
  onCreateFolder: (name: string, color: string, mediaId: string) => void;
  selectedMediaIds: Set<string>;
  onMediaSelect: (mediaId: string, ctrlKey: boolean) => void;
  isMultiSelectMode: boolean;
  onFeedMediaUpdate: (items: MediaItem[]) => void;
}

interface SubredditSection {
  subreddit: string;
  items: MediaItem[];
  isLoading: boolean;
  error: string | null;
  nextPageToken: string | null;
  hasMore: boolean;
  sort: RedditSortType;
  info: SubredditInfo | null;
}

export function FeedPage({
  favoriteSubreddits,
  theme,
  onSubredditSelect,
  onItemClick,
  folders,
  onAddToFolder,
  onCreateFolder,
  selectedMediaIds,
  onMediaSelect,
  isMultiSelectMode,
  onFeedMediaUpdate
}: FeedPageProps) {
  const [viewMode, setViewMode] = useState<'mixed' | 'separated'>('mixed');
  const [mixedFeed, setMixedFeed] = useState<MediaItem[]>([]);
  const [mixedSort, setMixedSort] = useState<RedditSortType>('hot');
  const [mixedLoading, setMixedLoading] = useState(false);
  const [mixedError, setMixedError] = useState<string | null>(null);
  const [mixedNextPage, setMixedNextPage] = useState<string | null>(null);
  const [mixedHasMore, setMixedHasMore] = useState(true);
  
  const [separatedSections, setSeparatedSections] = useState<SubredditSection[]>([]);

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-gradient-to-br from-pink-50 via-white to-rose-50',
          card: 'bg-white/70 backdrop-blur-xl border-white/20',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          button: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
          secondaryButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          activeButton: 'bg-pink-500 text-white',
          inactiveButton: 'text-gray-600 hover:text-pink-600 hover:bg-pink-50',
        };
      case 'dark':
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-pink-900/20',
          card: 'bg-gray-800/70 backdrop-blur-xl border-gray-700/20',
          text: 'text-white',
          subtext: 'text-gray-300',
          button: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700',
          secondaryButton: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
          activeButton: 'bg-pink-600 text-white',
          inactiveButton: 'text-gray-400 hover:text-pink-400 hover:bg-gray-700',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 via-gray-50 to-pink-50',
          card: 'bg-gray-50/70 backdrop-blur-xl border-gray-200/20',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          button: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
          secondaryButton: 'bg-gray-200 hover:bg-gray-300 text-gray-600',
          activeButton: 'bg-pink-500 text-white',
          inactiveButton: 'text-gray-500 hover:text-pink-500 hover:bg-gray-100',
        };
    }
  };

  const themeClasses = getThemeClasses();

  const sortOptions = [
    { id: 'hot' as RedditSortType, name: 'Hot', icon: Flame },
    { id: 'new' as RedditSortType, name: 'New', icon: Clock },
    { id: 'top' as RedditSortType, name: 'Top', icon: Award },
    { id: 'best' as RedditSortType, name: 'Best', icon: TrendingUp },
    { id: 'rising' as RedditSortType, name: 'Rising', icon: Zap },
  ];

  // Initialize separated sections
  useEffect(() => {
    if (viewMode === 'separated') {
      const sections: SubredditSection[] = favoriteSubreddits.map(subreddit => ({
        subreddit,
        items: [],
        isLoading: false,
        error: null,
        nextPageToken: null,
        hasMore: true,
        sort: 'hot',
        info: null,
      }));
      setSeparatedSections(sections);
      
      // Load initial content for each section
      sections.forEach((_, index) => {
        loadSeparatedSection(index, true);
      });
    }
  }, [viewMode, favoriteSubreddits]);

  // Load mixed feed
  const loadMixedFeed = async (isNewLoad = false) => {
    if (favoriteSubreddits.length === 0) return;
    
    try {
      setMixedLoading(true);
      setMixedError(null);
      
      const combinedSubreddit = favoriteSubreddits.join('+');
      const after = isNewLoad ? undefined : mixedNextPage;
      const result = await redditApi.fetchSubreddit(combinedSubreddit, mixedSort, after);
      
      if (isNewLoad) {
        setMixedFeed(result.items);
      } else {
        setMixedFeed(prev => [...prev, ...result.items]);
      }
      
      setMixedNextPage(result.nextPage);
      setMixedHasMore(!!result.nextPage);
      
      // Update parent with feed media items
      const newItems = isNewLoad ? result.items : [...mixedFeed, ...result.items];
      onFeedMediaUpdate(newItems);
      
    } catch (err) {
      setMixedError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setMixedLoading(false);
    }
  };

  // Load separated section
  const loadSeparatedSection = async (sectionIndex: number, isNewLoad = false) => {
    const section = separatedSections[sectionIndex];
    if (!section || (!isNewLoad && section.isLoading)) return;
    
    setSeparatedSections(prev => prev.map((s, i) => 
      i === sectionIndex ? { ...s, isLoading: true, error: null } : s
    ));
    
    try {
      const after = isNewLoad ? undefined : section.nextPageToken;
      const result = await redditApi.fetchSubreddit(section.subreddit, section.sort, after);
      
      // Load subreddit info if not already loaded
      if (!section.info) {
        const info = await redditApi.fetchSubredditInfo(section.subreddit);
        setSeparatedSections(prev => prev.map((s, i) => 
          i === sectionIndex ? { ...s, info } : s
        ));
      }
      
      setSeparatedSections(prev => prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        
        return {
          ...s,
          items: isNewLoad ? result.items : [...s.items, ...result.items],
          nextPageToken: result.nextPage,
          hasMore: !!result.nextPage,
          isLoading: false,
        };
      }));
      
      // Update parent with all separated section items
      const allSeparatedItems = separatedSections.reduce((acc, section) => {
        return [...acc, ...section.items];
      }, [] as MediaItem[]);
      onFeedMediaUpdate(allSeparatedItems);
      
    } catch (err) {
      setSeparatedSections(prev => prev.map((s, i) => 
        i === sectionIndex ? { 
          ...s, 
          isLoading: false, 
          error: err instanceof Error ? err.message : 'Failed to load content' 
        } : s
      ));
    }
  };

  // Handle mixed sort change
  const handleMixedSortChange = (sort: RedditSortType) => {
    setMixedSort(sort);
    setMixedFeed([]);
    setMixedNextPage(null);
    setMixedHasMore(true);
  };

  // Handle separated sort change
  const handleSeparatedSortChange = (sectionIndex: number, sort: RedditSortType) => {
    setSeparatedSections(prev => prev.map((s, i) => 
      i === sectionIndex ? { 
        ...s, 
        sort, 
        items: [], 
        nextPageToken: null, 
        hasMore: true 
      } : s
    ));
  };

  // Load initial mixed feed
  useEffect(() => {
    if (viewMode === 'mixed' && favoriteSubreddits.length > 0) {
      loadMixedFeed(true);
    }
  }, [viewMode, favoriteSubreddits, mixedSort]);

  // No favorites state
  if (favoriteSubreddits.length === 0) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center p-6`}>
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Rss className={`w-16 h-16 ${themeClasses.subtext}`} />
          </div>
          <h2 className={`text-2xl font-bold ${themeClasses.text} mb-3`}>
            No Favorite Subreddits
          </h2>
          <p className={`${themeClasses.subtext} leading-relaxed mb-6`}>
            Add some subreddits to your favorites to see a personalized feed here. Browse subreddits and click the star icon to add them to your favorites.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg}`}>
      <div className="p-6">
        {/* Feed Header */}
        <div className={`${themeClasses.card} border rounded-2xl p-6 mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Rss className={`w-8 h-8 ${themeClasses.text}`} />
              <div>
                <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
                  Your Feed
                </h1>
                <p className={`${themeClasses.subtext}`}>
                  {favoriteSubreddits.length} favorite subreddit{favoriteSubreddits.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* View Mode Toggle */}
            <div className={`${themeClasses.card} border rounded-2xl p-1 flex gap-1`}>
              <button
                onClick={() => setViewMode('mixed')}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  viewMode === 'mixed' ? themeClasses.activeButton : themeClasses.inactiveButton
                }`}
                title="Mixed View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('separated')}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  viewMode === 'separated' ? themeClasses.activeButton : themeClasses.inactiveButton
                }`}
                title="Separated View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mixed View Controls */}
          {viewMode === 'mixed' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${themeClasses.subtext}`}>Sort:</span>
                <div className={`${themeClasses.card} border rounded-xl p-1 flex gap-1`}>
                  {sortOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = mixedSort === option.id;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleMixedSortChange(option.id)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? 'bg-pink-500 text-white' 
                            : themeClasses.inactiveButton
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <button
                onClick={() => loadMixedFeed(true)}
                disabled={mixedLoading}
                className={`${themeClasses.secondaryButton} px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2`}
              >
                <RefreshCw className={`w-4 h-4 ${mixedLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* Mixed View Content */}
        {viewMode === 'mixed' && (
          <>
            {mixedError ? (
              <div className="flex items-center justify-center min-h-[60vh] p-6">
                <div className={`${themeClasses.card} border rounded-2xl p-8 max-w-md w-full text-center`}>
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h2 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>Error Loading Feed</h2>
                  <p className={`${themeClasses.subtext} mb-6`}>{mixedError}</p>
                  <button
                    onClick={() => loadMixedFeed(true)}
                    className={`${themeClasses.button} text-white px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <MediaGrid
                items={mixedFeed}
               onItemClick={(item, index) => {
                 // Set the media items to this section's items for the viewer
                 onItemClick(item, index);
               }}
                isLoading={mixedLoading}
                theme={theme}
                onLoadMore={() => loadMixedFeed(false)}
                hasMore={mixedHasMore}
                folders={folders}
                onAddToFolder={onAddToFolder}
                onCreateFolder={onCreateFolder}
                allMediaItems={mixedFeed}
                selectedMediaIds={selectedMediaIds}
                onMediaSelect={onMediaSelect}
                isMultiSelectMode={isMultiSelectMode}
              />
            )}
          </>
        )}

        {/* Separated View Content */}
        {viewMode === 'separated' && (
          <div className="space-y-8">
            {separatedSections.map((section, index) => (
              <div key={section.subreddit} className={`${themeClasses.card} border rounded-2xl p-6`}>
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {section.info?.icon && (
                      <img 
                        src={section.info.icon} 
                        alt={`r/${section.subreddit}`}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                        r/{section.subreddit}
                      </h2>
                      {section.info?.subscribers && (
                        <p className={`text-sm ${themeClasses.subtext}`}>
                          {section.info.subscribers.toLocaleString()} members
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSubredditSelect(section.subreddit)}
                      className={`${themeClasses.secondaryButton} px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </button>
                    <button
                      onClick={() => loadSeparatedSection(index, true)}
                      disabled={section.isLoading}
                      className={`${themeClasses.secondaryButton} px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm`}
                    >
                      <RefreshCw className={`w-4 h-4 ${section.isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Section Controls */}
                <div className="flex items-center gap-2 mb-6">
                  <span className={`text-sm ${themeClasses.subtext}`}>Sort:</span>
                  <div className={`${themeClasses.card} border rounded-xl p-1 flex gap-1`}>
                    {sortOptions.map((option) => {
                      const Icon = option.icon;
                      const isActive = section.sort === option.id;
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            handleSeparatedSortChange(index, option.id);
                            setTimeout(() => loadSeparatedSection(index, true), 100);
                          }}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isActive 
                              ? 'bg-pink-500 text-white' 
                              : themeClasses.inactiveButton
                          }`}
                          title={option.name}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section Content */}
                {section.error ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                    <p className={`${themeClasses.subtext} mb-4`}>{section.error}</p>
                    <button
                      onClick={() => loadSeparatedSection(index, true)}
                      className={`${themeClasses.button} text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                  </div>
                ) : section.items.length > 0 ? (
                 <MediaGrid
                   items={section.items}
                   onItemClick={(item, itemIndex) => {
                     // Set the media items to this section's items for the viewer
                     onItemClick(item, itemIndex);
                   }}
                   isLoading={section.isLoading}
                   theme={theme}
                   onLoadMore={() => loadSeparatedSection(index, false)}
                   hasMore={section.hasMore}
                   folders={folders}
                   onAddToFolder={onAddToFolder}
                   onCreateFolder={onCreateFolder}
                   allMediaItems={section.items}
                   selectedMediaIds={selectedMediaIds}
                   onMediaSelect={onMediaSelect}
                   isMultiSelectMode={isMultiSelectMode}
                 />
                ) : section.isLoading ? (
                 <MediaGrid
                   items={[]}
                   onItemClick={onItemClick}
                   isLoading={true}
                   theme={theme}
                   folders={folders}
                   onAddToFolder={onAddToFolder}
                   onCreateFolder={onCreateFolder}
                   allMediaItems={[]}
                   selectedMediaIds={selectedMediaIds}
                   onMediaSelect={onMediaSelect}
                   isMultiSelectMode={isMultiSelectMode}
                 />
                ) : (
                  <div className="text-center py-8">
                    <p className={`${themeClasses.subtext}`}>
                      No content found for r/{section.subreddit}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}