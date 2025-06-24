import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

interface SectionDropZoneProps {
  position: number;
  onAddSection: (position: number, direction?: 'vertical' | 'left' | 'right') => void;
  sectionId?: string; // For horizontal splits
  direction?: 'vertical' | 'horizontal';
  side?: 'left' | 'right'; // For horizontal zones
}

export const SectionDropZone: React.FC<SectionDropZoneProps> = ({ 
  position, 
  onAddSection, 
  sectionId,
  direction = 'vertical',
  side 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleAddSection = () => {
    if (direction === 'horizontal' && side) {
      onAddSection(position, side);
    } else {
      onAddSection(position, 'vertical');
    }
  };

  if (direction === 'horizontal') {
    return (
      <div 
        className={`absolute top-0 ${side === 'left' ? '-left-3' : '-right-3'} w-6 h-full z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleAddSection}
              className="w-6 h-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 z-30"
              title={`Add section to the ${side}`}
            >
              <Plus size={12} />
            </motion.button>
          )}
        </AnimatePresence>
        
        {/* Visual indicator line */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              className="absolute left-1/2 top-0 w-0.5 h-full bg-purple-600 z-20 transform -translate-x-1/2"
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Vertical drop zone (existing functionality)
  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-purple-600 z-20"
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-30"
          >
            <button
              onClick={handleAddSection}
              className="w-8 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
              title="Add section here"
            >
              <Plus size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="h-6" />
    </div>
  );
}; 