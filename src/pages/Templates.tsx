import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Mail, Plus } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { AppLayout } from '../components/Layout/AppLayout';
import type { LayoutSection } from '../types';

interface Template {
  id: string;
  title: string;
  type: 'resume' | 'cover-letter';
  description: string;
  preview: string;
  layout: LayoutSection[];
}

const resumeTemplates: Template[] = [
  {
    id: 'modern-resume',
    title: 'Modern Professional',
    type: 'resume',
    description: 'Clean and modern design perfect for tech and business professionals',
    preview: 'A sleek, minimalist resume with clear sections and professional typography',
    layout: [
      {
        id: 'header-1',
        type: 'header',
        title: 'Your Name',
        content: 'Professional Title',
        order: 0
      },
      {
        id: 'contact-1',
        type: 'contact',
        title: 'Contact Information',
        content: 'your.email@example.com | (555) 123-4567 | LinkedIn: linkedin.com/in/yourname',
        order: 1
      },
      {
        id: 'section-1',
        type: 'section',
        title: 'Professional Summary',
        content: 'Results-driven professional with expertise in [your field]. Proven track record of success.',
        order: 2
      },
      {
        id: 'experience-1',
        type: 'experience',
        title: 'Professional Experience',
        content: 'Senior Position | Company Name | 2020 - Present\n• Key achievement or responsibility\n• Another significant accomplishment\n• Third important contribution',
        order: 3
      },
      {
        id: 'skills-1',
        type: 'skills',
        title: 'Core Competencies',
        content: ['Leadership', 'Project Management', 'Strategic Planning', 'Data Analysis', 'Communication', 'Problem Solving'],
        order: 4
      },
      {
        id: 'education-1',
        type: 'education',
        title: 'Education',
        content: 'Degree in Field of Study\nUniversity Name | Graduation Year',
        order: 5
      }
    ]
  },
  {
    id: 'creative-resume',
    title: 'Creative Professional',
    type: 'resume',
    description: 'Eye-catching design for creative industries and portfolio-based roles',
    preview: 'A visually appealing resume with creative elements while maintaining professionalism',
    layout: [
      {
        id: 'header-1',
        type: 'header',
        title: 'Your Creative Name',
        content: 'Creative Professional | Designer | Innovator',
        order: 0
      },
      {
        id: 'contact-1',
        type: 'contact',
        title: 'Get in Touch',
        content: 'hello@yourname.com | (555) 123-4567 | Portfolio: yourname.com',
        order: 1
      },
      {
        id: 'section-1',
        type: 'section',
        title: 'Creative Vision',
        content: 'Passionate creative professional bringing innovative ideas to life. Specialized in visual storytelling.',
        order: 2
      },
      {
        id: 'experience-1',
        type: 'experience',
        title: 'Creative Experience',
        content: 'Senior Designer | Creative Agency | 2019 - Present\n• Led creative campaigns with measurable results\n• Collaborated with cross-functional teams\n• Managed projects from concept to completion',
        order: 3
      },
      {
        id: 'skills-1',
        type: 'skills',
        title: 'Creative Skills & Tools',
        content: ['Adobe Creative Suite', 'UI/UX Design', 'Brand Development', 'Typography', 'Creative Strategy', 'Visual Storytelling'],
        order: 4
      }
    ]
  },
  {
    id: 'entry-level-resume',
    title: 'Entry Level Professional',
    type: 'resume',
    description: 'Perfect for recent graduates and early-career professionals',
    preview: 'A structured resume highlighting education, skills, and potential',
    layout: [
      {
        id: 'header-1',
        type: 'header',
        title: 'Your Name',
        content: 'Recent Graduate | Aspiring Professional',
        order: 0
      },
      {
        id: 'contact-1',
        type: 'contact',
        title: 'Contact Details',
        content: 'your.email@example.com | (555) 123-4567 | LinkedIn: linkedin.com/in/yourname',
        order: 1
      },
      {
        id: 'section-1',
        type: 'section',
        title: 'Professional Objective',
        content: 'Motivated graduate seeking an entry-level position to apply academic knowledge and develop professional skills.',
        order: 2
      },
      {
        id: 'education-1',
        type: 'education',
        title: 'Education',
        content: 'Bachelor of [Major]\nUniversity Name | Graduation Year\nRelevant Coursework: Course 1, Course 2, Course 3',
        order: 3
      },
      {
        id: 'experience-1',
        type: 'experience',
        title: 'Experience & Internships',
        content: 'Internship Title | Company | Dates\n• Gained hands-on experience in relevant field\n• Contributed to team projects and initiatives\n• Developed practical skills and knowledge',
        order: 4
      },
      {
        id: 'skills-1',
        type: 'skills',
        title: 'Technical & Soft Skills',
        content: ['Microsoft Office', 'Data Analysis', 'Research', 'Team Collaboration', 'Communication', 'Time Management'],
        order: 5
      }
    ]
  }
];

const coverLetterTemplates: Template[] = [
  {
    id: 'professional-cover-letter',
    title: 'Professional Standard',
    type: 'cover-letter',
    description: 'Classic, professional cover letter format suitable for most industries',
    preview: 'A well-structured cover letter with clear introduction, body, and closing',
    layout: [
      {
        id: 'header-1',
        type: 'header',
        title: 'Your Name',
        content: 'Professional Title',
        order: 0
      },
      {
        id: 'contact-1',
        type: 'contact',
        title: 'Contact Information',
        content: 'your.email@example.com | (555) 123-4567\n[Date]\n\n[Hiring Manager Name]\n[Company Name]\n[Company Address]',
        order: 1
      },
      {
        id: 'text-1',
        type: 'text',
        title: 'Opening',
        content: 'Dear [Hiring Manager Name],\n\nI am writing to express my strong interest in the [Position Title] role at [Company Name]. With my experience in [relevant field], I am excited about the opportunity to contribute to your team.',
        order: 2
      },
      {
        id: 'text-2',
        type: 'text',
        title: 'Body Paragraph',
        content: 'In my current role as [Current Position], I have successfully [specific achievement]. This experience has strengthened my expertise in [relevant skills] and I believe my background aligns perfectly with your needs.',
        order: 3
      },
      {
        id: 'text-3',
        type: 'text',
        title: 'Closing',
        content: 'Thank you for considering my application. I would welcome the opportunity to discuss how my experience can contribute to [Company Name]. I look forward to hearing from you.\n\nSincerely,\n[Your Name]',
        order: 4
      }
    ]
  },
  {
    id: 'career-change-cover-letter',
    title: 'Career Transition',
    type: 'cover-letter',
    description: 'Tailored for professionals making a career change',
    preview: 'Focuses on transferable skills and motivation for career change',
    layout: [
      {
        id: 'header-1',
        type: 'header',
        title: 'Your Name',
        content: 'Transitioning Professional',
        order: 0
      },
      {
        id: 'contact-1',
        type: 'contact',
        title: 'Contact Information',
        content: 'your.email@example.com | (555) 123-4567\n[Date]\n\n[Hiring Manager Name]\n[Company Name]',
        order: 1
      },
      {
        id: 'text-1',
        type: 'text',
        title: 'Opening',
        content: 'Dear [Hiring Manager Name],\n\nI am excited to apply for the [Position Title] at [Company Name]. While my background is in [previous field], I am passionate about transitioning to [new field].',
        order: 2
      },
      {
        id: 'text-2',
        type: 'text',
        title: 'Transferable Skills',
        content: 'My experience in [previous field] has given me valuable transferable skills including [skill 1], [skill 2], and [skill 3]. These abilities directly apply to [target role] and will help me excel in this new direction.',
        order: 3
      },
      {
        id: 'text-3',
        type: 'text',
        title: 'Closing',
        content: 'I would love to discuss how my unique background can bring fresh perspectives to your team. Thank you for your consideration.\n\nBest regards,\n[Your Name]',
        order: 4
      }
    ]
  },
  {
    id: 'entry-level-cover-letter',
    title: 'Entry Level Professional',
    type: 'cover-letter',
    description: 'Perfect for recent graduates and entry-level job seekers',
    preview: 'Emphasizes education, internships, and eagerness to learn',
    layout: [
      {
        id: 'header-1',
        type: 'header',
        title: 'Your Name',
        content: 'Recent Graduate',
        order: 0
      },
      {
        id: 'contact-1',
        type: 'contact',
        title: 'Contact Information',
        content: 'your.email@example.com | (555) 123-4567\n[Date]\n\n[Hiring Manager Name]\n[Company Name]',
        order: 1
      },
      {
        id: 'text-1',
        type: 'text',
        title: 'Opening',
        content: 'Dear [Hiring Manager Name],\n\nAs a recent [Degree] graduate, I am excited to apply for the [Position Title] at [Company Name]. I bring fresh perspectives and genuine enthusiasm for [industry/field].',
        order: 2
      },
      {
        id: 'text-2',
        type: 'text',
        title: 'Education & Experience',
        content: 'During my studies, I gained valuable experience through [internship/project] where I [achievement]. Combined with my academic focus on [subjects], I am prepared to contribute to your team.',
        order: 3
      },
      {
        id: 'text-3',
        type: 'text',
        title: 'Closing',
        content: 'I would be thrilled to discuss how my fresh perspective and dedication can benefit [Company Name]. Thank you for your consideration.\n\nSincerely,\n[Your Name]',
        order: 4
      }
    ]
  }
];

export const Templates: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'all' | 'resume' | 'cover-letter'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const { createProject } = useProjects();
  const navigate = useNavigate();

  const allTemplates = [...resumeTemplates, ...coverLetterTemplates];
  const filteredTemplates = selectedType === 'all' 
    ? allTemplates 
    : allTemplates.filter(template => template.type === selectedType);

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setProjectName(template.title);
    setShowCreateModal(true);
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !projectName.trim()) return;

    setLoading(true);
    try {
      const projectId = await createProject(projectName.trim(), selectedTemplate.type, selectedTemplate.layout);
      navigate(`/editor/${projectId}`);
    } catch (error) {
      console.error('Error creating project from template:', error);
    } finally {
      setLoading(false);
      setShowCreateModal(false);
      setSelectedTemplate(null);
      setProjectName('');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl lg:text-5xl font-black text-neutral-900 mb-4">
            Professional <span className="gradient-text">Templates</span>
          </h1>
          <p className="text-neutral-600 text-lg lg:text-xl font-medium max-w-2xl mx-auto">
            Choose from our collection of <span className="gradient-text font-bold">professionally designed</span> templates to get started quickly
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex justify-center"
        >
          <div className="flex gap-2 p-2 bg-neutral-100 rounded-2xl">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                selectedType === 'all'
                  ? 'bg-neutral-900 text-white shadow-lg'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              All Templates
            </button>
            <button
              onClick={() => setSelectedType('resume')}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                selectedType === 'resume'
                  ? 'bg-neutral-900 text-white shadow-lg'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              Resume Templates
            </button>
            <button
              onClick={() => setSelectedType('cover-letter')}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                selectedType === 'cover-letter'
                  ? 'bg-neutral-900 text-white shadow-lg'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              Cover Letter Templates
            </button>
          </div>
        </motion.div>

        {/* Templates Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              className="group"
            >
              <div className="card-elevated p-8 h-full flex flex-col transform transition-all duration-300 group-hover:scale-[1.02]">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-2xl ${
                    template.type === 'resume' 
                      ? 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600' 
                      : 'bg-gradient-to-br from-pink-100 to-purple-100 text-pink-600'
                  }`}>
                    {template.type === 'resume' ? <FileText size={28} /> : <Mail size={28} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900">{template.title}</h3>
                    <p className="text-sm text-neutral-500 font-medium capitalize">
                      {template.type.replace('-', ' ')}
                    </p>
                  </div>
                </div>

                <p className="text-neutral-600 text-base mb-6 flex-grow">{template.description}</p>
                
                <div className="glass-effect rounded-2xl p-4 mb-6">
                  <p className="text-sm text-neutral-600 italic font-medium">{template.preview}</p>
                </div>

                <button
                  onClick={() => handleUseTemplate(template)}
                  className="btn-primary gap-3 w-full group/btn"
                >
                  <Plus size={20} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                  <span className="font-bold">Use Template</span>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Create Project Modal */}
        {showCreateModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="card-elevated max-w-md w-full mx-4 p-8"
            >
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">
                Create from <span className="gradient-text">Template</span>
              </h3>
              <div className="mb-6">
                <p className="text-base text-neutral-600 mb-4">
                  Using template: <strong className="text-neutral-900">{selectedTemplate.title}</strong>
                </p>
                <label htmlFor="projectName" className="block text-sm font-bold text-neutral-700 mb-3">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="input-field font-medium"
                  placeholder="Enter your project name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFromTemplate();
                    } else if (e.key === 'Escape') {
                      setShowCreateModal(false);
                    }
                  }}
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedTemplate(null);
                    setProjectName('');
                  }}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFromTemplate}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || projectName.trim() === ''}
                >
                  <span className="font-bold">
                    {loading ? 'Creating...' : 'Create Project'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}; 