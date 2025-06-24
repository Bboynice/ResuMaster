import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select option",
  className,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);
  
  console.log('Select component - value:', value, 'selectedOption:', selectedOption, 'options:', options);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        // Check if click is inside the portal dropdown
        const target = event.target as Element;
        if (!target.closest('[data-dropdown-portal]')) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    console.log('handleSelect called with:', optionValue);
    onChange(optionValue);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!isOpen && selectRef.current) {
      setDropdownRect(selectRef.current.getBoundingClientRect());
    }
    setIsOpen(!isOpen);
  };

  return (
    <div ref={selectRef} className={cn("relative", className, isOpen && "z-[10000]")}>
      {/* Select Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={cn(
          "w-full px-4 py-3 text-left bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl",
          "text-sm lg:text-base font-medium text-slate-900",
          "hover:bg-white hover:border-slate-300 hover:shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400",
          "transition-all duration-200",
          "flex items-center justify-between gap-3",
          "h-12",
          isOpen && "ring-2 ring-emerald-500/20 border-emerald-400"
        )}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-slate-500 flex-shrink-0">{icon}</span>}
          <span className={cn(
            selectedOption ? "text-slate-900" : "text-slate-500"
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          className={cn(
            "text-slate-400 transition-transform duration-200 flex-shrink-0",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Options - Portal */}
      {isOpen && dropdownRect && createPortal(
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[10000]"
          data-dropdown-portal="true"
          style={{
            top: dropdownRect.bottom + window.scrollY + 8,
            left: dropdownRect.left + window.scrollX,
            width: dropdownRect.width,
          }}
        >
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm">
            <div className="py-2 max-h-60 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Button clicked for option:', option.value);
                    handleSelect(option.value);
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm lg:text-base font-medium",
                    "hover:bg-emerald-50 hover:text-emerald-700",
                    "transition-colors duration-150",
                    "flex items-center justify-between gap-3",
                    value === option.value && "bg-emerald-50 text-emerald-700"
                  )}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Check size={16} className="text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}; 