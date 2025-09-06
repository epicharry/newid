import React, { useState } from 'react';
import { Search, Star, Clock, TrendingUp, Flame, Award, Zap, Users, Folder, Globe, X, ArrowRight, Eye } from 'lucide-react';
import { RedditSortType } from '../types/app';
import { SubredditSearchResult } from '../types/app';
import { redditApi } from '../services/redditApi';

interface SubredditInputProps {
  onSubredditSelect: (subreddit: string) => void;
  favoriteSubreddits: string[];
  onToggleFavorite: (subreddit: string) => void;
  theme: 'light' | 'dark' | 'off';
  defaultSort: RedditSortType;
  onSortChange: (sort: RedditSortType) => void;
  onShowFolders?: () => void;
  folderCount?: number;
}

const popularSubreddits = [
  'earthporn', 'spaceporn', 'cityporn', 'architectureporn', 'carporn',
  'foodporn', 'animalporn', 'photographs', 'pics', 'itookapicture',
  'wallpapers', 'minimalism', 'art', 'photography', 'natureporn'
];

const searchSortOptions = [
  { id: 'relevance', name: 'Relevance', icon: TrendingUp, description: 'Most relevant results' },
  { id: 'hot', name: 'Hot', icon: Flame, description: 'Popular right now' },
  { id: 'top', name: 'Top', icon: Award, description: 'Highest rated' },
  { id: 'new', name: 'New', icon: Clock, description: 'Latest posts' },
];
export function SubredditInput({ 
  onSubredditSelect, 
  favoriteSubreddits, 
  onToggleFavorite,
  theme,
  defaultSort,
  onSortChange
}: SubredditInputProps) {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'popular' | 'favorites' | 'search'>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SubredditSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchNextPage, setSearchNextPage] = useState<string | null>(null);

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-gradient-to-br from-pink-50 via-white to-rose-50',
          card: 'bg-white/70 backdrop-blur-xl border-white/20',
          input: 'bg-white/50 border-pink-200/50 focus:border-pink-400',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          button: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
          searchButton: 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600',
          tab: 'text-gray-600 hover:text-pink-600',
          activeTab: 'text-pink-600 border-pink-400',
          subredditCard: 'bg-white/50 hover:bg-white/70 border-pink-100/50',
          sortButton: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50',
          activeSortButton: 'bg-blue-500 text-white',
        };
      case 'dark':
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-pink-900/20',
          card: 'bg-gray-800/70 backdrop-blur-xl border-gray-700/20',
          input: 'bg-gray-700/50 border-gray-600/50 focus:border-pink-400',
          text: 'text-white',
          subtext: 'text-gray-300',
          button: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700',
          searchButton: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
          tab: 'text-gray-400 hover:text-pink-400',
          activeTab: 'text-pink-400 border-pink-400',
          subredditCard: 'bg-gray-700/50 hover:bg-gray-600/70 border-gray-600/50',
          sortButton: 'text-gray-400 hover:text-blue-400 hover:bg-gray-700',
          activeSortButton: 'bg-blue-500 text-white',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 via-gray-50 to-pink-50',
          card: 'bg-gray-50/70 backdrop-blur-xl border-gray-200/20',
          input: 'bg-gray-100/50 border-gray-300/50 focus:border-pink-400',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          button: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
          searchButton: 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600',
          tab: 'text-gray-500 hover:text-pink-500',
          activeTab: 'text-pink-500 border-pink-400',
          subredditCard: 'bg-gray-100/50 hover:bg-gray-200/70 border-gray-200/50',
          sortButton: 'text-gray-500 hover:text-blue-500 hover:bg-gray-100',
          activeSortButton: 'bg-blue-500 text-white',
        };
    }
  };

  const themeClasses = getThemeClasses();

  const sortOptions = [
    { id: 'hot' as RedditSortType, name: 'Hot', icon: Flame, description: 'Popular right now' },
    { id: 'new' as RedditSortType, name: 'New', icon: Clock, description: 'Latest posts' },
    { id: 'top' as RedditSortType, name: 'Top', icon: Award, description: 'Highest rated' },
    { id: 'best' as RedditSortType, name: 'Best', icon: TrendingUp, description: 'Best overall' },
    { id: 'rising' as RedditSortType, name: 'Rising', icon: Zap, description: 'Trending up' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubredditSelect(input.trim().toLowerCase());
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchNextPage(null);

    try {
      const result = await redditApi.searchSubreddits(searchQuery.trim());
      setSearchResults(result.subreddits);
      setSearchNextPage(result.nextPage);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Failed to search subreddits');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMoreSearch = async () => {
    if (!searchNextPage || isSearching) return;

    setIsSearching(true);
    try {
      const result = await redditApi.searchSubreddits(searchQuery.trim(), searchNextPage);
      setSearchResults(prev => [...prev, ...result.subreddits]);
      setSearchNextPage(result.nextPage);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Failed to load more results');
    } finally {
      setIsSearching(false);
    }
  };

  const displaySubreddits = activeTab === 'favorites' ? favoriteSubreddits : popularSubreddits;

  return (
    <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center p-6`}>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8 relative">
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>
            Choose a Subreddit
          </h1>
          <p className={`${themeClasses.subtext}`}>
            Browse subreddits or select from popular options
          </p>
        </div>

        <div className={`${themeClasses.card} border rounded-2xl p-8 mb-8`}>
          <form onSubmit={handleSubmit}>
            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
              Browse Subreddit
            </h3>
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.subtext}`} />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter subreddit(s) (e.g., wallpapers, earthporn, spaceporn)"
                className={`w-full pl-12 pr-4 py-4 rounded-xl ${themeClasses.input} ${themeClasses.text} placeholder-gray-400 border focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition-all duration-200`}
              />
            </div>
            <p className={`text-sm ${themeClasses.subtext} mt-2 text-center`}>
              💡 Tip: Use commas to browse multiple subreddits at once (e.g., "wallpapers, earthporn, spaceporn")
            </p>
            <button
              type="submit"
              disabled={!input.trim()}
              className={`w-full mt-4 py-4 px-6 rounded-xl ${themeClasses.button} text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105`}
            >
              {input.includes(',') ? 'Browse Multi-Subreddit Feed' : 'Browse Subreddit'}
            </button>
          </form>
        </div>

        <div className={`${themeClasses.card} border rounded-2xl p-6`}>
          <div className="flex border-b border-gray-200/20 mb-6">
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'popular' 
                  ? `${themeClasses.activeTab} border-current` 
                  : `${themeClasses.tab} border-transparent`
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Popular
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'favorites' 
                  ? `${themeClasses.activeTab} border-current` 
                  : `${themeClasses.tab} border-transparent`
              }`}
            >
              <Star className="w-4 h-4 inline mr-2" />
              Favorites ({favoriteSubreddits.length})
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'search' 
                  ? `${themeClasses.activeTab} border-current` 
                  : `${themeClasses.tab} border-transparent`
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search
            </button>
          </div>

          {/* Search Tab Content */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div className="relative">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.subtext}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for subreddits (e.g., Ariana Grande, photography, gaming)"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl ${themeClasses.input} ${themeClasses.text} placeholder-gray-400 border focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition-all duration-200`}
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
                      Search Subreddits
                    </>
                  )}
                </button>
              </form>

              {/* Search Error */}
              {searchError && (
                <div className="text-center py-4">
                  <p className="text-red-500 text-sm">{searchError}</p>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className={`font-semibold ${themeClasses.text}`}>
                    Search Results ({searchResults.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {searchResults.map((subreddit) => (
                      <div
                        key={subreddit.name}
                        className={`${themeClasses.subredditCard} border rounded-xl p-4 transition-all duration-200 hover:scale-105 group cursor-pointer`}
                        onClick={() => onSubredditSelect(subreddit.name)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Subreddit Icon */}
                          {subreddit.icon && (
                            <img
                              src={subreddit.icon}
                              alt={subreddit.displayName}
                              className="w-12 h-12 rounded-full flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`font-semibold ${themeClasses.text} truncate`}>
                                {subreddit.displayName}
                              </h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {subreddit.isNsfw && (
                                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    NSFW
                                  </span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(subreddit.name);
                                  }}
                                  className={`p-1 rounded-full transition-colors duration-200 ${
                                    favoriteSubreddits.includes(subreddit.name)
                                      ? 'text-pink-500 hover:text-pink-600'
                                      : `${themeClasses.subtext} hover:text-pink-500`
                                  }`}
                                >
                                  <Star className={`w-4 h-4 ${favoriteSubreddits.includes(subreddit.name) ? 'fill-current' : ''}`} />
                                </button>
                              </div>
                            </div>
                            
                            <p className={`text-sm ${themeClasses.text} font-medium mb-1`}>
                              {subreddit.title}
                            </p>
                            
                            {subreddit.description && (
                              <p className={`text-sm ${themeClasses.subtext} line-clamp-2 mb-2`}>
                                {subreddit.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <Users className={`w-3 h-3 ${themeClasses.subtext}`} />
                                <span className={themeClasses.subtext}>
                                  {subreddit.subscribers.toLocaleString()} members
                                </span>
                              </div>
                              <div className="flex items-center gap-1 group-hover:text-pink-500 transition-colors">
                                <ArrowRight className="w-3 h-3" />
                                <span>Browse</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {searchNextPage && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={handleLoadMoreSearch}
                        disabled={isSearching}
                        className={`${themeClasses.secondaryButton} px-6 py-2 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2`}
                      >
                        {isSearching ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                            Loading...
                          </>
                        ) : (
                          'Load More Results'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No Results */}
              {!isSearching && searchQuery && searchResults.length === 0 && !searchError && (
                <div className="text-center py-8">
                  <Search className={`w-12 h-12 ${themeClasses.subtext} mx-auto mb-3`} />
                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
                    No Subreddits Found
                  </h3>
                  <p className={`${themeClasses.subtext}`}>
                    Try searching with different keywords
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Popular/Favorites Tab Content */}
          {(activeTab === 'popular' || activeTab === 'favorites') && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {displaySubreddits.map((subreddit) => (
                  <div
                    key={subreddit}
                    className={`${themeClasses.subredditCard} border rounded-xl p-4 transition-all duration-200 hover:scale-105 group cursor-pointer`}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className={`${themeClasses.text} font-medium text-sm cursor-pointer flex-1`}
                        onClick={() => onSubredditSelect(subreddit)}
                      >
                        r/{subreddit}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(subreddit);
                        }}
                        className={`p-1 rounded-full transition-colors duration-200 ${
                          favoriteSubreddits.includes(subreddit)
                            ? 'text-pink-500 hover:text-pink-600'
                            : `${themeClasses.subtext} hover:text-pink-500`
                        }`}
                      >
                        <Star className={`w-4 h-4 ${favoriteSubreddits.includes(subreddit) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {activeTab === 'favorites' && favoriteSubreddits.length === 0 && (
                <div className="text-center py-8">
                  <Star className={`w-12 h-12 ${themeClasses.subtext} mx-auto mb-3`} />
                  <p className={`${themeClasses.subtext}`}>
                    No favorite subreddits yet. Star some subreddits to see them here!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}