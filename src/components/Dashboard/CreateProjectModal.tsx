import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Mail, X } from 'lucide-react';
import { useProjects } from '../../contexts/ProjectContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'resume' | 'cover-letter'>('resume');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { createProject, setCurrentProject, projects } = useProjects();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!title.trim()) {
      setError('Please enter a project title');
      return;
    }

    setLoading(true);
    
    try {
      const newProject = await createProject(title.trim(), type);
      
      // Set the newly created project as current
        setCurrentProject(newProject);
      
      // Reset form
      setTitle('');
      setType('resume');
      onClose();
      
      // Navigate to editor
      navigate(`/editor/${newProject.id}`);
    } catch (error: any) {
      setError(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setType('resume');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999]">
      <div className="card-elevated max-w-md w-full mx-4 p-8 relative z-[99999]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Create New <span className="gradient-text">Project</span></h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">
              Project Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field font-medium"
              placeholder="e.g., Software Engineer Resume"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-4">
              Document Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('resume')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  type === 'resume'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-400 shadow-lg'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                }`}
                disabled={loading}
              >
                <div className="flex flex-col items-center gap-3">
                  <FileText size={28} />
                  <span className="font-bold">Resume</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Professional CV</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setType('cover-letter')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  type === 'cover-letter'
                    ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 text-pink-700 dark:text-pink-400 shadow-lg'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                }`}
                disabled={loading}
              >
                <div className="flex flex-col items-center gap-3">
                  <Mail size={28} />
                  <span className="font-bold">Cover Letter</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Job application</span>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              <span className="font-bold">
                {loading ? 'Creating...' : 'Create Project'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 