import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

export const Header: React.FC = () => {
  const [showDemoBanner, setShowDemoBanner] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is in demo mode
  const isDemoMode = user?.uid === 'demo-user-123';

  return (
    <>
      {/* Demo Mode Banner */}
      {isDemoMode && showDemoBanner && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 text-white px-6 py-4 text-center relative overflow-hidden z-10"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-purple-700/20 animate-shimmer"></div>
          <p className="text-sm font-bold relative z-10">
            ✨ <strong>Demo Mode</strong> - You're using trial credentials. Data is stored locally and will be cleared on logout.
          </p>
          <button
            onClick={() => setShowDemoBanner(false)}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white hover:text-purple-200 transition-all duration-300 hover:scale-110 z-10"
            aria-label="Close demo banner"
          >
            <X size={20} />
          </button>
        </motion.div>
      )}
      
      {/* <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-effect border-b border-neutral-200/30"
      >
        <div className="px-12 py-8">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
                Welcome back
                <Sparkles size={28} className="text-purple-600 floating-element" />
              </h1>
              <p className="text-lg text-neutral-600 font-medium">
                Let's build something <span className="gradient-text font-bold">amazing</span> today
              </p>
            </motion.div>
          </div>
        </div>
      </motion.header> */}
    </>
  );
}; 