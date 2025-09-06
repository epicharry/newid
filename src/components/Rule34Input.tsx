import React, { useState } from 'react';
import { Search, Shield, Tag, TrendingUp } from 'lucide-react';

interface Rule34InputProps {
  onTagsSelect: (tags: string) => void;
  theme: 'light' | 'dark' | 'off';
}

const popularTags = [
  'reyna_(valorant)',
  'jett_(valorant)', 
  'sage_(valorant)',
  'viper_(valorant)',
  'raze_(valorant)',
  'phoenix_(valorant)',
  'sova_(valorant)',
  'breach_(valorant)',
  'omen_(valorant)',
  'brimstone_(valorant)',
  'cypher_(valorant)',
  'killjoy_(valorant)',
  'skye_(valorant)',
  'yoru_(valorant)',
  'astra_(valorant)'
];

export function Rule34Input({ onTagsSelect, theme }: Rule34InputProps) {
  const [input, setInput] = useState('');

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-gradient-to-br from-pink-50 via-white to-rose-50',
          card: 'bg-white/70 backdrop-blur-xl border-white/20',
          input: 'bg-white/50 border-pink-200/50 focus:border-pink-400',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          button: 'bg-gradient-to-r from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600',
          tagCard: 'bg-white/50 hover:bg-white/70 border-purple-100/50',
        };
      case 'dark':
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/20',
          card: 'bg-gray-800/70 backdrop-blur-xl border-gray-700/20',
          input: 'bg-gray-700/50 border-gray-600/50 focus:border-purple-400',
          text: 'text-white',
          subtext: 'text-gray-300',
          button: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700',
          tagCard: 'bg-gray-700/50 hover:bg-gray-600/70 border-gray-600/50',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 via-gray-50 to-purple-50',
          card: 'bg-gray-50/70 backdrop-blur-xl border-gray-200/20',
          input: 'bg-gray-100/50 border-gray-300/50 focus:border-purple-400',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          button: 'bg-gradient-to-r from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600',
          tagCard: 'bg-gray-100/50 hover:bg-gray-200/70 border-gray-200/50',
        };
    }
  };

  const themeClasses = getThemeClasses();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onTagsSelect(input.trim());
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center p-6`}>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Shield className={`w-12 h-12 ${themeClasses.text} mr-3`} />
            <h1 className={`text-3xl font-bold ${themeClasses.text}`}>
              Rule34 Browser
            </h1>
          </div>
          <p className={`${themeClasses.subtext} text-lg`}>
            Search for content by tags
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Shield className="w-4 h-4 text-red-500" />
            <span className="text-red-500 text-sm font-medium">18+ Content Warning</span>
          </div>
        </div>

        <div className={`${themeClasses.card} border rounded-2xl p-8 mb-8`}>
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.subtext}`} />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter tags (e.g., reyna_(valorant), jett_(valorant))"
                className={`w-full pl-12 pr-4 py-4 rounded-xl ${themeClasses.input} ${themeClasses.text} placeholder-gray-400 border focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-200`}
              />
            </div>
            <p className={`text-sm ${themeClasses.subtext} mt-2 text-center`}>
              💡 Tip: Use underscores for character names and spaces between multiple tags
            </p>
            <button
              type="submit"
              disabled={!input.trim()}
              className={`w-full mt-4 py-4 px-6 rounded-xl ${themeClasses.button} text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105`}
            >
              Search Content
            </button>
          </form>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className={`w-4 h-4 ${themeClasses.text}`} />
              <span className={`font-medium ${themeClasses.text}`}>Popular Tags</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagsSelect(tag)}
                  className={`${themeClasses.tagCard} border rounded-xl p-3 transition-all duration-200 hover:scale-105 group cursor-pointer text-left`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className={`w-3 h-3 ${themeClasses.subtext}`} />
                    <span className={`${themeClasses.text} font-medium text-sm`}>
                      {tag}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}