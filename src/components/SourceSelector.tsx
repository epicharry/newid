import React from 'react';
import { MediaSource } from '../types/app';
import { MessageSquare, Shield, Sparkles } from 'lucide-react';

interface SourceSelectorProps {
  onSourceSelect: (source: MediaSource) => void;
  theme: 'light' | 'dark' | 'off';
}

export function SourceSelector({ onSourceSelect, theme }: SourceSelectorProps) {
  const sources = [
    {
      id: 'reddit' as MediaSource,
      name: 'Reddit',
      description: 'Browse subreddits for images and videos',
      icon: MessageSquare,
      gradient: 'from-orange-400 to-red-500',
    },
    {
      id: 'youtube' as MediaSource,
      name: 'YouTube',
      description: 'Search and watch multiple videos simultaneously',
      icon: Sparkles,
      gradient: 'from-red-400 to-red-600',
    },
    {
      id: 'rule34' as MediaSource,
      name: 'Rule34',
      description: 'Adult content and artwork',
      icon: Shield,
      gradient: 'from-purple-400 to-indigo-500',
    },
  ];

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-gradient-to-br from-pink-50 via-white to-rose-50',
          card: 'bg-white/70 backdrop-blur-xl border-white/20',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          hover: 'hover:bg-white/80',
        };
      case 'dark':
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-pink-900/20',
          card: 'bg-gray-800/70 backdrop-blur-xl border-gray-700/20',
          text: 'text-white',
          subtext: 'text-gray-300',
          hover: 'hover:bg-gray-700/80',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 via-gray-50 to-pink-50',
          card: 'bg-gray-50/70 backdrop-blur-xl border-gray-200/20',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          hover: 'hover:bg-gray-100/80',
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center p-6`}>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className={`w-12 h-12 ${themeClasses.text} mr-3`} />
            <h1 className={`text-4xl font-bold ${themeClasses.text}`}>
              MediaVault
            </h1>
          </div>
          <p className={`text-xl ${themeClasses.subtext} max-w-2xl mx-auto`}>
            Choose your media source to start exploring beautiful content
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {sources.map((source) => {
            const Icon = source.icon;
            return (
              <button
                key={source.id}
                onClick={() => onSourceSelect(source.id)}
                className={`${themeClasses.card} ${themeClasses.hover} border rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl group`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${source.gradient} flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${themeClasses.text} mb-3`}>
                  {source.name}
                </h3>
                <p className={`${themeClasses.subtext} leading-relaxed`}>
                  {source.description}
                </p>
                {source.id === 'rule34' && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Shield className="w-4 h-4 text-red-500" />
                    <span className="text-red-500 text-sm font-medium">18+ Content</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}