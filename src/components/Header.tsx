import React from 'react';
import { ArrowLeft, Star, Heart, Sparkles, Flame, Clock, Award, TrendingUp, Zap, Image, Video, Images, Folder, Shield, Search, X, Globe, User, LogOut } from 'lucide-react';
import { Rss } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeMode, MediaSource, SubredditInfo, RedditSortType, MediaFilter } from '../types/app';
import { UserProfile } from '../lib/supabase';

interface HeaderProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onBack?: () => void;
  currentSource?: MediaSource;
  currentSubreddit?: string;
  currentTags?: string;
  currentPerson?: string;
  currentSearchQuery?: string;
  isSearchMode?: boolean;
  subredditInfo?: SubredditInfo;
  currentSort?: RedditSortType;
  showFavorites?: boolean;
  onToggleFavorites?: () => void;
  favoriteCount?: number;
  favoriteSubreddits?: string[];
  onToggleFavoriteSubreddit?: (subreddit: string) => void;
  onSortChange?: (sort: RedditSortType) => void;
  mediaFilter?: MediaFilter;
  onMediaFilterChange?: (filter: MediaFilter) => void;
  onShowFolders?: () => void;
  folderCount?: number;
  showFeed?: boolean;
  onShowFeed?: () => void;
  favoriteSubredditsCount?: number;
  onSubredditSearch?: (query: string) => void;
  currentSearchSort?: string;
  onSearchSortChange?: (sort: string) => void;
  onSearchAllReddit?: (query: string) => void;
  showGlobalSearch?: boolean;
  user?: UserProfile | null;
  onShowAuth?: () => void;
  onSignOut?: () => void;
  isSyncing?: boolean;
}

export function Header({ 
  theme, 
  onThemeChange, 
  onBack, 
  currentSource,
  currentSubreddit,
  currentTags,
  currentPerson,
  currentSearchQuery,
  isSearchMode,
  subredditInfo,
  currentSort,
  showFavorites,
  onToggleFavorites,
  favoriteCount = 0,
  favoriteSubreddits = [],
  onToggleFavoriteSubreddit,
  onSortChange,
  mediaFilter = 'all',
  onMediaFilterChange,
  onShowFolders,
  folderCount = 0,
  showFeed,
  onShowFeed,
  favoriteSubredditsCount = 0,
  onSubredditSearch,
  currentSearchSort = 'relevance',
  onSearchSortChange,
  onSearchAllReddit,
  showGlobalSearch = false,
  user,
  onShowAuth,
  onSignOut,
  isSyncing = false
}: HeaderProps) {
  const [showSearchInput, setShowSearchInput] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showGlobalSearchInput, setShowGlobalSearchInput] = React.useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = React.useState('');

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-white/70 backdrop-blur-xl border-white/20',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          button: 'text-gray-600 hover:text-pink-600 hover:bg-pink-50',
          badge: 'bg-pink-100 text-pink-600',
          filterButton: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50',
          activeFilterButton: 'bg-blue-500 text-white',
          searchInput: 'bg-white/90 border-gray-200 focus:border-blue-400',
        };
      case 'dark':
        return {
          bg: 'bg-gray-800/70 backdrop-blur-xl border-gray-700/20',
          text: 'text-white',
          subtext: 'text-gray-300',
          button: 'text-gray-400 hover:text-pink-400 hover:bg-gray-700',
          badge: 'bg-pink-600 text-white',
          filterButton: 'text-gray-400 hover:text-blue-400 hover:bg-gray-700',
          activeFilterButton: 'bg-blue-500 text-white',
          searchInput: 'bg-gray-700/90 border-gray-600 focus:border-blue-400 text-white',
        };
      default:
        return {
          bg: 'bg-gray-50/70 backdrop-blur-xl border-gray-200/20',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          button: 'text-gray-500 hover:text-pink-500 hover:bg-gray-100',
          badge: 'bg-pink-200 text-pink-700',
          filterButton: 'text-gray-500 hover:text-blue-500 hover:bg-gray-100',
          activeFilterButton: 'bg-blue-500 text-white',
          searchInput: 'bg-gray-100/90 border-gray-300 focus:border-blue-400',
        };
    }
  };

  const sortOptions = [
    { id: 'hot' as RedditSortType, name: 'Hot', icon: Flame },
    { id: 'new' as RedditSortType, name: 'New', icon: Clock },
    { id: 'top' as RedditSortType, name: 'Top', icon: Award },
    { id: 'best' as RedditSortType, name: 'Best', icon: TrendingUp },
    { id: 'rising' as RedditSortType, name: 'Rising', icon: Zap },
  ];

  const searchSortOptions = [
    { id: 'relevance', name: 'Relevance', icon: TrendingUp, description: 'Most relevant results' },
    { id: 'hot', name: 'Hot', icon: Flame, description: 'Popular right now' },
    { id: 'top', name: 'Top', icon: Award, description: 'Highest rated' },
    { id: 'new', name: 'New', icon: Clock, description: 'Latest posts' },
  ];

  const mediaFilterOptions = [
    { id: 'all' as MediaFilter, name: 'All', icon: Sparkles },
    { id: 'images' as MediaFilter, name: 'Images', icon: Image },
    { id: 'videos' as MediaFilter, name: 'Videos', icon: Video },
    { id: 'galleries' as MediaFilter, name: 'Galleries', icon: Images },
  ];

  const themeClasses = getThemeClasses();
  const isSubredditFavorited = currentSubreddit && favoriteSubreddits.includes(currentSubreddit);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSubredditSearch) {
      onSubredditSearch(searchQuery.trim());
      setShowSearchInput(false);
      setSearchQuery('');
    }
  };

  const handleSearchToggle = () => {
    setShowSearchInput(!showSearchInput);
    if (showSearchInput) {
      setSearchQuery('');
    }
  };

  const handleGlobalSearchToggle = () => {
    setShowGlobalSearchInput(!showGlobalSearchInput);
    if (showGlobalSearchInput) {
      setGlobalSearchQuery('');
    }
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearchQuery.trim() && onSearchAllReddit) {
      onSearchAllReddit(globalSearchQuery.trim());
      setShowGlobalSearchInput(false);
      setGlobalSearchQuery('');
    }
  };
  return (
    <header className={`sticky top-0 z-40 ${themeClasses.bg} border-b p-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-xl ${themeClasses.button} transition-all duration-200`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-3">
            {/* User Section */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${themeClasses.bg} border rounded-xl px-3 py-2`}>
                  <User className={`w-4 h-4 ${themeClasses.text}`} />
                  <span className={`text-sm font-medium ${themeClasses.text}`}>
                    {user.username}
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Permanently logged in" />
                  {isSyncing && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-pink-500" />
                  )}
                </div>
                <button
                  onClick={onSignOut}
                  className={`p-2 rounded-xl ${themeClasses.button} transition-all duration-200 hover:scale-110`}
                  title="Sign Out (This will end your permanent session)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onShowAuth}
                className={`flex items-center gap-2 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white border rounded-xl px-4 py-2 transition-all duration-200 hover:scale-105`}
                title="Sign In / Sign Up"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Sign In</span>
              </button>
            )}

            <Sparkles className={`w-8 h-8 ${themeClasses.text}`} />
            <div>
              <h1 className={`text-xl font-bold ${themeClasses.text}`}>
                MediaVault
              </h1>
              {currentSource && (
                <div className="flex items-center gap-2">
                  {subredditInfo?.icon && (
                    <img 
                      src={subredditInfo.icon} 
                      alt={`r/${currentSubreddit}`}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <span className={`${themeClasses.badge} px-2 py-1 rounded-full text-xs font-medium`}>
                    {currentSource === 'rule34' ? 'Rule34' : currentSource.charAt(0).toUpperCase() + currentSource.slice(1)}
                  </span>
                  {isSearchMode && currentSearchQuery && (
                    <span className={`bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium`}>
                      {currentSubreddit ? `Search: "${currentSearchQuery}"` : `Global Search: "${currentSearchQuery}"`}
                    </span>
                  )}
                  {currentSubreddit && (
                    <span className={`${themeClasses.subtext} text-sm`}>
                      {currentSubreddit.includes('+') ? (
                        <span title={`r/${currentSubreddit.split('+').join(', r/')}`}>
                          r/{currentSubreddit.split('+')[0]}+{currentSubreddit.split('+').length - 1} more
                        </span>
                      ) : (
                        `r/${currentSubreddit}`
                      )}
                    </span>
                  )}
                  {currentTags && (
                    <span className={`${themeClasses.subtext} text-sm`}>
                      {currentTags}
                    </span>
                  )}
                  {currentPerson && (
                    <span className={`${themeClasses.subtext} text-sm`}>
                      {currentPerson}
                    </span>
                  )}
                  {currentSort && (
                    <span className={`${themeClasses.subtext} text-xs`}>
                      • {currentSort.charAt(0).toUpperCase() + currentSort.slice(1)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Subreddit Search Input */}
          {showSearchInput && currentSubreddit && onSubredditSearch && (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search r/${currentSubreddit}...`}
                  className={`w-48 px-3 py-2 rounded-xl ${themeClasses.searchInput} border focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 text-sm`}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className={`p-2 rounded-xl ${themeClasses.button} transition-all duration-200 disabled:opacity-50`}
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Global Search Input */}
          {showGlobalSearchInput && showGlobalSearch && onSearchAllReddit && (
            <form onSubmit={handleGlobalSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  placeholder="Search all Reddit..."
                  className={`w-48 px-3 py-2 rounded-xl ${themeClasses.searchInput} border focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 text-sm`}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!globalSearchQuery.trim()}
                className={`p-2 rounded-xl ${themeClasses.button} transition-all duration-200 disabled:opacity-50`}
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Media Filter Options - only show when viewing a subreddit */}
          {(currentSubreddit || currentTags) && onMediaFilterChange && (
            <div className={`${themeClasses.bg} border rounded-2xl p-1 flex gap-1`}>
              {mediaFilterOptions.map((option) => {
                const Icon = option.icon;
                const isActive = mediaFilter === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => onMediaFilterChange(option.id)}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? themeClasses.activeFilterButton
                        : themeClasses.filterButton
                    }`}
                    title={option.name}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Sort Options - only show when viewing a subreddit */}
          {currentSubreddit && onSortChange && !isSearchMode && (
            <div className={`${themeClasses.bg} border rounded-2xl p-1 flex gap-1`}>
              {sortOptions.map((option) => {
                const Icon = option.icon;
                const isActive = currentSort === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => onSortChange(option.id)}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-pink-500 text-white' 
                        : `${themeClasses.button}`
                    }`}
                    title={option.name}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Sort Options - only show when in search mode */}
          {isSearchMode && !currentSubreddit && onSearchSortChange && (
            <div className={`${themeClasses.bg} border rounded-2xl p-1 flex gap-1`}>
              <Globe className={`w-4 h-4 ${themeClasses.subtext} mr-2 self-center`} />
              {searchSortOptions.map((option) => {
                const Icon = option.icon;
                const isActive = currentSearchSort === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => onSearchSortChange(option.id)}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-500 text-white' 
                        : `${themeClasses.button}`
                    }`}
                    title={option.description}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Global Search Button - only show on Choose a Subreddit page */}
          {showGlobalSearch && onSearchAllReddit && (
            <button
              onClick={handleGlobalSearchToggle}
              className={`p-2 rounded-xl ${themeClasses.button} transition-all duration-200 hover:scale-110`}
              title={showGlobalSearchInput ? 'Cancel search' : 'Search all Reddit'}
            >
              {showGlobalSearchInput ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          )}

          {/* Subreddit Search Button - only show when viewing a subreddit */}
          {currentSubreddit && onSubredditSearch && (
            <button
              onClick={handleSearchToggle}
              className={`p-2 rounded-xl ${themeClasses.button} transition-all duration-200 hover:scale-110`}
              title={showSearchInput ? 'Cancel search' : `Search r/${currentSubreddit}`}
            >
              {showSearchInput ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          )}
          {/* Favorite Subreddit Button - only show when viewing a subreddit */}
          {currentSubreddit && onToggleFavoriteSubreddit && (
            <button
              onClick={() => onToggleFavoriteSubreddit(currentSubreddit)}
              className={`p-2 rounded-xl ${themeClasses.button} transition-all duration-200 hover:scale-110`}
              title={isSubredditFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-5 h-5 ${isSubredditFavorited ? 'fill-current text-yellow-500' : ''}`} />
            </button>
          )}

          {onShowFeed && favoriteSubredditsCount > 0 && (
            <button
              onClick={onShowFeed}
              className={`p-2 rounded-xl ${themeClasses.button} transition-all duration-200 relative`}
            >
              <Rss className={`w-5 h-5 ${showFeed ? 'text-pink-500' : ''}`} />
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {favoriteSubredditsCount > 99 ? '99+' : favoriteSubredditsCount}
              </span>
            </button>
          )}

          {onShowFolders && (
            <button
              onClick={onShowFolders}
              className={`p-2 rounded-xl ${themeClasses.button} transition-all duration-200 relative`}
            >
              <Folder className="w-5 h-5" />
              {folderCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {folderCount > 99 ? '99+' : folderCount}
                </span>
              )}
            </button>
          )}

          {onToggleFavorites && (
            <button
              onClick={onToggleFavorites}
              className={`p-2 rounded-xl ${themeClasses.button} transition-all duration-200 relative`}
            >
              <Heart className={`w-5 h-5 ${showFavorites ? 'fill-current text-pink-500' : ''}`} />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {favoriteCount > 99 ? '99+' : favoriteCount}
                </span>
              )}
            </button>
          )}
          
          <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
        </div>
      </div>
    </header>
  );
}