import React from 'react';
import { ViewerSession } from '../types/app';
import { MessageSquare, Shield, Youtube, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GlobalSidebarProps {
  sessions: ViewerSession[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionClose: (sessionId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme: 'light' | 'dark' | 'off';
}

export function GlobalSidebar({
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionClose,
  isCollapsed,
  onToggleCollapse,
  theme
}: GlobalSidebarProps) {
  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          sidebar: 'bg-white/90 backdrop-blur-xl border-gray-200/50',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          activeTab: 'bg-pink-100 border-pink-300 text-pink-700',
          inactiveTab: 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700',
          button: 'text-gray-600 hover:text-pink-600 hover:bg-pink-50',
          closeButton: 'text-gray-400 hover:text-red-500 hover:bg-red-50',
        };
      case 'dark':
        return {
          sidebar: 'bg-gray-900/90 backdrop-blur-xl border-gray-700/50',
          text: 'text-white',
          subtext: 'text-gray-300',
          activeTab: 'bg-pink-900/50 border-pink-500 text-pink-300',
          inactiveTab: 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300',
          button: 'text-gray-400 hover:text-pink-400 hover:bg-gray-800',
          closeButton: 'text-gray-500 hover:text-red-400 hover:bg-red-900/30',
        };
      default:
        return {
          sidebar: 'bg-gray-50/90 backdrop-blur-xl border-gray-300/50',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          activeTab: 'bg-pink-50 border-pink-400 text-pink-600',
          inactiveTab: 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-600',
          button: 'text-gray-500 hover:text-pink-500 hover:bg-gray-100',
          closeButton: 'text-gray-400 hover:text-red-500 hover:bg-red-50',
        };
    }
  };

  const themeClasses = getThemeClasses();

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'reddit':
        return MessageSquare;
      case 'rule34':
        return Shield;
      case 'youtube':
        return Youtube;
      default:
        return MessageSquare;
    }
  };

  const formatSessionTitle = (session: ViewerSession) => {
    switch (session.type) {
      case 'reddit':
        if (session.data.searchQuery && !session.data.subreddit) {
          return `Search: ${session.data.searchQuery}`;
        }
        if (session.data.searchQuery && session.data.subreddit) {
          return `r/${session.data.subreddit}: ${session.data.searchQuery}`;
        }
        return session.data.subreddit ? `r/${session.data.subreddit}` : 'Reddit';
      case 'rule34':
        return session.data.tags ? `Tags: ${session.data.tags}` : 'Rule34';
      case 'youtube':
        if (session.data.selectedVideos && session.data.selectedVideos.length > 0) {
          return `YouTube (${session.data.selectedVideos.length} videos)`;
        }
        return 'YouTube';
      default:
        return session.title;
    }
  };

  return (
    <div className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-80'
    } ${themeClasses.sidebar} border-r shadow-2xl`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200/20">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className={`font-bold ${themeClasses.text}`}>Active Sessions</h2>
              <p className={`text-sm ${themeClasses.subtext}`}>
                {sessions.length} viewer{sessions.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className={`p-2 rounded-xl ${themeClasses.button} transition-all duration-200`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          !isCollapsed && (
            <div className="text-center py-8">
              <p className={`${themeClasses.subtext} text-sm`}>
                No active sessions
              </p>
            </div>
          )
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const Icon = getSessionIcon(session.type);
              const isActive = session.id === activeSessionId;
              
              return (
                <div
                  key={session.id}
                  className={`relative group cursor-pointer transition-all duration-200 ${
                    isActive ? themeClasses.activeTab : themeClasses.inactiveTab
                  } border rounded-xl p-3 ${isCollapsed ? 'flex justify-center' : ''}`}
                  onClick={() => onSessionSelect(session.id)}
                  title={isCollapsed ? formatSessionTitle(session) : undefined}
                >
                  <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? 'text-current' : themeClasses.subtext
                    }`} />
                    
                    {!isCollapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium text-sm truncate ${
                            isActive ? 'text-current' : themeClasses.text
                          }`}>
                            {formatSessionTitle(session)}
                          </h3>
                          <p className={`text-xs ${themeClasses.subtext} truncate`}>
                            {session.state.mediaItems.length} items
                            {session.state.isLoading && ' • Loading...'}
                          </p>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSessionClose(session.id);
                          }}
                          className={`p-1 rounded-lg ${themeClasses.closeButton} transition-all duration-200 opacity-0 group-hover:opacity-100`}
                          title="Close session"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-500 rounded-r-full" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hotkey Help */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200/20">
          <div className={`text-xs ${themeClasses.subtext} space-y-1`}>
            <div><kbd className="bg-gray-200 px-1 rounded text-gray-800">Tab</kbd> Switch sessions</div>
            <div><kbd className="bg-gray-200 px-1 rounded text-gray-800">Ctrl+W</kbd> Close active</div>
          </div>
        </div>
      )}
    </div>
  );
}