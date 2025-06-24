import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Download, Eye, Settings, Wand2, Palette } from 'lucide-react';
import { Button } from './button';

interface FloatingToolbarProps {
  isVisible: boolean;
  onSave: () => void;
  onDownload: () => void;
  onPreview: () => void;
  onSettings: () => void;
  onAIGenerate: () => void;
  onTheme: () => void;
  saving?: boolean;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  isVisible,
  onSave,
  onDownload,
  onPreview,
  onSettings,
  onAIGenerate,
  onTheme,
  saving = false,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="glass-effect rounded-2xl p-3 shadow-2xl border border-white/20">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onSave}
                disabled={saving}
                className="h-12 w-12 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 rounded-xl group"
                title="Save (Ctrl+S)"
              >
                <Save 
                  size={20} 
                  className={`text-emerald-600 dark:text-emerald-400 transition-transform duration-200 ${
                    saving ? 'animate-pulse' : 'group-hover:scale-110'
                  }`} 
                />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onDownload}
                className="h-12 w-12 hover:bg-blue-100/80 dark:hover:bg-blue-900/30 rounded-xl group"
                title="Download PDF"
              >
                <Download 
                  size={20} 
                  className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" 
                />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onPreview}
                className="h-12 w-12 hover:bg-purple-100/80 dark:hover:bg-purple-900/30 rounded-xl group"
                title="Preview"
              >
                <Eye 
                  size={20} 
                  className="text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200" 
                />
              </Button>

              <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-700" />

              <Button
                variant="ghost"
                size="icon"
                onClick={onAIGenerate}
                className="h-12 w-12 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 rounded-xl group"
                title="AI Generate"
              >
                <Wand2 
                  size={20} 
                  className="text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200" 
                />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onTheme}
                className="h-12 w-12 hover:bg-orange-100/80 dark:hover:bg-orange-900/30 rounded-xl group"
                title="Change Theme"
              >
                <Palette 
                  size={20} 
                  className="text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-200" 
                />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onSettings}
                className="h-12 w-12 hover:bg-neutral-100/80 dark:hover:bg-neutral-700/50 rounded-xl group"
                title="Settings"
              >
                <Settings 
                  size={20} 
                  className="text-neutral-600 dark:text-neutral-400 group-hover:scale-110 group-hover:rotate-45 transition-transform duration-200" 
                />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 