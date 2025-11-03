'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Lock,
  Pin,
  RotateCcw,
  AlertTriangle,
  Search,
  FileText,
  Download,
  X,
} from 'lucide-react';
import { canonTracker, CanonEntry, CanonStatus } from '@/lib/canon/canon-tracker';

export default function CanonSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [entries, setEntries] = useState<CanonEntry[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [filter, setFilter] = useState<CanonStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load canon entries
  useEffect(() => {
    const loadEntries = () => {
      const all = canonTracker.getAllEntries();
      setEntries(all);
    };

    loadEntries();

    // Refresh every 5 seconds to pick up new entries
    const interval = setInterval(loadEntries, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    if (filter !== 'all' && entry.status !== filter) return false;
    if (
      searchQuery &&
      !entry.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !entry.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Group by status
  const groupedEntries = {
    exploring: filteredEntries.filter((e) => e.status === 'exploring'),
    pinned: filteredEntries.filter((e) => e.status === 'pinned'),
    locked: filteredEntries.filter((e) => e.status === 'locked'),
    deviated: filteredEntries.filter((e) => e.status === 'deviated'),
  };

  const handlePin = async (id: string) => {
    await canonTracker.pinEntry(id);
    setEntries(canonTracker.getAllEntries());
  };

  const handleLock = async (id: string) => {
    await canonTracker.lockEntry(id);
    setEntries(canonTracker.getAllEntries());
  };

  const handleExport = () => {
    const markdown = canonTracker.exportCanon();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canon_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: CanonStatus) => {
    switch (status) {
      case 'exploring':
        return <RotateCcw className="w-3.5 h-3.5 text-gray-400" />;
      case 'pinned':
        return <Pin className="w-3.5 h-3.5 text-amber-400" />;
      case 'locked':
        return <Lock className="w-3.5 h-3.5 text-amber-500" />;
      case 'deviated':
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
    }
  };

  const getStatusColor = (status: CanonStatus) => {
    switch (status) {
      case 'exploring':
        return 'border-gray-600 bg-gray-800/40';
      case 'pinned':
        return 'border-amber-500/40 bg-amber-500/10';
      case 'locked':
        return 'border-amber-500/60 bg-amber-500/20 shadow-lg shadow-amber-500/20';
      case 'deviated':
        return 'border-orange-500/40 bg-orange-500/10';
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setIsOpen(true)}
        className="fixed top-24 right-4 z-40 p-3 bg-gray-900/95 backdrop-blur-sm border border-amber-500/40 rounded-l-xl hover:bg-amber-500/10 transition-colors"
        aria-label="Open Canon Sidebar"
      >
        <FileText className="w-5 h-5 text-amber-400" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed top-24 right-4 z-40 w-96 max-h-[calc(100vh-8rem)] flex flex-col"
    >
      {/* Background glow */}
      <div className="absolute -inset-2 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 blur-xl" />

      {/* Main sidebar */}
      <div className="relative flex flex-col h-full bg-gray-900/95 backdrop-blur-xl border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-amber-400">BUILD CANON</h3>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleExport}
              className="p-1.5 rounded-lg hover:bg-amber-500/20 transition-colors"
              title="Export Canon"
            >
              <Download className="w-4 h-4 text-amber-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-amber-500/20 transition-colors"
            >
              <X className="w-4 h-4 text-amber-400" />
            </motion.button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="px-4 py-3 space-y-2 border-b border-amber-500/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search canon..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800/60 border border-gray-700/40 focus:border-amber-500/60 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex gap-1">
            {(['all', 'exploring', 'pinned', 'locked', 'deviated'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                  filter === status
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    : 'bg-gray-800/40 text-gray-400 border border-gray-700/40 hover:bg-gray-700/40'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent">
          {/* Exploring */}
          {groupedEntries.exploring.length > 0 && (
            <Section
              title="🔄 Exploring"
              count={groupedEntries.exploring.length}
              entries={groupedEntries.exploring}
              expandedEntry={expandedEntry}
              setExpandedEntry={setExpandedEntry}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              onPin={handlePin}
              onLock={handleLock}
            />
          )}

          {/* Pinned */}
          {groupedEntries.pinned.length > 0 && (
            <Section
              title="📌 Pinned"
              count={groupedEntries.pinned.length}
              entries={groupedEntries.pinned}
              expandedEntry={expandedEntry}
              setExpandedEntry={setExpandedEntry}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              onPin={handlePin}
              onLock={handleLock}
            />
          )}

          {/* Locked */}
          {groupedEntries.locked.length > 0 && (
            <Section
              title="🔒 Locked"
              count={groupedEntries.locked.length}
              entries={groupedEntries.locked}
              expandedEntry={expandedEntry}
              setExpandedEntry={setExpandedEntry}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              onPin={handlePin}
              onLock={handleLock}
            />
          )}

          {/* Deviated */}
          {groupedEntries.deviated.length > 0 && (
            <Section
              title="⚠️ Deviations"
              count={groupedEntries.deviated.length}
              entries={groupedEntries.deviated}
              expandedEntry={expandedEntry}
              setExpandedEntry={setExpandedEntry}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              onPin={handlePin}
              onLock={handleLock}
            />
          )}

          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No canon entries found
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="px-4 py-2 border-t border-amber-500/20 bg-gray-900/50">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Total: {entries.length}</span>
            <span>Locked: {groupedEntries.locked.length}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Section component
interface SectionProps {
  title: string;
  count: number;
  entries: CanonEntry[];
  expandedEntry: string | null;
  setExpandedEntry: (id: string | null) => void;
  getStatusIcon: (status: CanonStatus) => React.ReactNode;
  getStatusColor: (status: CanonStatus) => string;
  onPin: (id: string) => void;
  onLock: (id: string) => void;
}

function Section({
  title,
  count,
  entries,
  expandedEntry,
  setExpandedEntry,
  getStatusIcon,
  getStatusColor,
  onPin,
  onLock,
}: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-2 py-1 rounded-lg hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-300">{title}</span>
          <span className="text-xs text-gray-500">({count})</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 overflow-hidden"
          >
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                isExpanded={expandedEntry === entry.id}
                onToggle={() =>
                  setExpandedEntry(expandedEntry === entry.id ? null : entry.id)
                }
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                onPin={onPin}
                onLock={onLock}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Entry card component
interface EntryCardProps {
  entry: CanonEntry;
  isExpanded: boolean;
  onToggle: () => void;
  getStatusIcon: (status: CanonStatus) => React.ReactNode;
  getStatusColor: (status: CanonStatus) => string;
  onPin: (id: string) => void;
  onLock: (id: string) => void;
}

function EntryCard({
  entry,
  isExpanded,
  onToggle,
  getStatusIcon,
  getStatusColor,
  onPin,
  onLock,
}: EntryCardProps) {
  return (
    <motion.div
      layout
      className={`border rounded-lg overflow-hidden ${getStatusColor(entry.status)}`}
    >
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-start gap-2 hover:bg-white/5 transition-colors"
      >
        <div className="mt-0.5">{getStatusIcon(entry.status)}</div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-200 line-clamp-2">
            {entry.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{entry.type}</span>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-amber-400">{entry.confidence}%</span>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3 pb-3 space-y-2 border-t border-white/10"
          >
            <p className="text-xs text-gray-400 mt-2">{entry.description}</p>

            {entry.reason && (
              <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded text-xs text-orange-300">
                <strong>Reason:</strong> {entry.reason}
              </div>
            )}

            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-800/60 border border-gray-700/40 rounded text-xs text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {entry.status === 'exploring' && (
                <button
                  onClick={() => onPin(entry.id)}
                  className="flex-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-xs text-amber-300 transition-colors"
                >
                  📌 Pin
                </button>
              )}
              {entry.status === 'pinned' && (
                <button
                  onClick={() => onLock(entry.id)}
                  className="flex-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-xs text-amber-300 transition-colors"
                >
                  🔒 Lock
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
