import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, FileText, Calendar, SortAsc } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { ProjectCard } from '../components/Dashboard/ProjectCard';
import { CreateProjectModal } from '../components/Dashboard/CreateProjectModal';
import { AppLayout } from '../components/Layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';

export const AllProjects: React.FC = () => {
  const { projects, loading } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'resume' | 'cover-letter'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  
  console.log('AllProjects state - filterType:', filterType, 'sortBy:', sortBy);

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || project.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      console.log('Sorting by:', sortBy);
      switch (sortBy) {
        case 'updated':
          const updatedDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          console.log(`Updated sort: ${a.title} (${a.updatedAt}) vs ${b.title} (${b.updatedAt}) = ${updatedDiff}`);
          return updatedDiff;
        case 'created':
          const createdDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          console.log(`Created sort: ${a.title} (${a.createdAt}) vs ${b.title} (${b.createdAt}) = ${createdDiff}`);
          return createdDiff;
        case 'name':
          const nameDiff = a.title.localeCompare(b.title);
          console.log(`Name sort: ${a.title} vs ${b.title} = ${nameDiff}`);
          return nameDiff;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 mx-auto mb-6 flex items-center justify-center animate-pulse-slow glow-effect">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg font-medium">Loading your <span className="gradient-text font-bold">projects</span>...</p>
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
          className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-neutral-900 dark:text-neutral-100 mb-3">All Projects</h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg lg:text-xl font-medium">
              Manage all your <span className="gradient-text font-bold">resumes</span> and <span className="gradient-text font-bold">cover letters</span> in one place
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary gap-3 w-full lg:w-auto lg:px-8 group"
          >
            <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-bold">New Project</span>
          </button>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-neutral-900 dark:text-neutral-100">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 lg:space-y-0 lg:flex lg:flex-row lg:items-center lg:gap-6">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 z-10" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 input-field text-base font-medium h-12"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 lg:items-center">
                  {/* Type Filter */}
                  <div className="flex gap-3 items-center min-w-0">
                    <span className="text-sm lg:text-base font-bold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">Filter:</span>
                    <Select
                      value={filterType}
                      onChange={(value) => setFilterType(value as 'all' | 'resume' | 'cover-letter')}
                      options={[
                        { value: 'all', label: 'All Types' },
                        { value: 'resume', label: 'Resumes' },
                        { value: 'cover-letter', label: 'Cover Letters' }
                      ]}
                      icon={<Filter size={16} />}
                      className="flex-1 lg:flex-none lg:w-40"
                    />
                  </div>

                  {/* Sort */}
                  <div className="flex gap-3 items-center min-w-0">
                    <span className="text-sm lg:text-base font-bold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">Sort:</span>
                    <Select
                      value={sortBy}
                      onChange={(value) => {
                        console.log('Sort changed to:', value);
                        setSortBy(value as 'updated' | 'created' | 'name');
                      }}
                      options={[
                        { value: 'updated', label: 'Last Updated' },
                        { value: 'created', label: 'Date Created' },
                        { value: 'name', label: 'Name (A-Z)' }
                      ]}
                      icon={<SortAsc size={16} />}
                      className="flex-1 lg:flex-none lg:w-44"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {filteredProjects.length === 0 ? (
            <Card className="card-elevated border-dashed border-2 border-neutral-300 dark:border-neutral-600">
              <CardContent className="p-16 text-center">
                {projects.length === 0 ? (
                  <>
                    <div className="w-20 h-20 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 rounded-3xl flex items-center justify-center mx-auto mb-6 floating-element">
                      <FileText size={32} className="text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">No projects yet</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto text-lg">
                      Create your first <span className="gradient-text font-bold">project</span> to get started
                    </p>
                   
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 rounded-3xl flex items-center justify-center mx-auto mb-6 floating-element">
                      <Search size={32} className="text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">No projects found</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                      Try adjusting your <span className="gradient-text font-bold">search</span> or <span className="gradient-text font-bold">filter</span> criteria
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
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
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </AppLayout>
  );
}; 