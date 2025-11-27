import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Edit2, Check, X, Trash2, GripVertical } from 'lucide-react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { rewriteSection, mockRewriteSection, isOpenAIConfigured } from '../../services/openai';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { SectionDropZone } from './SectionDropZone';
import type { LayoutSection } from '../../types';

interface EditableSectionProps {
  section: LayoutSection;
  onUpdate: (section: LayoutSection) => void;
  onDelete: (sectionId: string) => void;
  onAddSection?: (position: number, direction?: 'vertical' | 'left' | 'right', sectionId?: string) => void;
  columnWidth?: string; // For multi-column layouts
}

export const EditableSection: React.FC<EditableSectionProps> = ({ 
  section, 
  onUpdate, 
  onDelete, 
  onAddSection,
  columnWidth
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const getContentAsString = (content: string | string[] | any): string => {
    if (Array.isArray(content)) {
      return content.map(item => typeof item === 'string' ? item : String(item)).join(', ');
    }
    if (typeof content === 'object' && content !== null) {
      // Handle objects by converting to formatted string
      if (typeof content === 'object' && 'Name' in content) {
        // Handle contact-like objects
        return Object.entries(content)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      }
      // For other objects, join values
      return Object.values(content).map(v => String(v)).join(', ');
    }
    return String(content || '');
  };

  const [content, setContent] = useState(getContentAsString(section.content));
  const [title, setTitle] = useState(section.title || '');
  const [isRewriting, setIsRewriting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Sortable functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

  const handleSave = () => {
    const updatedContent = section.type === 'skills' 
      ? content.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : content.trim();
      
    const updatedSection: LayoutSection = {
      ...section,
      title: title.trim(),
      content: updatedContent,
    };
    onUpdate(updatedSection);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setContent(getContentAsString(section.content));
    setTitle(section.title || '');
    setIsEditing(false);
  };

  const handleRewrite = async () => {
    setIsRewriting(true);
    try {
      let result: { title?: string; content: string };
      
      if (isOpenAIConfigured()) {
        // Use the new section rewrite function that handles both title and content
        // Allow AI to generate content even when empty
        result = await rewriteSection({
          title: title || undefined,
          content: content || '',
          sectionType: section.type,
          context: 'resume/CV/cover letter',
          tone: 'professional'
        });
      } else {
        // Use mock function for development
        result = mockRewriteSection(content || '', title || undefined);
      }
      
      // Update both content and title if they were improved
      setContent(result.content);
      if (result.title && result.title !== title) {
        setTitle(result.title);
      }
    } catch (error) {
      console.error('Error rewriting section:', error);
      // Show error to user - in a real app, you'd use a toast notification
      alert('Failed to rewrite section. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleDelete = () => {
    onDelete(section.id);
    setShowDeleteConfirm(false);
  };

  const renderContent = () => {
    // Safely convert content to string, handling objects
    const contentStr = getContentAsString(section.content);

    switch (section.type) {
      case 'header':
        return (
          <div className="resume-header min-h-[50px] mb-3">
            {section.title && (
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 mb-1" style={{ color: '#0f172a' }}>
                {section.title}
              </h1>
            )}
            {contentStr && (
              <p className="text-sm lg:text-base text-slate-600" style={{ color: '#475569' }}>
                {contentStr}
              </p>
            )}
          </div>
        );
      
      case 'contact':
        return (
          <div className="resume-section min-h-[35px] mb-2">
            {section.title && (
              <h2 className="text-sm font-semibold text-slate-900 mb-1 border-b border-slate-200 pb-0.5" style={{ color: '#0f172a', borderColor: '#e2e8f0' }}>
                {section.title}
              </h2>
            )}
            {contentStr && (
              <div className="text-slate-700 text-xs whitespace-pre-line leading-relaxed" style={{ color: '#334155' }}>
                {contentStr}
              </div>
            )}
          </div>
        );
      
      case 'skills':
        let skills: string[] = [];
        if (Array.isArray(section.content)) {
          skills = section.content.map(item => typeof item === 'string' ? item : String(item));
        } else if (typeof section.content === 'object' && section.content !== null) {
          // Handle object content for skills
          skills = Object.values(section.content).map(v => String(v));
        } else if (section.content) {
          // Handle string content
          skills = String(section.content).split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
        
        return (
          <div className="resume-section min-h-[35px] mb-2">
            {section.title && (
              <h2 className="text-sm font-semibold text-slate-900 mb-1 border-b border-slate-200 pb-0.5" style={{ color: '#0f172a', borderColor: '#e2e8f0' }}>
                {section.title}
              </h2>
            )}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {skills.map((skill, index) => (
                  <span key={index} className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="resume-section min-h-[35px] mb-2">
            {section.title && (
              <h2 className="text-sm font-semibold text-slate-900 mb-1 border-b border-slate-200 pb-0.5" style={{ color: '#0f172a', borderColor: '#e2e8f0' }}>
                {section.title}
              </h2>
            )}
            {contentStr && (
              <div className="text-slate-700 text-xs whitespace-pre-line leading-relaxed" style={{ color: '#334155' }}>
                {contentStr}
              </div>
            )}
          </div>
        );
    }
  };

  const renderEditForm = () => (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/30 to-pink-50/30" style={{ backgroundColor: 'rgb(249 250 251)', borderColor: '#e9d5ff', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
      <CardContent className="p-4" style={{ backgroundColor: 'transparent' }}>
        <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2" style={{ color: '#374151' }}>
              {section.type === 'header' ? 'Your Name' : 'Section Title'}
              </label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field text-sm"
                style={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#d1d5db', 
                  color: '#111827',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgb(99 102 241 / 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              placeholder={section.type === 'header' ? 'Enter your name' : 'Enter section title'}
              />
            </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2" style={{ color: '#374151' }}>
              {section.type === 'header' ? 'Professional Title' : 'Content'}
            </label>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-20 resize-y text-sm"
              style={{ 
                backgroundColor: '#ffffff', 
                borderColor: '#d1d5db', 
                color: '#111827',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgb(99 102 241 / 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
              placeholder={section.type === 'header' ? 'Enter your professional title' : 'Enter content...'}
              rows={4}
            />
          </div>
          
          <div className="flex items-center justify-between" style={{ backgroundColor: 'transparent' }}>
            <button
              onClick={handleRewrite}
              disabled={isRewriting}
              className={`btn-ai gap-2 text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed group ${
                isRewriting ? 'animate-pulse' : ''
              }`}
            >
              <Wand2 size={16} className="group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-bold">{isRewriting ? 'Generating...' : 'AI Generate Section'}</span>
            </button>
            
            <div className="flex gap-2" style={{ backgroundColor: 'transparent' }}>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="gap-1"
                style={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#d1d5db', 
                  color: '#374151',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <X size={14} />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="gap-1"
                style={{ 
                  backgroundColor: '#111827', 
                  color: '#ffffff',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#111827';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Check size={14} />
                Save
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: columnWidth || '100%'
      }}
      className={`group relative transition-opacity duration-200 ${isDragging ? 'z-50 opacity-30' : ''}`}
    >
      {/* Horizontal Drop Zones */}
      {onAddSection && (
        <>
          <SectionDropZone
            position={section.order}
            onAddSection={(pos, direction) => onAddSection(pos, direction, section.id)}
            sectionId={section.id}
            direction="horizontal"
            side="left"
          />
          <SectionDropZone
            position={section.order}
            onAddSection={(pos, direction) => onAddSection(pos, direction, section.id)}
            sectionId={section.id}
            direction="horizontal"
            side="right"
          />
        </>
      )}

      {isEditing ? (
        renderEditForm()
      ) : (
        <Card className={`resume-text-editable resume-content relative hover:shadow-md transition-all duration-200 ${isDragging ? 'shadow-lg ring-2 ring-blue-200' : ''}`} style={{ backgroundColor: 'var(--resume-background-color, #ffffff)' }}>
          <CardContent className="p-4">
            {renderContent()}
            
            
            {/* Hover Controls */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                {...attributes}
                {...listeners}
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50 cursor-grab active:cursor-grabbing"
                style={{ 
                  color: '#475569',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dbeafe';
                  e.currentTarget.style.color = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }}
                title="Drag to reorder"
              >
                <GripVertical size={14} />
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-600 hover:text-purple-600 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50"
                style={{ 
                  color: '#475569',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, #faf5ff, #fdf2f8)';
                  e.currentTarget.style.color = '#9333ea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }}
                title="Edit"
              >
                <Edit2 size={14} />
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                style={{ 
                  color: '#475569',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                  e.currentTarget.style.color = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }}
                title="Delete"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-10 p-2"
        >
          <div className="bg-white border border-red-200 rounded-lg shadow-xl w-full h-full min-h-[100px] flex flex-col items-center justify-center p-2 sm:p-4" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', backgroundColor: '#ffffff', borderColor: '#fecaca' }}>
            <p className="text-xs sm:text-sm text-red-800 mb-2 sm:mb-4 text-center font-medium leading-tight" style={{ color: '#991b1b' }}>
              Delete this section?
            </p>
            <div className="flex gap-1 sm:gap-2 justify-center">
            <Button
              onClick={handleDelete}
              size="sm"
              variant="destructive"
                className="text-xs px-2 sm:px-4 h-7 sm:h-8"
            >
              Delete
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              size="sm"
              variant="outline"
                className="text-xs px-2 sm:px-4 h-7 sm:h-8"
            >
              Cancel
            </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}; 