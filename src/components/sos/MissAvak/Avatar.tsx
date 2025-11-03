'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import Dialog from './Dialog';

interface MissAvakState {
  isExpanded: boolean;
  hasNotification: boolean;
  isDismissed: boolean;
  lastInteraction: Date;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

const STORAGE_KEY = 'miss-avak-state';

export default function MissAvakAvatar() {
  const [state, setState] = useState<MissAvakState>({
    isExpanded: false,
    hasNotification: true, // Welcome notification on first visit
    isDismissed: false,
    lastInteraction: new Date(),
    conversationHistory: [],
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState({
          ...parsed,
          lastInteraction: new Date(parsed.lastInteraction),
          conversationHistory: parsed.conversationHistory.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        });
      } catch (e) {
        console.error('Failed to parse Miss Avak state:', e);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isMounted]);

  const toggleExpanded = () => {
    setState((prev) => ({
      ...prev,
      isExpanded: !prev.isExpanded,
      hasNotification: false,
      lastInteraction: new Date(),
    }));
  };

  const dismiss = () => {
    setState((prev) => ({
      ...prev,
      isDismissed: true,
      isExpanded: false,
    }));
  };

  const showAvatar = () => {
    setState((prev) => ({
      ...prev,
      isDismissed: false,
    }));
  };

  // Don't render on server or if dismissed
  if (!isMounted || state.isDismissed) {
    return null;
  }

  return (
    <>
      {/* Floating Avatar Button */}
      <AnimatePresence>
        {!state.isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-4 right-4 z-50 hidden md:block"
          >
            <motion.button
              onClick={toggleExpanded}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer group"
              aria-label="Open Miss Avak Assistant"
            >
              {/* Background glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-amber-500/30 via-yellow-500/20 to-orange-500/30 blur-xl"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Border with glow */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-amber-400/60"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(251, 191, 36, 0.4)',
                    '0 0 40px rgba(251, 191, 36, 0.6)',
                    '0 0 20px rgba(251, 191, 36, 0.4)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Avatar container */}
              <div className="absolute inset-0.5 rounded-full bg-black/80 backdrop-blur-sm overflow-hidden">
                {/* Particle effects */}
                <div className="absolute inset-0">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-amber-400/60 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                </div>

                {/* Avatar image/icon placeholder */}
                <div className="absolute inset-0 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-8 h-8" />
                </div>

                {/* Hover overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.2 }}
                />
              </div>

              {/* Notification indicator */}
              {state.hasNotification && (
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-gray-900"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
              )}

              {/* Speaking indicator */}
              {isSpeaking && (
                <motion.div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 bg-amber-400 rounded-full"
                      animate={{
                        y: [0, -4, 0],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.button>

            {/* Tooltip on hover */}
            <motion.div
              className="absolute top-1/2 right-full mr-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none"
              transition={{ duration: 0.2 }}
            >
              <div className="bg-gray-900/95 backdrop-blur-sm text-amber-400 text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 whitespace-nowrap">
                Miss Avak • AI Guide
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog */}
      <AnimatePresence>
        {state.isExpanded && (
          <Dialog
            onClose={toggleExpanded}
            onDismiss={dismiss}
            conversationHistory={state.conversationHistory}
            onUpdateHistory={(history) =>
              setState((prev) => ({
                ...prev,
                conversationHistory: history,
              }))
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}
