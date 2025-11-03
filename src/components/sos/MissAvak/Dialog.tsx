'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Minimize2, Send, Sparkles, BookOpen, HelpCircle, Activity } from 'lucide-react';
import { getGreeting, getContextualResponse } from '@/lib/agents/miss-avak/personality';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DialogProps {
  onClose: () => void;
  onDismiss: () => void;
  conversationHistory: Message[];
  onUpdateHistory: (history: Message[]) => void;
}

export default function Dialog({
  onClose,
  onDismiss,
  conversationHistory,
  onUpdateHistory,
}: DialogProps) {
  const [messages, setMessages] = useState<Message[]>(conversationHistory);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = getGreeting();
      setTimeout(() => {
        addAssistantMessage(greeting);
      }, 500);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update parent state
  useEffect(() => {
    onUpdateHistory(messages);
  }, [messages, onUpdateHistory]);

  const addAssistantMessage = (content: string) => {
    setIsTyping(true);

    // Simulate typing effect
    let displayedContent = '';
    const fullContent = content;
    const typingSpeed = 30; // ms per character

    const typingInterval = setInterval(() => {
      if (displayedContent.length < fullContent.length) {
        displayedContent += fullContent[displayedContent.length];
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.role === 'assistant' && lastMessage.content !== fullContent) {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: displayedContent },
            ];
          } else {
            return [
              ...prev,
              { role: 'assistant', content: displayedContent, timestamp: new Date() },
            ];
          }
        });
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Get contextual response
    setTimeout(() => {
      const response = getContextualResponse(input.trim(), messages);
      addAssistantMessage(response);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: 'Show Guide', icon: BookOpen, action: 'guide' },
    { label: 'Agent Status', icon: Activity, action: 'agents' },
    { label: 'What\'s New?', icon: Sparkles, action: 'new' },
    { label: 'Help', icon: HelpCircle, action: 'help' },
  ];

  const handleQuickAction = (action: string) => {
    const actionMessages: Record<string, string> = {
      guide: 'Show me a guided tour',
      agents: 'What is the status of the agents?',
      new: 'What\'s new in my VAULT?',
      help: 'Help me understand how to use this system',
    };

    setInput(actionMessages[action] || '');
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed top-4 right-4 z-50 w-[400px] h-[600px] flex flex-col"
    >
      {/* Background with glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 blur-2xl" />

      {/* Main dialog */}
      <div className="relative flex flex-col h-full bg-gray-900/95 backdrop-blur-xl border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center border border-amber-400/40">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-400">Miss Avak</h3>
              <p className="text-xs text-gray-400">AI Guide • Always Listening</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-amber-500/20 transition-colors"
              aria-label="Minimize"
            >
              <Minimize2 className="w-4 h-4 text-amber-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onDismiss}
              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-red-400" />
            </motion.button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-400/40 text-white'
                    : 'bg-gray-800/60 border border-gray-700/40 text-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="px-4 py-3 rounded-2xl bg-gray-800/60 border border-gray-700/40">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-amber-400 rounded-full"
                      animate={{
                        y: [0, -8, 0],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-3 border-t border-amber-500/20 bg-gray-900/50">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {quickActions.map((action) => (
              <motion.button
                key={action.action}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickAction(action.action)}
                disabled={isTyping}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 hover:bg-amber-500/20 border border-gray-700/40 hover:border-amber-500/40 rounded-lg text-xs text-gray-300 whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 bg-gray-800/60 border border-gray-700/40 focus:border-amber-500/60 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping}
              className="p-2.5 bg-gradient-to-br from-amber-500/80 to-orange-500/80 hover:from-amber-500 hover:to-orange-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
