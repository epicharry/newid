import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ThemeMode } from '../types/app';

interface ThemeToggleProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  const themes = [
    { id: 'light' as ThemeMode, icon: Sun, label: 'Light' },
    { id: 'dark' as ThemeMode, icon: Moon, label: 'Dark' },
    { id: 'off' as ThemeMode, icon: Monitor, label: 'Neutral' },
  ];

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          container: 'bg-white/70 backdrop-blur-xl border-white/20',
          button: 'bg-pink-100 text-pink-600',
          inactiveButton: 'text-gray-600 hover:text-pink-600 hover:bg-pink-50',
        };
      case 'dark':
        return {
          container: 'bg-gray-800/70 backdrop-blur-xl border-gray-700/20',
          button: 'bg-pink-600 text-white',
          inactiveButton: 'text-gray-400 hover:text-pink-400 hover:bg-gray-700',
        };
      default:
        return {
          container: 'bg-gray-50/70 backdrop-blur-xl border-gray-200/20',
          button: 'bg-pink-200 text-pink-700',
          inactiveButton: 'text-gray-500 hover:text-pink-500 hover:bg-gray-100',
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`${themeClasses.container} border rounded-2xl p-1 flex gap-1`}>
      {themes.map((themeOption) => {
        const Icon = themeOption.icon;
        const isActive = theme === themeOption.id;
        
        return (
          <button
            key={themeOption.id}
            onClick={() => onThemeChange(themeOption.id)}
            className={`p-2 rounded-xl transition-all duration-200 ${
              isActive ? themeClasses.button : themeClasses.inactiveButton
            }`}
            title={themeOption.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}