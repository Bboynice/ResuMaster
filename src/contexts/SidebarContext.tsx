import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(isMobileView);
      
      // Only auto-close sidebar on mobile screens, preserve user preference on desktop
      if (isMobileView && window.innerWidth < 768) {
        setIsOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, isMobile, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}; 