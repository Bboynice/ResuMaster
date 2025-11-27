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
  EyeOff,
  X,
  FileText
} from 'lucide-react';
// @ts-ignore - html2pdf.js doesn't have TypeScript definitions
import html2pdf from 'html2pdf.js';
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
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { EditableSection } from '../components/Editor/EditableSection';
import { SectionDropZone } from '../components/Editor/SectionDropZone';
import { AppLayout } from '../components/Layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FontSelector, FontSizeSelector, BackgroundColorSelector } from '../components/ui/select';
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
  const [selectedFont, setSelectedFont] = useState('Times, "Times New Roman", serif');
  const [selectedFontSize, setSelectedFontSize] = useState('14px');
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState('#ffffff');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFileName, setExportFileName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Professional document limits to ensure one-page layout
  const MAX_SECTIONS = {
    'resume': 8,        // Header, Contact, Summary, Experience, Skills, Education + 2 optional
    'cover-letter': 6   // Header, Contact, Intro, 2-3 Body paragraphs, Closing
  } as const;

  // Helper functions for section limits
  const getMaxSections = () => currentProject ? MAX_SECTIONS[currentProject.type] : 0;
  const isAtMaxSections = () => currentProject ? currentProject.layout.length >= getMaxSections() : false;
  const isNearMaxSections = () => currentProject ? currentProject.layout.length >= getMaxSections() - 1 : false;
  const getSectionProgress = () => currentProject ? (currentProject.layout.length / getMaxSections()) * 100 : 0;

  // Note: Font properties are applied directly to resume containers via inline styles
  // This prevents affecting other UI elements like modals

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
            <p className="text-slate-600 dark:text-slate-400">Loading project...</p>
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
    // Check section limits to maintain one-page layout
    if (isAtMaxSections()) {
      alert(`Maximum ${getMaxSections()} sections reached!\n\nFor professional ${currentProject.type.replace('-', ' ')}s, we recommend keeping content to one page. Consider combining or shortening existing sections instead.`);
      return;
    }

    const newSection: LayoutSection = {
      id: `section-${Date.now()}`,
      type: 'section',
      title: 'Section Title',
      content: 'Add content here',
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
      const activeSection = currentProject.layout.find(s => s.id === active.id);
      const overSection = currentProject.layout.find(s => s.id === over.id);

      if (!activeSection || !overSection) return;

      let updatedLayout = [...currentProject.layout];

      // Check if both sections are in the same row (horizontal reordering)
      if (activeSection.row !== undefined && overSection.row !== undefined && activeSection.row === overSection.row) {
        // Horizontal reordering within the same row
        const sectionsInRow = updatedLayout.filter(s => s.row === activeSection.row);
        const sortedSectionsInRow = sectionsInRow.sort((a, b) => (a.column ?? 0) - (b.column ?? 0));
        
        const oldColumnIndex = sortedSectionsInRow.findIndex(s => s.id === active.id);
        const newColumnIndex = sortedSectionsInRow.findIndex(s => s.id === over.id);

        if (oldColumnIndex !== -1 && newColumnIndex !== -1) {
          const reorderedSections = arrayMove(sortedSectionsInRow, oldColumnIndex, newColumnIndex);
          
          // Update column numbers for all sections in this row
          reorderedSections.forEach((section, index) => {
            const sectionIndex = updatedLayout.findIndex(s => s.id === section.id);
            if (sectionIndex !== -1) {
              updatedLayout[sectionIndex] = {
                ...updatedLayout[sectionIndex],
                column: index
              };
            }
          });
        }
      } else {
        // Vertical reordering or moving between different row types
        const sortedLayout = [...updatedLayout].sort((a, b) => a.order - b.order);
        const oldIndex = sortedLayout.findIndex(section => section.id === active.id);
        const newIndex = sortedLayout.findIndex(section => section.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newLayout = arrayMove(sortedLayout, oldIndex, newIndex);
          
          // Reset column properties when moving between different contexts
          const movedSection = newLayout[newIndex];
          if (movedSection.row !== undefined || movedSection.column !== undefined) {
            newLayout[newIndex] = {
              ...movedSection,
              row: undefined,
              column: undefined,
              columnsInRow: undefined
            };
          }
          
          updatedLayout = newLayout.map((section, index) => ({
            ...section,
            order: index
          }));
        }
      }

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
    // Set default filename and open modal
    const defaultFileName = currentProject.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    setExportFileName(defaultFileName);
    setShowExportModal(true);
  };

  // Generate HTML content directly from layout data
  const generateHTMLContent = () => {
    const rows = organizeIntoRows(sortedLayout);
    
    const renderSectionHTML = (section: LayoutSection) => {
      if (section.type === 'header') {
        return `
          <div class="resume-header">
            ${section.title ? `<h1>${section.title}</h1>` : ''}
            ${section.content ? `<p>${Array.isArray(section.content) ? section.content.join(', ') : section.content}</p>` : ''}
          </div>
        `;
      }
      
      if (section.type === 'contact') {
        return `
          <div class="resume-section">
            ${section.title ? `<h2>${section.title}</h2>` : ''}
            ${section.content ? `<div>${Array.isArray(section.content) ? section.content.join(', ') : section.content}</div>` : ''}
          </div>
        `;
      }
      
      if (section.type === 'skills') {
        const skills = Array.isArray(section.content) ? section.content : 
          (section.content ? section.content.split(',').map(s => s.trim()) : []);
        const skillsHTML = skills.filter(skill => skill && skill.length > 0)
          .map(skill => `<span class="skills-tag">${skill}</span>`)
          .join('');
        
        return `
          <div class="resume-section">
            ${section.title ? `<h2>${section.title}</h2>` : ''}
            <div class="skills-container">${skillsHTML}</div>
          </div>
        `;
      }
      
      // Default section type
      return `
        <div class="resume-section">
          ${section.title ? `<h2>${section.title}</h2>` : ''}
          ${section.content ? `<div>${Array.isArray(section.content) ? section.content.join(', ') : section.content}</div>` : ''}
        </div>
      `;
    };
    
    const renderRowHTML = (sections: LayoutSection[]) => {
      if (sections.length === 1 && sections[0].column === undefined) {
        return renderSectionHTML(sections[0]);
      }
      
      // Multi-column row
      const columnsInRow = sections[0]?.columnsInRow || sections.length;
      const sectionsHTML = sections.map(section => `
        <div style="width: ${100 / columnsInRow}%;">
          ${renderSectionHTML(section)}
        </div>
      `).join('');
      
      return `<div style="display: flex; gap: 1rem;">${sectionsHTML}</div>`;
    };
    
    const sectionsHTML = Object.keys(rows)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(rowKey => {
        const rowIndex = parseInt(rowKey);
        const sections = rows[rowIndex];
        return renderRowHTML(sections);
      })
      .join('');
    
    // Wrap in the same structure as live preview
    return `<div class="space-y-1">${sectionsHTML}</div>`;
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    
    try {
      // Use the actual preview element instead of generating new HTML
      if (!printRef.current) {
        throw new Error('Preview element not found');
      }
      
      // Clone the preview element to avoid modifying the original
      const sourceElement = printRef.current;
      const clonedElement = sourceElement.cloneNode(true) as HTMLElement;
      
      // Create a container that will fill the entire PDF page
      const container = document.createElement('div');
      container.style.width = '794px';  // A4 width in pixels
      container.style.height = '1123px'; // A4 height in pixels
      container.style.margin = '0';
      container.style.padding = '0';
      container.style.backgroundColor = selectedBackgroundColor;
      container.style.boxSizing = 'border-box';
      container.style.position = 'relative';
      container.style.overflow = 'hidden';
      container.style.fontFamily = selectedFont;
      container.style.fontSize = selectedFontSize;
      
      // Style the cloned element to fit in the container
      clonedElement.style.width = '100%';
      clonedElement.style.height = '100%';
      clonedElement.style.margin = '0';
      clonedElement.style.padding = '32px';
      clonedElement.style.boxSizing = 'border-box';
      clonedElement.style.overflow = 'hidden';
      clonedElement.style.backgroundColor = selectedBackgroundColor;
      clonedElement.style.fontFamily = selectedFont;
      clonedElement.style.fontSize = selectedFontSize;
      clonedElement.style.lineHeight = '1.6';
      
      // Fix spacing issues by directly modifying elements
      const fixPDFSpacing = (element: HTMLElement) => {
        // Fix section headers (h2 elements with borders)
        const headers = element.querySelectorAll('h2');
        headers.forEach((header) => {
          if (header instanceof HTMLElement) {
            header.style.paddingBottom = '10px'; // Increased space between title and thin line
            header.style.marginBottom = '8px';
            header.style.lineHeight = '1.4';
          }
        });
        
        // Fix skills tags (emerald background elements) - more aggressive centering
        const skillTags = element.querySelectorAll('.bg-emerald-100');
        skillTags.forEach((tag) => {
          if (tag instanceof HTMLElement) {
            tag.style.padding = '6px 8px'; // Increased vertical padding
            tag.style.lineHeight = '1'; // Tighter line height
            tag.style.display = 'inline-flex';
            tag.style.alignItems = 'center';
            tag.style.justifyContent = 'center';
            tag.style.verticalAlign = 'top';
            tag.style.minHeight = '24px'; // Minimum height for consistent sizing
            tag.style.fontSize = 'inherit'; // Ensure font size is consistent
            
            // Also fix any text inside the tags
            const textNodes = tag.querySelectorAll('*');
            textNodes.forEach((textNode) => {
              if (textNode instanceof HTMLElement) {
                textNode.style.lineHeight = '1';
                textNode.style.margin = '0';
                textNode.style.padding = '0';
                textNode.style.verticalAlign = 'baseline';
              }
            });
          }
        });
        
        // Fix section spacing
        const sections = element.querySelectorAll('.resume-section');
        sections.forEach((section) => {
          if (section instanceof HTMLElement) {
            section.style.marginBottom = '14px';
          }
        });
        
        // Fix header spacing
        const headerSections = element.querySelectorAll('.resume-header');
        headerSections.forEach((header) => {
          if (header instanceof HTMLElement) {
            header.style.paddingBottom = '10px';
            header.style.marginBottom = '18px';
          }
        });
      };
      
      fixPDFSpacing(clonedElement);
      
      // Add the cloned element to the container
      container.appendChild(clonedElement);
      
      // Add minimal CSS for clean PDF generation
      const style = document.createElement('style');
      style.textContent = `
        * {
          box-sizing: border-box !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: ${selectedBackgroundColor} !important;
          overflow: hidden !important;
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(container);
      
      // Generate PDF with no margins to fill entire page
      const opt = {
        margin: 0, // Remove all margins
        filename: `${exportFileName}.pdf`,
        image: { 
          type: 'jpeg', 
          quality: 0.98 
        },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          allowTaint: true,
          backgroundColor: selectedBackgroundColor,
          width: 794, // A4 width in pixels at 96 DPI (210mm)
          height: 1123, // A4 height in pixels at 96 DPI (297mm)
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };
      
      await html2pdf().set(opt).from(container).save();
      
      // Clean up
      document.body.removeChild(container);
      document.head.removeChild(style);
      
      setShowExportModal(false);
      setExportFileName('');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
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
    
    // Multi-column row with horizontal sorting
    const columnsInRow = sections[0]?.columnsInRow || sections.length;
    const columnWidth = `${100 / columnsInRow}%`;
    
    return (
      <React.Fragment key={`row-${rowIndex}`}>
        <SortableContext 
          items={sections.map(section => section.id)}
          strategy={horizontalListSortingStrategy}
        >
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
        </SortableContext>
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
            {section.title && (
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {section.title}
              </h1>
            )}
            {section.content && (
              <p className="text-lg text-slate-600">
                {Array.isArray(section.content) ? section.content.join(', ') : section.content}
              </p>
            )}
          </div>
        )}
                        
                                {section.type === 'contact' && (
          <div>
            {section.title && (
              <h2 className="text-lg font-semibold text-slate-900 mb-2 border-b border-slate-300 pb-1">
                {section.title}
              </h2>
            )}
            {section.content && (
              <div className="text-slate-700 whitespace-pre-line">
                {Array.isArray(section.content) ? section.content.join(', ') : section.content}
              </div>
            )}
          </div>
        )}
                        
                                {section.type === 'skills' && (
          <div>
            {section.title && (
              <h2 className="text-lg font-semibold text-slate-900 mb-2 border-b border-slate-300 pb-1">
                {section.title}
              </h2>
            )}
            {section.content && (
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(section.content) ? section.content : 
                  (section.content ? section.content.split(',').map(s => s.trim()) : [])
                ).filter(skill => skill && skill.length > 0).map((skill, index) => (
                  <span key={index} className="skills-tag bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
                        
                                {!['header', 'contact', 'skills'].includes(section.type) && (
          <div>
            {section.title && (
              <h2 className="text-lg font-semibold text-slate-900 mb-2 border-b border-slate-300 pb-1">
                {section.title}
              </h2>
            )}
            {section.content && (
              <div className="text-slate-700 whitespace-pre-line">
                {Array.isArray(section.content) ? section.content.join(', ') : section.content}
              </div>
            )}
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
                {section.title && (
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {section.title}
                  </h1>
                )}
                {section.content && (
                  <p className="text-base text-slate-600">
                    {Array.isArray(section.content) ? section.content.join(', ') : section.content}
                  </p>
                )}
              </div>
            )}
            
            {section.type === 'contact' && (
              <div>
                {section.title && (
                  <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-300 pb-1">
                    {section.title}
                  </h2>
                )}
                {section.content && (
                  <div className="text-slate-700 text-sm whitespace-pre-line">
                    {Array.isArray(section.content) ? section.content.join(', ') : section.content}
                  </div>
                )}
              </div>
            )}
            
            {section.type === 'skills' && (
              <div>
                {section.title && (
                  <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-300 pb-1">
                    {section.title}
                  </h2>
                )}
                {section.content && (
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(section.content) ? section.content : 
                      (section.content ? section.content.split(',').map(s => s.trim()) : [])
                    ).filter(skill => skill && skill.length > 0).map((skill, index) => (
                      <span key={index} className="skills-tag bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
                        {!['header', 'contact', 'skills'].includes(section.type) && (
              <div>
                {section.title && (
                  <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-300 pb-1">
                    {section.title}
                  </h2>
                )}
                {section.content && (
                  <div className="text-slate-700 text-sm whitespace-pre-line">
                    {Array.isArray(section.content) ? section.content.join(', ') : section.content}
                  </div>
                )}
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
              className="gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 h-9"
              size="sm"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {currentProject.title}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
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
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>Editor</span>
                  <div className="flex items-center gap-2">
                    <FontSelector
                      selectedFont={selectedFont}
                      onFontChange={setSelectedFont}
                      className="h-9"
                    />
                    <FontSizeSelector
                      selectedSize={selectedFontSize}
                      onSizeChange={setSelectedFontSize}
                      className="h-9"
                    />
                    <BackgroundColorSelector
                      selectedColor={selectedBackgroundColor}
                      onColorChange={setSelectedBackgroundColor}
                      className="h-9"
                    />
                    <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleAddSection()}
                      size="sm"
                        disabled={isAtMaxSections()}
                        className={`gap-2 h-9 ${isAtMaxSections() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isAtMaxSections() 
                          ? `Maximum ${getMaxSections()} sections reached for one-page ${currentProject.type.replace('-', ' ')}`
                          : `Add section (${currentProject.layout.length}/${getMaxSections()})`
                        }
                    >
                      <Plus size={16} />
                      Add Section
                    </Button>
                      
                      {/* Section Progress Indicator */}
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              getSectionProgress() >= 100 ? 'bg-red-500' : 
                              getSectionProgress() >= 87.5 ? 'bg-yellow-500' : 
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(getSectionProgress(), 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          isAtMaxSections() ? 'text-red-600 dark:text-red-400' :
                          isNearMaxSections() ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-slate-600 dark:text-neutral-400'
                        }`}>
                          {currentProject.layout.length}/{getMaxSections()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              
              {/* Professional One-Page Guidance */}
              {(isNearMaxSections() || isAtMaxSections()) && (
                <div className={`mx-6 mb-4 p-3 rounded-lg border ${
                  isAtMaxSections() 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isAtMaxSections() ? 'bg-red-500' : 'bg-yellow-500'
                    }`}>
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        isAtMaxSections() 
                          ? 'text-red-800 dark:text-red-200' 
                          : 'text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {isAtMaxSections() 
                          ? `Maximum sections reached (${getMaxSections()})` 
                          : `Approaching section limit (${currentProject.layout.length}/${getMaxSections()})`
                        }
                      </p>
                      <p className={`text-xs mt-1 ${
                        isAtMaxSections() 
                          ? 'text-red-700 dark:text-red-300' 
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        Professional {currentProject.type.replace('-', ' ')}s should fit on one page. 
                        {isAtMaxSections() 
                          ? ' Consider combining or shortening existing sections.' 
                          : ' Consider if all sections are essential for your one-page layout.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <CardContent 
                className="space-y-4 resume-content"
                style={{ 
                  '--resume-font-family': selectedFont,
                  '--resume-font-size': selectedFontSize,
                  '--resume-background-color': selectedBackgroundColor
                } as React.CSSProperties}
              >
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={sortedLayout.filter(section => section.column === undefined).map(section => section.id)}
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
              className="xl:sticky xl:top-8 xl:h-fit xl:max-h-[calc(100vh-4rem)] xl:overflow-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Live Preview</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Auto-saving</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* A4 Page Container - Real Size */}
                  <div className="bg-gray-100 dark:bg-neutral-700 p-4 rounded-lg overflow-auto max-h-[80vh]">
                    {/* Page Border Indicator */}
                    <div className="mb-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      A4 Page - Actual Size (210 × 297 mm)
                    </div>
                    
                    {/* Fixed A4 Container - Real Size */}
                    <div 
                      className="border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-lg bg-white dark:bg-neutral-800 relative overflow-hidden mx-auto"
                      style={{
                        width: '794px',      // A4 width at 96 DPI - ACTUAL SIZE
                        height: '1123px',    // A4 height at 96 DPI - ACTUAL SIZE
                        minWidth: '794px',   // Prevent shrinking
                        minHeight: '1123px', // Prevent shrinking
                      }}
                    >
                      {/* Page Content */}
                      <div 
                        className="resume-preview w-full h-full p-8 overflow-hidden relative" 
                    ref={printRef}
                    style={{ 
                          fontFamily: selectedFont,
                          fontSize: selectedFontSize,
                          backgroundColor: selectedBackgroundColor,
                      '--resume-font-family': selectedFont,
                      '--resume-font-size': selectedFontSize,
                      '--resume-background-color': selectedBackgroundColor
                    } as React.CSSProperties}
                  >
                        <div className="space-y-1">
                    {Object.keys(organizedRows)
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(rowKey => {
                        const rowIndex = parseInt(rowKey);
                        const sections = organizedRows[rowIndex];
                        return renderPreviewRow(sections);
                      })
                    }
                        </div>
                      </div>
                      
                      {/* Page Overflow Indicator */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-red-500/20 to-transparent pointer-events-none"
                        style={{
                          display: 'none' // Will show via JS if content overflows
                        }}
                      />
                    </div>
                    
                    {/* Page Utilization Info */}
                    <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Sections:</span>
                        <span className="text-slate-700 dark:text-slate-300">{currentProject.layout.length}/{getMaxSections()}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Font:</span>
                        <span className="text-slate-700 dark:text-slate-300">{selectedFontSize}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Layout:</span>
                        <span className={`font-medium ${
                          currentProject.layout.length > 6 ? 'text-yellow-600 dark:text-yellow-400' :
                          currentProject.layout.length > 4 ? 'text-blue-600 dark:text-blue-400' :
                          'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {currentProject.layout.length > 6 ? 'Dense' :
                           currentProject.layout.length > 4 ? 'Balanced' : 'Spacious'}
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">✓ Actual Size</span>
                      </div>
                    </div>
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
            className="bg-white dark:bg-neutral-800 rounded-xl p-6 w-full max-w-md mx-4 relative z-[40000]"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
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

      {/* Export PDF Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[40000] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl w-full max-w-6xl relative z-[40000] max-h-[95vh] overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-neutral-700 bg-slate-50/50 dark:bg-neutral-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-lg flex items-center justify-center shadow-sm">
                  <FileText size={20} className="text-purple-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100">
                    Export PDF
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-neutral-400 hidden sm:block">
                    Download your {currentProject.type.replace('-', ' ')} as a PDF file
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowExportModal(false)}
                className="h-8 w-8 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-700"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Modal Content - Responsive Layout */}
            <div className="flex flex-col lg:flex-row max-h-[calc(95vh-80px)]">
              {/* Settings Panel */}
              <div className="w-full lg:w-80 xl:w-96 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-neutral-700 overflow-y-auto bg-slate-50/30 dark:bg-neutral-800/30">
                <div className="space-y-4 sm:space-y-6">
                  {/* File Name */}
                  <div>
                    <label htmlFor="filename" className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-2">
                      File Name
                    </label>
                    <input
                      id="filename"
                      type="text"
                      value={exportFileName}
                      onChange={(e) => setExportFileName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-purple-500 dark:focus:ring-emerald-400 focus:border-transparent transition-colors"
                      placeholder="Enter filename..."
                    />
                    <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">
                      File will be saved as "<span className="text-slate-700 dark:text-neutral-300 font-medium">{exportFileName}.pdf</span>"
                    </p>
                  </div>

                  {/* Document Details */}
                  <div className="bg-white/60 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Document Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-neutral-400">Type:</span>
                        <span className="text-slate-900 dark:text-neutral-100 capitalize font-medium px-2 py-1 bg-slate-100 dark:bg-neutral-700 rounded text-xs">
                          {currentProject.type.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-neutral-400">Sections:</span>
                        <span className="text-slate-900 dark:text-neutral-100 font-medium">
                          {currentProject.layout.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-slate-600 dark:text-neutral-400">Font:</span>
                        <span className="text-slate-900 dark:text-neutral-100 text-xs text-right max-w-28 truncate">
                          {selectedFont.split(',')[0].replace(/"/g, '')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-neutral-400">Size:</span>
                        <span className="text-slate-900 dark:text-neutral-100 font-medium">
                          {selectedFontSize}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleDownloadPDF}
                      disabled={!exportFileName.trim() || isExporting}
                      className="w-full gap-2 h-11 bg-neutral-900 hover:bg-neutral-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Save PDF
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowExportModal(false)}
                      className="w-full h-11 border-slate-300 dark:border-neutral-600 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800"
                      disabled={isExporting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <div className="mb-4">
                  <h4 className="font-medium text-slate-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
                    <Eye size={16} className="text-purple-600 dark:text-emerald-400" />
                    Live Preview
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-neutral-400">
                    This is exactly how your PDF will look when downloaded
                  </p>
                </div>
                
                {/* Preview Container - Real A4 Size */}
                <div className="bg-gray-100 dark:bg-neutral-700 p-4 rounded-lg overflow-auto max-h-[70vh]">
                  {/* Page Indicator */}
                  <div className="mb-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 dark:bg-emerald-500 rounded-full"></div>
                    A4 PDF Preview - Actual Size (210 × 297 mm)
                  </div>
                  
                  {/* Fixed A4 Container - Actual Size */}
                  <div 
                    className="border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-lg bg-white dark:bg-neutral-800 relative overflow-hidden mx-auto"
                    style={{
                      width: '794px',      // A4 width at 96 DPI - ACTUAL SIZE
                      height: '1123px',    // A4 height at 96 DPI - ACTUAL SIZE
                      minWidth: '794px',   // Prevent shrinking
                      minHeight: '1123px', // Prevent shrinking
                    }}
                  >
                    {/* Page Content - USE SAME COMPONENTS AS MAIN PREVIEW */}
                    <div 
                      className="resume-preview w-full h-full p-8 overflow-hidden relative" 
                      style={{ 
                        fontFamily: selectedFont,
                        fontSize: selectedFontSize,
                        backgroundColor: selectedBackgroundColor,
                        '--resume-font-family': selectedFont,
                        '--resume-font-size': selectedFontSize,
                        '--resume-background-color': selectedBackgroundColor
                      } as React.CSSProperties}
                    >
                      <div className="space-y-1">
                        {Object.keys(organizedRows)
                          .sort((a, b) => parseInt(a) - parseInt(b))
                          .map(rowKey => {
                            const rowIndex = parseInt(rowKey);
                            const sections = organizedRows[rowIndex];
                            return renderPreviewRow(sections);
                          })
                        }
                      </div>
                    </div>
                    
                    {/* Content Overflow Warning */}
                    {currentProject.layout.length > 6 && (
                      <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs px-2 py-1 rounded-md shadow">
                        Dense Layout
                      </div>
                    )}
                  </div>
                  
                  {/* Export Info */}
                  <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-purple-600 dark:text-emerald-400">✓ Exact PDF Output</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-purple-600 dark:text-emerald-400">✓ 1:1 Scale</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-purple-600 dark:text-emerald-400">✓ WYSIWYG</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}; 