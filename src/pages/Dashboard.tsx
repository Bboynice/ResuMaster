import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Calendar, TrendingUp } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { ProjectCard } from '../components/Dashboard/ProjectCard';
import { CreateProjectModal } from '../components/Dashboard/CreateProjectModal';
import { AppLayout } from '../components/Layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export const Dashboard: React.FC = () => {
  const { projects, loading } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get recent projects (last 4)
  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const resumeCount = projects.filter(p => p.type === 'resume').length;
  const coverLetterCount = projects.filter(p => p.type === 'cover-letter').length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 mx-auto mb-6 flex items-center justify-center animate-pulse-slow glow-effect">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-neutral-600 text-lg font-medium">Loading your <span className="gradient-text font-bold">dashboard</span>...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl lg:text-5xl font-black text-neutral-900 mb-3">Dashboard</h1>
          <p className="text-neutral-600 text-lg lg:text-xl font-medium">
            Welcome back! Here's what's happening with your <span className="gradient-text font-bold">projects</span>.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="group"
          >
            <Card className="card-elevated p-8 group-hover:scale-[1.02] transition-all duration-500">
              <CardContent className="p-0">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl shadow-sm group-hover:shadow-md transition-all duration-300">
                    <FileText size={28} className="text-neutral-700" />
                  </div>
                  <div>
                    <p className="text-4xl font-black text-neutral-900 mb-1">{projects.length}</p>
                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Total Projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="group"
          >
            <Card className="card-elevated p-8 group-hover:scale-[1.02] transition-all duration-500">
              <CardContent className="p-0">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl shadow-sm group-hover:shadow-md transition-all duration-300">
                    <FileText size={28} className="text-purple-700" />
                  </div>
                  <div>
                    <p className="text-4xl font-black text-neutral-900 mb-1">{resumeCount}</p>
                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Resumes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
           
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="group"
          >
            <Card className="card-elevated p-8 group-hover:scale-[1.02] transition-all duration-500">
              <CardContent className="p-0">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl shadow-sm group-hover:shadow-md transition-all duration-300">
                    <Calendar size={28} className="text-pink-700" />
                  </div>
                  <div>
                    <p className="text-4xl font-black text-neutral-900 mb-1">{coverLetterCount}</p>
                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Cover Letters</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="space-y-8"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl lg:text-4xl font-black text-neutral-900">Recent Projects</h2>
              <p className="text-lg lg:text-xl text-neutral-600 font-medium">Your most recently updated projects</p>
            </div>
            {projects.length > 4 && (
              <button className="btn-secondary w-full lg:w-auto">
                <a href="/projects" className="flex items-center gap-2">
                  View All Projects
                </a>
              </button>
            )}
          </div>

          {projects.length === 0 ? (
            <Card className="card-elevated border-dashed border-2 border-neutral-300">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-3xl flex items-center justify-center mx-auto mb-6 floating-element">
                  <FileText size={32} className="text-neutral-600" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">No projects yet</h3>
                <p className="text-neutral-600 mb-8 max-w-md mx-auto text-lg">
                  Get started by creating your first <span className="gradient-text font-bold">resume</span> or <span className="gradient-text font-bold">cover letter</span> project.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary gap-3 group"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-bold">Create Your First Project</span>
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {recentProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                  className="group"
                >
                  <div className="transform transition-all duration-300 group-hover:scale-[1.02]">
                    <ProjectCard project={project} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Card className="card-elevated">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-neutral-900">
                <TrendingUp size={28} className="text-purple-600 floating-element" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary h-24 lg:h-28 flex-col gap-3 text-left justify-center items-center group"
                >
                  <div className="flex items-center gap-3 text-lg font-bold">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    Create New Project
                  </div>
                  <p className="text-sm text-white/80 font-medium">Start building a new resume or cover letter</p>
                </button>
                
                <button
                  className="btn-secondary h-24 lg:h-28 flex-col gap-3 text-left justify-center items-center group hover:scale-[1.02] transition-all duration-300"
                  onClick={() => window.location.href = '/templates'}
                >
                  <div className="flex items-center gap-3 text-lg font-bold text-neutral-900">
                    <FileText size={20} className="group-hover:scale-110 transition-transform duration-300" />
                    Browse Templates
                  </div>
                  <p className="text-sm text-neutral-600 font-medium">Explore professional resume templates</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </AppLayout>
  );
}; 