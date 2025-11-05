'use client';

import { Loader2, Sparkles } from 'lucide-react';

export function LoadingScreen({ message = 'Loading the FORGE...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-2 border-4 border-amber-600 border-b-transparent rounded-full animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }} />
            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-amber-300 text-lg font-medium">{message}</p>
          <p className="text-amber-500/60 text-sm">Initializing systems...</p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce animation-delay-200" />
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce animation-delay-400" />
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-amber-500 ${className}`} />
  );
}

export function InlineLoader({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 text-amber-300">
      <LoadingSpinner size="sm" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
