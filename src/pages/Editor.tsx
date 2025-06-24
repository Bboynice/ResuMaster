import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Wand2, 
  Plus, 
  Save,
  Eye,
  EyeOff 
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { EditableSection } from '../components/Editor/EditableSection';
import { SectionDropZone } from '../components/Editor/SectionDropZone';
import { AppLayout } from '../components/Layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useProjects } from '../contexts/ProjectContext';
import { generateLayout, mockGenerateLayout, isOpenAIConfigured } from '../services/openai';
import type { LayoutSection } from '../types';

export const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, updateLayout, projects, setCurrentProject } = useProjects();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check screen size for responsive behavior
  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1280);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Find and set current project if not already set
  React.useEffect(() => {
    if (id && !currentProject) {
      const project = projects.find(p => p.id === id);
      if (project) {
        setCurrentProject(project);
      } else {
        navigate('/dashboard');
      }
    }
  }, [id, currentProject, projects, setCurrentProject, navigate]);

  if (!currentProject) {
    return (
      <AppLayout showHeader={false}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading project...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleSectionUpdate = async (updatedSection: LayoutSection) => {
    const updatedLayout = currentProject.layout.map(section =>
      section.id === updatedSection.id ? updatedSection : section
    );
    
    try {
      await updateLayout(updatedLayout);
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleSectionDelete = async (sectionId: string) => {
    const sectionToDelete = currentProject.layout.find(s => s.id === sectionId);
    let updatedLayout = currentProject.layout.filter(section => section.id !== sectionId);
    
    // If the deleted section was part of a multi-column row, check if we need to reset remaining sections
    if (sectionToDelete && sectionToDelete.row !== undefined && sectionToDelete.column !== undefined) {
      const rowNumber = sectionToDelete.row;
      const remainingSectionsInRow = updatedLayout.filter(s => s.row === rowNumber);
      
      if (remainingSectionsInRow.length === 1) {
        // Only one section left in the row, reset it to full width
        updatedLayout = updatedLayout.map(section => {
          if (section.row === rowNumber) {
            return {
              ...section,
              row: undefined,
              column: undefined,
              columnsInRow: undefined
            };
          }
          return section;
        });
      } else if (remainingSectionsInRow.length > 1) {
        // Multiple sections remain, update their column properties
        const sortedRemaining = remainingSectionsInRow.sort((a, b) => (a.column ?? 0) - (b.column ?? 0));
        updatedLayout = updatedLayout.map(section => {
          if (section.row === rowNumber) {
            const newColumnIndex = sortedRemaining.findIndex(s => s.id === section.id);
            return {
              ...section,
              column: newColumnIndex,
              columnsInRow: remainingSectionsInRow.length
            };
          }
          return section;
        });
      }
    }
    
    try {
      await updateLayout(updatedLayout);
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section. Please try again.');
    }
  };

  const handleAddSection = async (position?: number, direction?: 'vertical' | 'left' | 'right', sectionId?: string) => {
    const newSection: LayoutSection = {
      id: `section-${Date.now()}`,
      type: 'section',
      title: 'New Section',
      content: 'Add your content here...',
      order: position !== undefined ? position : currentProject.layout.length
    };

    let updatedLayout: LayoutSection[];
    
    if (direction === 'left' || direction === 'right') {
      // Horizontal split: convert existing section to multi-column layout
      const existingSection = currentProject.layout.find(s => s.id === sectionId);
      if (!existingSection) return;
      
      // Determine row number for the existing section
      const rowNumber = existingSection.row ?? existingSection.order;
      
      // Update existing section to be in a column
      const updatedExistingSection: LayoutSection = {
        ...existingSection,
        row: rowNumber,
        column: direction === 'left' ? 1 : 0, // If adding to left, existing goes to right (1)
        columnsInRow: 2
      };
      
      // Create new section in the other column
      const newColumnSection: LayoutSection = {
        ...newSection,
        row: rowNumber,
        column: direction === 'left' ? 0 : 1, // If adding to left, new goes to left (0)
        columnsInRow: 2
      };
      
      // Update layout
      updatedLayout = currentProject.layout.map(section => 
        section.id === sectionId ? updatedExistingSection : section
      );
      updatedLayout.push(newColumnSection);
      
    } else {
      // Vertical add (existing functionality)
      if (position !== undefined) {
        // Insert at specific position and reorder
        const sortedLayout = [...currentProject.layout].sort((a, b) => a.order - b.order);
        sortedLayout.splice(position, 0, newSection);
        updatedLayout = sortedLayout.map((section, index) => ({
          ...section,
          order: index
        }));
      } else {
        // Add at the end
        updatedLayout = [...currentProject.layout, newSection];
      }
    }
    
    try {
      await updateLayout(updatedLayout);
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Failed to add section. Please try again.');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id && over?.id) {
      const sortedLayout = [...currentProject.layout].sort((a, b) => a.order - b.order);
      const oldIndex = sortedLayout.findIndex(section => section.id === active.id);
      const newIndex = sortedLayout.findIndex(section => section.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Immediately update the local state to prevent visual jumping
        const newLayout = arrayMove(sortedLayout, oldIndex, newIndex);
        const updatedLayout = newLayout.map((section, index) => ({
          ...section,
          order: index
        }));

        // Update local state immediately
        setCurrentProject(currentProject ? { ...currentProject, layout: updatedLayout } : null);

        // Then save to backend with a small delay to ensure smooth UI
        setTimeout(async () => {
          try {
            await updateLayout(updatedLayout);
          } catch (error) {
            console.error('Error reordering sections:', error);
            // Revert local state on error
            setCurrentProject(currentProject);
            alert('Failed to reorder sections. Please try again.');
          }
        }, 100);
      }
    }
  };

  const handleGenerateLayout = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      let generatedLayout: LayoutSection[];
      
      if (isOpenAIConfigured()) {
        generatedLayout = await generateLayout({
          prompt: aiPrompt,
          currentLayout: currentProject.layout,
          projectType: currentProject.type
        });
      } else {
        generatedLayout = mockGenerateLayout(currentProject.type);
      }
      
      await updateLayout(generatedLayout);
      setShowAiModal(false);
      setAiPrompt('');
    } catch (error) {
      console.error('Error generating layout:', error);
      alert('Failed to generate layout. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = () => {
    if (printRef.current) {
      const printContent = printRef.current;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${currentProject.title}</title>
              <style>
                body { font-family: Times, serif; margin: 40px; line-height: 1.6; }
                .resume-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #334155; padding-bottom: 15px; }
                .resume-section { margin-bottom: 20px; }
                h1 { font-size: 24px; margin-bottom: 8px; }
                h2 { font-size: 18px; margin-bottom: 8px; border-bottom: 1px solid #666; padding-bottom: 4px; }
                .skills-tag { display: inline-block; background: #f0f0f0; padding: 2px 6px; margin: 2px; border-radius: 3px; }
                @media print { body { margin: 20px; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const sortedLayout = [...currentProject.layout].sort((a, b) => a.order - b.order);

  // Organize sections into rows for multi-column layout
  const organizeIntoRows = (sections: LayoutSection[]) => {
    const rows: { [key: number]: LayoutSection[] } = {};
    
    sections.forEach(section => {
      const rowNumber = section.row ?? section.order;
      if (!rows[rowNumber]) {
        rows[rowNumber] = [];
      }
      rows[rowNumber].push(section);
    });
    
    // Sort sections within each row by column
    Object.keys(rows).forEach(rowKey => {
      rows[parseInt(rowKey)].sort((a, b) => (a.column ?? 0) - (b.column ?? 0));
    });
    
    return rows;
  };

  const renderSectionRow = (sections: LayoutSection[], rowIndex: number) => {
    if (sections.length === 1 && sections[0].column === undefined) {
      // Single section, full width
      return (
        <React.Fragment key={sections[0].id}>
          <EditableSection
            section={sections[0]}
            onUpdate={handleSectionUpdate}
            onDelete={handleSectionDelete}
            onAddSection={handleAddSection}
          />
          <SectionDropZone 
            position={rowIndex + 1} 
            onAddSection={handleAddSection}
          />
        </React.Fragment>
      );
    }
    
    // Multi-column row
    const columnsInRow = sections[0]?.columnsInRow || sections.length;
    const columnWidth = `${100 / columnsInRow}%`;
    
    return (
      <React.Fragment key={`row-${rowIndex}`}>
        <div className="flex gap-4 w-full">
          {sections.map((section) => (
            <EditableSection
              key={section.id}
              section={section}
              onUpdate={handleSectionUpdate}
              onDelete={handleSectionDelete}
              onAddSection={handleAddSection}
              columnWidth={columnWidth}
            />
          ))}
        </div>
        <SectionDropZone 
          position={rowIndex + 1} 
          onAddSection={handleAddSection}
        />
      </React.Fragment>
    );
  };

  const organizedRows = organizeIntoRows(sortedLayout);

  const renderPreviewRow = (sections: LayoutSection[]) => {
    if (sections.length === 1 && sections[0].column === undefined) {
      // Single section, full width
      const section = sections[0];
      return (
        <div key={section.id} className="resume-section">
          {section.type === 'header' && (
            <div className="resume-header">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {section.title || 'Your Name'}
              </h1>
              <p className="text-lg text-slate-600">
                {Array.isArray(section.content) ? section.content.join(', ') : (section.content || 'Professional Title')}
              </p>
            </div>
          )}
          
          {section.type === 'contact' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2 border-b border-slate-300 pb-1">
                {section.title || 'Contact Information'}
              </h2>
              <div className="text-slate-700 whitespace-pre-line">
                {Array.isArray(section.content) ? section.content.join(', ') : (section.content || 'Add your contact information')}
              </div>
            </div>
          )}
          
          {section.type === 'skills' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2 border-b border-slate-300 pb-1">
                {section.title || 'Skills'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(section.content) ? section.content : 
                  (section.content ? section.content.split(',').map(s => s.trim()) : [])
                ).map((skill, index) => (
                  <span key={index} className="skills-tag bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {!['header', 'contact', 'skills'].includes(section.type) && (
            <div>
              {section.title && (
                <h2 className="text-lg font-semibold text-slate-900 mb-2 border-b border-slate-300 pb-1">
                  {section.title}
                </h2>
              )}
              <div className="text-slate-700 whitespace-pre-line">
                {Array.isArray(section.content) ? section.content.join(', ') : (section.content || 'Add content here')}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Multi-column row
    const columnsInRow = sections[0]?.columnsInRow || sections.length;
    
    return (
      <div key={`preview-row-${sections[0].row}`} className="flex gap-4 w-full resume-section">
        {sections.map((section) => (
          <div key={section.id} style={{ width: `${100 / columnsInRow}%` }}>
            {section.type === 'header' && (
              <div className="resume-header">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {section.title || 'Your Name'}
                </h1>
                <p className="text-base text-slate-600">
                  {Array.isArray(section.content) ? section.content.join(', ') : (section.content || 'Professional Title')}
                </p>
              </div>
            )}
            
            {section.type === 'contact' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-300 pb-1">
                  {section.title || 'Contact Information'}
                </h2>
                <div className="text-slate-700 text-sm whitespace-pre-line">
                  {Array.isArray(section.content) ? section.content.join(', ') : (section.content || 'Add your contact information')}
                </div>
              </div>
            )}
            
            {section.type === 'skills' && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-300 pb-1">
                  {section.title || 'Skills'}
                </h2>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(section.content) ? section.content : 
                    (section.content ? section.content.split(',').map(s => s.trim()) : [])
                  ).map((skill, index) => (
                    <span key={index} className="skills-tag bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {!['header', 'contact', 'skills'].includes(section.type) && (
              <div>
                {section.title && (
                  <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-300 pb-1">
                    {section.title}
                  </h2>
                )}
                <div className="text-slate-700 text-sm whitespace-pre-line">
                  {Array.isArray(section.content) ? section.content.join(', ') : (section.content || 'Add content here')}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AppLayout showHeader={false}>
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2 lg:gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="gap-2 text-slate-600 hover:text-slate-900 h-9"
              size="sm"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {currentProject.title}
              </h1>
              <p className="text-sm text-slate-500 capitalize">
                {currentProject.type.replace('-', ' ')} • Last updated {new Date(currentProject.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2 text-xs lg:text-sm h-9"
              size="sm"
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden sm:inline">Preview</span>
              <span className="sm:hidden">Preview</span>
            </Button>
            <button
              onClick={() => setShowAiModal(true)}
              className="btn-ai gap-2 text-xs lg:text-sm h-9 px-3 py-2 group flex items-center justify-center rounded-lg"
            >
              <Wand2 size={14} className="group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline font-bold">AI Generate</span>
              <span className="sm:hidden font-bold">AI</span>
            </button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="gap-2 text-xs lg:text-sm h-9"
              size="sm"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 xl:gap-8">
          {/* Editor */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Editor</span>
                  <Button
                    onClick={() => handleAddSection()}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus size={16} />
                    Add Section
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={sortedLayout.map(section => section.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {/* Drop zone at the beginning */}
                    <SectionDropZone 
                      position={0} 
                      onAddSection={handleAddSection}
                    />
                    
                    {Object.keys(organizedRows)
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(rowKey => {
                        const rowIndex = parseInt(rowKey);
                        const sections = organizedRows[rowIndex];
                        return renderSectionRow(sections, rowIndex);
                      })
                    }
                  </SortableContext>
                  <DragOverlay>
                    {activeId ? (
                      <div className="opacity-90 scale-105 shadow-2xl">
                        <EditableSection
                          section={sortedLayout.find(s => s.id === activeId)!}
                          onUpdate={() => {}}
                          onDelete={() => {}}
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview */}
          {showPreview && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="xl:sticky xl:top-8 xl:h-fit"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Live Preview</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-500">Auto-saving</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border border-slate-200 rounded-lg p-8 resume-preview" ref={printRef}>
                    {Object.keys(organizedRows)
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(rowKey => {
                        const rowIndex = parseInt(rowKey);
                        const sections = organizedRows[rowIndex];
                        return renderPreviewRow(sections);
                      })
                    }
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* AI Generate Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[40000]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4 relative z-[40000]"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Generate with AI
            </h3>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what you want to generate or improve..."
              className="input-field min-h-24 mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAiModal(false)}
                className="flex-1 h-10"
                size="default"
              >
                Cancel
              </Button>
              <button
                onClick={handleGenerateLayout}
                disabled={isGenerating || !aiPrompt.trim()}
                className={`btn-ai flex-1 gap-2 h-10 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center ${
                  isGenerating ? 'animate-pulse' : ''
                }`}
              >
                <Wand2 size={16} className="group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-bold">{isGenerating ? 'Generating...' : 'Generate'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}; 