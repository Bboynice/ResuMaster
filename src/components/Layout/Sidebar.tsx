import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Settings, 
  LogOut,
  Plus,
  Sparkles,
  X,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, isMobile }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'All Projects',
      href: '/projects',
      icon: FileText,
    },
    {
      label: 'Templates',
      href: '/templates',
      icon: Layers,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavClick = () => {
    if (isMobile) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : isMobile ? -320 : 0,
          width: isOpen ? (isMobile ? 300 : 280) : isMobile ? 300 : 80,
        }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed left-0 top-0 h-screen glass-effect flex flex-col z-50 border-r border-neutral-200/30`}
        style={{
          transform: isOpen ? 'translateX(0)' : isMobile ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >
        {/* Logo Section */}
        <div className="p-8 border-b border-neutral-200/30 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-4"
              >
                <Link to="/dashboard" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 floating-element">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-neutral-900 group-hover:text-neutral-800 transition-colors">ResuMaster</h1>
                    <p className="text-sm text-neutral-500 font-medium">AI Resume Builder</p>
                  </div>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="logo-mini"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="w-12 h-12 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl flex items-center justify-center mx-auto shadow-lg floating-element"
              >
                <Sparkles size={24} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Button */}
          <div className="flex gap-2">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-10 w-10 lg:hidden hover:bg-neutral-100/80 rounded-xl"
              >
                <X size={20} />
              </Button>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-10 w-10 hidden lg:flex hover:bg-neutral-100/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
              >
                <ChevronLeft 
                  size={20} 
                  className={`transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} 
                />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-8 overflow-y-auto">
          <div className="space-y-3">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Link
                    to={item.href}
                    onClick={handleNavClick}
                    className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''} ${
                      !isOpen ? 'justify-center px-3' : ''
                    } group`}
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon size={22} className="group-hover:scale-110 transition-transform duration-200" />
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden whitespace-nowrap font-semibold"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              );
            })}
          </div>


        </nav>

        {/* User Section */}
        <div className="p-6 border-t border-neutral-200/30">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="user-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-neutral-50/50 hover:bg-neutral-100/50 transition-all duration-300">
                  <Avatar className="h-12 w-12 shadow-md">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-neutral-600 to-neutral-700 text-white font-bold">
                      {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">
                      {user?.displayName || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-neutral-500 truncate font-medium">
                      {user?.email}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Link
                    to="/settings"
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 rounded-xl transition-all duration-300 font-semibold group"
                  >
                    <Settings size={18} className="group-hover:rotate-45 transition-transform duration-300" />
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-semibold group"
                  >
                    <LogOut size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="user-mini"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-3"
              >
                <Avatar className="h-12 w-12 shadow-lg hover:shadow-xl transition-all duration-300">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-neutral-600 to-neutral-700 text-white font-bold">
                    {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 hover:bg-neutral-100/80 rounded-xl group"
                    title="Settings"
                    asChild
                  >
                    <Link to="/settings">
                      <Settings size={18} className="group-hover:rotate-45 transition-transform duration-300" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="h-10 w-10 hover:bg-red-50 hover:text-red-600 rounded-xl group"
                    title="Sign Out"
                  >
                    <LogOut size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}; 