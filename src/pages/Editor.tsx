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
import { EditableSection } from '../components/Editor/EditableSection';
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
  const printRef = useRef<HTMLDivElement>(null);

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
    const updatedLayout = currentProject.layout.filter(section => section.id !== sectionId);
    
    try {
      await updateLayout(updatedLayout);
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section. Please try again.');
    }
  };

  const handleAddSection = async () => {
    const newSection: LayoutSection = {
      id: `section-${Date.now()}`,
      type: 'section',
      title: 'New Section',
      content: 'Add your content here...',
      order: currentProject.layout.length
    };

    const updatedLayout = [...currentProject.layout, newSection];
    
    try {
      await updateLayout(updatedLayout);
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Failed to add section. Please try again.');
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

  return (
    <AppLayout showHeader={false}>
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/projects')}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={20} />
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
              className="gap-2 text-xs lg:text-sm xl:hidden"
              size="sm"
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              Preview
            </Button>
            <button
              onClick={() => setShowAiModal(true)}
              className="btn-ai gap-2 text-xs lg:text-sm px-3 py-2 group"
            >
              <Wand2 size={16} className="group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline font-bold">AI Generate</span>
              <span className="sm:hidden font-bold">AI</span>
            </button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="gap-2 text-xs lg:text-sm"
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
                    onClick={handleAddSection}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus size={16} />
                    Add Section
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedLayout.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <EditableSection
                      section={section}
                      onUpdate={handleSectionUpdate}
                      onDelete={handleSectionDelete}
                    />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview */}
          {(showPreview || isDesktop) && (
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
                    {sortedLayout.map((section) => (
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* AI Generate Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
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
                className="flex-1"
              >
                Cancel
              </Button>
              <button
                onClick={handleGenerateLayout}
                disabled={isGenerating || !aiPrompt.trim()}
                className={`btn-ai flex-1 gap-2 disabled:opacity-50 disabled:cursor-not-allowed group ${
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