import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Type } from 'lucide-react';
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
          "w-full px-4 py-3 text-left bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-slate-200 dark:border-neutral-700 rounded-xl",
          "text-sm lg:text-base font-medium text-slate-900 dark:text-slate-100",
          "hover:bg-white dark:hover:bg-neutral-800 hover:border-slate-300 dark:hover:border-neutral-600 hover:shadow-sm",
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
            selectedOption ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          className={cn(
            "text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0",
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
          <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm">
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
                    "w-full px-4 py-3 text-left text-sm lg:text-base font-medium text-slate-900 dark:text-slate-100",
                    "hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400",
                    "transition-colors duration-150",
                    "flex items-center justify-between gap-3",
                    value === option.value && "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  )}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
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

export interface FontOption {
  name: string;
  value: string;
  category: 'serif' | 'sans-serif' | 'monospace';
}

const FONT_OPTIONS: FontOption[] = [
  // Serif fonts (Traditional, Professional)
  { name: 'Times New Roman', value: 'Times, "Times New Roman", serif', category: 'serif' },
  { name: 'Georgia', value: 'Georgia, serif', category: 'serif' },
  { name: 'Garamond', value: '"EB Garamond", Garamond, serif', category: 'serif' },
  { name: 'Baskerville', value: 'Baskerville, "Baskerville Old Face", serif', category: 'serif' },
  { name: 'Minion Pro', value: '"Minion Pro", "Adobe Minion Pro", serif', category: 'serif' },
  { name: 'Palatino', value: 'Palatino, "Palatino Linotype", serif', category: 'serif' },
  { name: 'Book Antiqua', value: '"Book Antiqua", Palatino, serif', category: 'serif' },
  
  // Sans-serif fonts (Modern, Clean)
  { name: 'Arial', value: 'Arial, sans-serif', category: 'sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif', category: 'sans-serif' },
  { name: 'Calibri', value: 'Calibri, sans-serif', category: 'sans-serif' },
  { name: 'Inter', value: 'Inter, sans-serif', category: 'sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif', category: 'sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif', category: 'sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif', category: 'sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif', category: 'sans-serif' },
  { name: 'Proxima Nova', value: '"Proxima Nova", Arial, sans-serif', category: 'sans-serif' },
  { name: 'Avenir', value: 'Avenir, "Avenir Next", sans-serif', category: 'sans-serif' },
  { name: 'Futura', value: 'Futura, "Futura PT", sans-serif', category: 'sans-serif' },
  { name: 'Optima', value: 'Optima, sans-serif', category: 'sans-serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif', category: 'sans-serif' },
  { name: 'Tahoma', value: 'Tahoma, sans-serif', category: 'sans-serif' },
  { name: 'Source Sans Pro', value: '"Source Sans Pro", sans-serif', category: 'sans-serif' },
  
  // Monospace fonts (Technical)
  { name: 'Source Code Pro', value: '"Source Code Pro", monospace', category: 'monospace' },
  { name: 'Fira Code', value: '"Fira Code", monospace', category: 'monospace' },
  { name: 'Consolas', value: 'Consolas, monospace', category: 'monospace' },
];

interface FontSelectorProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
  className?: string;
}

export const FontSelector: React.FC<FontSelectorProps> = ({
  selectedFont,
  onFontChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedFontOption = FONT_OPTIONS.find(font => font.value === selectedFont) || FONT_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFontSelect = (font: FontOption) => {
    onFontChange(font.value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 text-xs font-medium text-slate-700 dark:text-slate-300 w-[120px] justify-between h-9 overflow-hidden"
        title="Select Font"
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <Type size={12} className="text-slate-500 dark:text-slate-400 flex-shrink-0" />
          <span className="truncate text-xs">{selectedFontOption.name}</span>
        </div>
        <ChevronDown 
          size={12} 
          className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-80"
          >
            <div className="p-2 overflow-y-auto max-h-72">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-2 uppercase tracking-wide">
                Choose Font Family
              </div>
              
              {/* Serif Fonts */}
              <div className="mb-2">
                <div className="text-xs font-medium text-slate-400 dark:text-slate-500 px-3 py-1">Serif (Traditional)</div>
                {FONT_OPTIONS.filter(font => font.category === 'serif').map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleFontSelect(font)}
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 ${
                      selectedFont === font.value ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{font.name}</span>
                      {selectedFont === font.value && (
                        <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1" style={{ fontFamily: font.value }}>
                      The quick brown fox jumps over the lazy dog
                    </div>
                  </button>
                ))}
              </div>

              {/* Sans-serif Fonts */}
              <div className="mb-2">
                <div className="text-xs font-medium text-slate-400 dark:text-slate-500 px-3 py-1">Sans-serif (Modern)</div>
                {FONT_OPTIONS.filter(font => font.category === 'sans-serif').map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleFontSelect(font)}
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 ${
                      selectedFont === font.value ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{font.name}</span>
                      {selectedFont === font.value && (
                        <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1" style={{ fontFamily: font.value }}>
                      The quick brown fox jumps over the lazy dog
                    </div>
                  </button>
                ))}
              </div>

              {/* Monospace Fonts */}
              <div>
                <div className="text-xs font-medium text-slate-400 dark:text-slate-500 px-3 py-1">Monospace (Technical)</div>
                {FONT_OPTIONS.filter(font => font.category === 'monospace').map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleFontSelect(font)}
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 ${
                      selectedFont === font.value ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{font.name}</span>
                      {selectedFont === font.value && (
                        <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1" style={{ fontFamily: font.value }}>
                      The quick brown fox jumps over the lazy dog
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface FontSizeOption {
  label: string;
  value: string;
}

const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { label: '10pt', value: '10px' },
  { label: '11pt', value: '11px' },
  { label: '12pt', value: '12px' },
  { label: '13pt', value: '13px' },
  { label: '14pt', value: '14px' },
  { label: '15pt', value: '15px' },
  { label: '16pt', value: '16px' },
  { label: '18pt', value: '18px' },
];

interface FontSizeSelectorProps {
  selectedSize: string;
  onSizeChange: (size: string) => void;
  className?: string;
}

export const FontSizeSelector: React.FC<FontSizeSelectorProps> = ({
  selectedSize,
  onSizeChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedSizeOption = FONT_SIZE_OPTIONS.find(size => size.value === selectedSize) || FONT_SIZE_OPTIONS[4]; // Default to 14pt

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSizeSelect = (size: FontSizeOption) => {
    onSizeChange(size.value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 text-xs font-medium text-slate-700 dark:text-slate-300 w-[75px] justify-between h-9 overflow-hidden"
        title="Select Font Size"
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="text-slate-500 dark:text-slate-400 text-xs flex-shrink-0">A</span>
          <span className="truncate text-xs">{selectedSizeOption.label}</span>
        </div>
        <ChevronDown 
          size={12} 
          className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-32 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-2 uppercase tracking-wide">
                Font Size
              </div>
              
              {FONT_SIZE_OPTIONS.map((size) => (
                <button
                  key={size.value}
                  onClick={() => handleSizeSelect(size)}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 ${
                    selectedSize === size.value ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{size.label}</span>
                    {selectedSize === size.value && (
                      <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1" style={{ fontSize: size.value }}>
                    Sample text
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface BackgroundColorOption {
  name: string;
  value: string;
  category: 'white' | 'neutral' | 'cool' | 'warm';
}

const BACKGROUND_COLOR_OPTIONS: BackgroundColorOption[] = [
  // Essential whites only
  { name: 'Pure White', value: '#ffffff', category: 'white' },
  { name: 'Off White', value: '#f8f9fa', category: 'white' },
  { name: 'Cream', value: '#fefdf0', category: 'white' },
  
  // Neutral professional colors
  { name: 'Light Gray', value: '#f5f5f5', category: 'neutral' },
  { name: 'Warm Gray', value: '#f7f6f4', category: 'neutral' },
  { name: 'Silver', value: '#f8f8f8', category: 'neutral' },
  { name: 'Platinum', value: '#f2f2f2', category: 'neutral' },
  { name: 'Soft Sage', value: '#f6f8f6', category: 'neutral' },
  
  // Cool professional tones
  { name: 'Ice Blue', value: '#f0f8ff', category: 'cool' },
  { name: 'Powder Blue', value: '#f5f9fc', category: 'cool' },
  { name: 'Mint Cream', value: '#f5fffa', category: 'cool' },
  { name: 'Pale Blue', value: '#e6f3ff', category: 'cool' },
  { name: 'Lavender Mist', value: '#f8f6ff', category: 'cool' },
  { name: 'Soft Blue', value: '#f2f6ff', category: 'cool' },
  { name: 'Aqua Mist', value: '#f0fffe', category: 'cool' },
  { name: 'Pale Green', value: '#f0fff4', category: 'cool' },
  { name: 'Mint White', value: '#f5fff8', category: 'cool' },
  
  // Warm professional tones
  { name: 'Linen', value: '#faf0e6', category: 'warm' },
  { name: 'Champagne', value: '#f7e7ce', category: 'warm' },
  { name: 'Soft Peach', value: '#ffe5d9', category: 'warm' },
  { name: 'Pearl', value: '#f8f6f0', category: 'warm' },
  { name: 'Rose Quartz', value: '#f7e6e6', category: 'warm' },
  { name: 'Pale Orange', value: '#fff2e6', category: 'warm' },
  { name: 'Soft Pink', value: '#fdf2f8', category: 'warm' },
  { name: 'Ivory Rose', value: '#fef7f0', category: 'warm' },
  { name: 'Blush', value: '#fef1f1', category: 'warm' },
];

interface BackgroundColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

export const BackgroundColorSelector: React.FC<BackgroundColorSelectorProps> = ({
  selectedColor,
  onColorChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedColorOption = BACKGROUND_COLOR_OPTIONS.find(color => color.value === selectedColor) || BACKGROUND_COLOR_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorSelect = (color: BackgroundColorOption) => {
    onColorChange(color.value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 text-xs font-medium text-slate-700 dark:text-slate-300 w-[100px] justify-between h-9 overflow-hidden"
        title="Select Background Color"
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <div 
            className="w-3 h-3 rounded border border-slate-300 dark:border-slate-600 flex-shrink-0" 
            style={{ backgroundColor: selectedColor }}
          ></div>
          <span className="truncate text-xs">{selectedColorOption.name}</span>
        </div>
        <ChevronDown 
          size={12} 
          className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-72"
          >
            <div className="p-2">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-2 uppercase tracking-wide">
                Background Color
              </div>
              
              <div className="overflow-y-auto max-h-56">
                {/* White Colors */}
                <div className="mb-2">
                  <div className="text-xs font-medium text-slate-400 dark:text-slate-500 px-3 py-1">White</div>
                  {BACKGROUND_COLOR_OPTIONS.filter(color => color.category === 'white').map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleColorSelect(color)}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 ${
                        selectedColor === color.value ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600" 
                            style={{ backgroundColor: color.value }}
                          ></div>
                          <span className="font-medium text-sm">{color.name}</span>
                        </div>
                        {selectedColor === color.value && (
                          <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Neutral Colors */}
                <div className="mb-2">
                  <div className="text-xs font-medium text-slate-400 dark:text-slate-500 px-3 py-1">Neutral</div>
                  {BACKGROUND_COLOR_OPTIONS.filter(color => color.category === 'neutral').map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleColorSelect(color)}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 ${
                        selectedColor === color.value ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600" 
                            style={{ backgroundColor: color.value }}
                          ></div>
                          <span className="font-medium text-sm">{color.name}</span>
                        </div>
                        {selectedColor === color.value && (
                          <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Cool Colors */}
                <div className="mb-2">
                  <div className="text-xs font-medium text-slate-400 dark:text-slate-500 px-3 py-1">Cool Tones</div>
                  {BACKGROUND_COLOR_OPTIONS.filter(color => color.category === 'cool').map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleColorSelect(color)}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 ${
                        selectedColor === color.value ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600" 
                            style={{ backgroundColor: color.value }}
                          ></div>
                          <span className="font-medium text-sm">{color.name}</span>
                        </div>
                        {selectedColor === color.value && (
                          <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Warm Colors */}
                <div>
                  <div className="text-xs font-medium text-slate-400 dark:text-slate-500 px-3 py-1">Warm Tones</div>
                  {BACKGROUND_COLOR_OPTIONS.filter(color => color.category === 'warm').map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleColorSelect(color)}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 ${
                        selectedColor === color.value ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600" 
                            style={{ backgroundColor: color.value }}
                          ></div>
                          <span className="font-medium text-sm">{color.name}</span>
                        </div>
                        {selectedColor === color.value && (
                          <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 