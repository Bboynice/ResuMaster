import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Edit2, Check, X, Trash2, GripVertical } from 'lucide-react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { rewriteText, mockRewriteText, isOpenAIConfigured } from '../../services/openai';
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
    if (!content.trim()) return;
    
    setIsRewriting(true);
    try {
      let rewrittenText: string;
      
      if (isOpenAIConfigured()) {
        rewrittenText = await rewriteText({
          text: content,
          context: `${section.type} section for a resume`,
          tone: 'professional'
        });
      } else {
        // Use mock function for development
        rewrittenText = mockRewriteText(content);
      }
      
      setContent(rewrittenText);
    } catch (error) {
      console.error('Error rewriting text:', error);
      // Show error to user - in a real app, you'd use a toast notification
      alert('Failed to rewrite text. Please try again.');
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
          <div className="resume-header">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {section.title || 'Your Name'}
            </h1>
            <p className="text-base text-slate-600">
              {contentStr || 'Professional Title'}
            </p>
          </div>
        );
      
      case 'contact':
        return (
          <div className="resume-section">
            <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-1">
              {section.title || 'Contact Information'}
            </h2>
            <div className="text-slate-700 text-sm whitespace-pre-line">
              {contentStr || 'Add your contact information'}
            </div>
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
          <div className="resume-section">
            <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-1">
              {section.title || 'Skills'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? skills.map((skill, index) => (
                <span key={index} className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium">
                  {skill}
                </span>
              )) : (
                <span className="text-slate-500 text-sm">Add your skills</span>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="resume-section">
            {section.title && (
              <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-1">
                {section.title}
              </h2>
            )}
            <div className="text-slate-700 text-sm whitespace-pre-line">
              {contentStr || 'Add content here'}
            </div>
          </div>
        );
    }
  };

  const renderEditForm = () => (
    <Card className="border-emerald-200 bg-emerald-50/30">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {section.type === 'header' ? 'Your Name' : 'Section Title'}
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field text-sm"
              placeholder={section.type === 'header' ? 'Enter your name' : 'Enter section title'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {section.type === 'header' ? 'Professional Title' : 'Content'}
            </label>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-20 resize-y text-sm"
              placeholder={section.type === 'header' ? 'Enter your professional title' : 'Enter content...'}
              rows={4}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={handleRewrite}
              disabled={isRewriting || !content.trim()}
              className={`btn-ai gap-2 text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed group ${
                isRewriting ? 'animate-pulse' : ''
              }`}
            >
              <Wand2 size={16} className="group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-bold">{isRewriting ? 'Rewriting...' : 'AI Rewrite'}</span>
            </button>
            
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <X size={14} />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="gap-1"
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
        <Card className={`resume-text-editable relative hover:shadow-md transition-all duration-200 ${isDragging ? 'shadow-lg ring-2 ring-blue-200' : ''}`}>
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
                title="Drag to reorder"
              >
                <GripVertical size={14} />
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                title="Edit"
              >
                <Edit2 size={14} />
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
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
          <div className="bg-white border border-red-200 rounded-lg shadow-xl w-full h-full min-h-[100px] flex flex-col items-center justify-center p-2 sm:p-4">
            <p className="text-xs sm:text-sm text-red-800 mb-2 sm:mb-4 text-center font-medium leading-tight">
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