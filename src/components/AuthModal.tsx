import React, { useState } from 'react';
import { X, User, Mail, Lock, LogIn, UserPlus, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (username: string, password: string) => Promise<void>;
  onSignUp: (username: string, password: string) => Promise<void>;
  theme: 'light' | 'dark' | 'off';
}

export function AuthModal({ isOpen, onClose, onSignIn, onSignUp, theme }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          overlay: 'bg-black/50',
          modal: 'bg-white/95 backdrop-blur-xl border-white/20',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          input: 'bg-white/50 border-gray-200 focus:border-pink-400',
          button: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
          secondaryButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          linkButton: 'text-pink-600 hover:text-pink-700',
        };
      case 'dark':
        return {
          overlay: 'bg-black/70',
          modal: 'bg-gray-800/95 backdrop-blur-xl border-gray-700/20',
          text: 'text-white',
          subtext: 'text-gray-300',
          input: 'bg-gray-700/50 border-gray-600 focus:border-pink-400 text-white',
          button: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700',
          secondaryButton: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
          linkButton: 'text-pink-400 hover:text-pink-300',
        };
      default:
        return {
          overlay: 'bg-black/50',
          modal: 'bg-gray-50/95 backdrop-blur-xl border-gray-200/20',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          input: 'bg-gray-100/50 border-gray-300 focus:border-pink-400',
          button: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
          secondaryButton: 'bg-gray-200 hover:bg-gray-300 text-gray-600',
          linkButton: 'text-pink-500 hover:text-pink-600',
        };
    }
  };

  const themeClasses = getThemeClasses();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        if (!username.trim()) {
          throw new Error('Username is required');
        }
        console.log('Attempting signup with:', { username: username.trim() });
        await onSignUp(username.trim(), password);
      } else {
        console.log('Attempting signin with:', { username: username.trim() });
        await onSignIn(username.trim(), password);
      }
      
      // Reset form
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${themeClasses.overlay}`}>
      <div className={`${themeClasses.modal} border rounded-2xl p-8 max-w-md w-full shadow-2xl`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl ${themeClasses.secondaryButton} transition-all duration-200`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Username
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.subtext}`} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className={`w-full pl-10 pr-4 py-3 rounded-xl ${themeClasses.input} border focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition-all duration-200`}
                required
              />
            </div>
          </div>


          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.subtext}`} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full pl-10 pr-4 py-3 rounded-xl ${themeClasses.input} border focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition-all duration-200`}
                required
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.subtext}`} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl ${themeClasses.input} border focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition-all duration-200`}
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-6 rounded-xl ${themeClasses.button} text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              <>
                {mode === 'signin' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`text-sm ${themeClasses.subtext}`}>
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              onClick={switchMode}
              className={`font-medium ${themeClasses.linkButton} transition-colors duration-200`}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-700 text-xs">
            💡 <strong>Permanent Login:</strong> You'll stay logged in until you manually sign out. 
            Sign in to sync your favorites and folders across devices.
          </p>
        </div>
      </div>
    </div>
  );
}