import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Mail, Edit3, Trash2, Calendar, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProjects } from '../../contexts/ProjectContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTitle, setNewTitle] = useState(project.title);
  const navigate = useNavigate();
  const { deleteProject, setCurrentProject, updateProject } = useProjects();

  const handleEdit = () => {
    setCurrentProject(project);
    navigate(`/editor/${project.id}`);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteProject(project.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (newTitle.trim() === '' || newTitle === project.title) {
      setShowRenameModal(false);
      return;
    }

    setLoading(true);
    try {
      await updateProject(project.id, { title: newTitle.trim() });
      setShowRenameModal(false);
    } catch (error) {
      console.error('Error renaming project:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200 group">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-start justify-between mb-3 lg:mb-4">
            <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
              <div className={`p-1.5 lg:p-2 rounded-xl flex-shrink-0 ${
                project.type === 'resume' 
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600' 
                  : 'bg-gradient-to-br from-pink-100 to-purple-100 text-pink-600'
              }`}>
                {project.type === 'resume' ? 
                  <FileText size={18} className="lg:w-6 lg:h-6" /> : 
                  <Mail size={18} className="lg:w-6 lg:h-6" />
                }
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-neutral-900 truncate text-sm lg:text-base">
                  {project.title}
                </h3>
                <p className="text-xs lg:text-sm text-neutral-500 font-medium capitalize">
                  {project.type.replace('-', ' ')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                onClick={() => setShowRenameModal(true)}
                variant="ghost"
                size="icon"
                className="h-7 w-7 lg:h-8 lg:w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                title="Rename"
              >
                <Edit2 size={14} className="lg:w-4 lg:h-4" />
              </Button>
              <Button
                onClick={handleEdit}
                variant="ghost"
                size="icon"
                className="h-7 w-7 lg:h-8 lg:w-8 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
                title="Edit"
              >
                <Edit3 size={14} className="lg:w-4 lg:h-4" />
              </Button>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="ghost"
                size="icon"
                className="h-7 w-7 lg:h-8 lg:w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 size={14} className="lg:w-4 lg:h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs lg:text-sm text-neutral-500 mb-3 lg:mb-4">
            <Calendar size={14} className="lg:w-4 lg:h-4" />
            <span className="font-medium">Updated {formatDate(project.updatedAt)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs lg:text-sm text-neutral-500 font-medium">
              {project.layout.length} sections
            </span>
            <button
              onClick={handleEdit}
              className="btn-primary text-xs lg:text-sm px-3 lg:px-4 py-1.5 lg:py-2"
            >
              <span className="font-bold">Open</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 lg:p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Rename Project
            </h3>
            <div className="mb-6">
              <label htmlFor="projectTitle" className="block text-sm font-medium text-slate-700 mb-2">
                Project Name
              </label>
              <input
                id="projectTitle"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="input-field"
                placeholder="Enter project name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  } else if (e.key === 'Escape') {
                    setShowRenameModal(false);
                  }
                }}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <Button
                onClick={() => {
                  setShowRenameModal(false);
                  setNewTitle(project.title);
                }}
                variant="outline"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                disabled={loading || newTitle.trim() === ''}
                className="w-full sm:w-auto"
              >
                {loading ? 'Renaming...' : 'Rename'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 lg:p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Delete Project
            </h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete "{project.title}"? This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}; 