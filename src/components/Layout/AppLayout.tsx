import React from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { Header } from './Header';
import { Button } from '../ui/button';
import { useSidebar } from '../../contexts/SidebarContext';

interface AppLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showHeader = true 
}) => {
  const { isOpen: sidebarOpen, isMobile, toggleSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50/50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900/50 transition-colors duration-300">
      {/* Mobile Header with Menu Button */}
      {isMobile && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="lg:hidden glass-effect px-6 py-4 flex items-center justify-between sticky top-0 z-30"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-10 w-10 hover:bg-neutral-100/80 dark:hover:bg-neutral-700/50 rounded-xl"
          >
            <Menu size={22} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-neutral-800 to-neutral-900 dark:from-emerald-600 dark:to-emerald-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">R</span>
            </div>
            <span className="font-bold text-xl text-neutral-900 dark:text-neutral-100">ResuMaster</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </motion.div>
      )}
      
      <motion.div
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : sidebarOpen ? 280 : 80,
        }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen overflow-x-hidden"
        style={{
          maxWidth: isMobile ? '100vw' : `calc(100vw - ${sidebarOpen ? 280 : 80}px)`,
        }}
      >
        {showHeader && !isMobile && <Header />}
        
        <motion.main
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className={`${
            isMobile 
              ? 'px-6 py-6' 
              : 'px-8 py-8 lg:px-12 lg:py-10'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </motion.main>
      </motion.div>
    </div>
  );
}; 