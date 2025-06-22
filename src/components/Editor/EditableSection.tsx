import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Edit2, Check, X, Trash2 } from 'lucide-react';
import { rewriteText, mockRewriteText, isOpenAIConfigured } from '../../services/openai';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import type { LayoutSection } from '../../types';

interface EditableSectionProps {
  section: LayoutSection;
  onUpdate: (section: LayoutSection) => void;
  onDelete: (sectionId: string) => void;
}

export const EditableSection: React.FC<EditableSectionProps> = ({ 
  section, 
  onUpdate, 
  onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const getContentAsString = (content: string | string[] | undefined): string => {
    if (Array.isArray(content)) return content.join(', ');
    return content || '';
  };

  const [content, setContent] = useState(getContentAsString(section.content));
  const [title, setTitle] = useState(section.title || '');
  const [isRewriting, setIsRewriting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

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
    const contentStr = Array.isArray(section.content) 
      ? section.content.join(', ') 
      : (section.content || '');

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
        const skills = Array.isArray(section.content) ? section.content : 
                     (section.content ? section.content.split(',').map(s => s.trim()) : []);
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
          {section.type !== 'header' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Section Title
              </label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field text-sm"
                placeholder="Enter section title"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Content
            </label>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-20 resize-y text-sm"
              placeholder="Enter content..."
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
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative"
    >
      {isEditing ? (
        renderEditForm()
      ) : (
        <Card className="resume-text-editable relative hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            {renderContent()}
            
            {/* Hover Controls */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
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
          className="absolute top-0 left-0 right-0 bg-red-50 border border-red-200 rounded-lg p-3 z-10 shadow-lg"
        >
          <p className="text-sm text-red-800 mb-3">Delete this section?</p>
          <div className="flex gap-2">
            <Button
              onClick={handleDelete}
              size="sm"
              variant="destructive"
              className="text-xs"
            >
              Delete
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}; 