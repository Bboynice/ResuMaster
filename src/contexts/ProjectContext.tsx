import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import type { Project, ProjectContextType, LayoutSection } from '../types';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: React.ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Check if user is in demo mode
  const isDemoMode = user?.uid === 'demo-user-123';

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
      return;
    }

    if (isDemoMode) {
      // Load demo projects from localStorage
      const demoProjects = localStorage.getItem('demo_projects');
      if (demoProjects) {
        const parsedProjects = JSON.parse(demoProjects).map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
        }));
        setProjects(parsedProjects);
      } else {
        // Create default demo projects
        const defaultProjects: Project[] = [
          {
            id: 'demo-project-1',
            title: 'My Resume',
            type: 'resume',
            userId: user.uid,
            layout: [
              {
                id: 'header-1',
                type: 'header',
                title: 'John Doe',
                content: 'Software Developer',
                order: 0
              },
              {
                id: 'contact-1',
                type: 'contact',
                title: 'Contact Information',
                content: 'john.doe@email.com | (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe',
                order: 1
              },
              {
                id: 'section-1',
                type: 'section',
                title: 'Professional Summary',
                content: 'Experienced software developer with 5+ years in web development, specializing in React and Node.js.',
                order: 2
              }
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        ];
        setProjects(defaultProjects);
        localStorage.setItem('demo_projects', JSON.stringify(defaultProjects));
      }
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Project;
      });
      
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching projects:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, isDemoMode]);

  const createProject = async (title: string, type: 'resume' | 'cover-letter', templateLayout?: LayoutSection[]): Promise<string> => {
    if (!user) {
      throw new Error('User must be logged in to create projects');
    }

    const defaultLayout: LayoutSection[] = templateLayout || (type === 'resume' 
      ? [
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
            content: 'your.email@example.com | (555) 123-4567',
            order: 1
          },
          {
            id: 'section-1',
            type: 'section',
            title: 'Professional Summary',
            content: 'Brief professional summary highlighting your key qualifications and experience.',
            order: 2
          }
        ]
      : [
          {
            id: 'header-1',
            type: 'header',
            title: 'Cover Letter',
            content: 'Your Name',
            order: 0
          },
          {
            id: 'text-1',
            type: 'text',
            title: 'Introduction',
            content: 'Dear Hiring Manager,\n\nI am writing to express my interest in the [Position Title] position at [Company Name].',
            order: 1
          }
        ]);

    if (isDemoMode) {
      // Handle demo mode project creation
      const projectId = `demo-project-${Date.now()}`;
      const newProject: Project = {
        id: projectId,
        title,
        type,
        userId: user.uid,
        layout: defaultLayout,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProjects = [newProject, ...projects];
      setProjects(updatedProjects);
      localStorage.setItem('demo_projects', JSON.stringify(updatedProjects));
      return projectId;
    }

    try {
      const projectData = {
        title,
        type,
        userId: user.uid,
        layout: defaultLayout,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'projects'), projectData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
    if (isDemoMode) {
      // Handle demo mode project update
      const updatedProjects = projects.map(project => 
        project.id === id 
          ? { ...project, ...updates, updatedAt: new Date() }
          : project
      );
      setProjects(updatedProjects);
      localStorage.setItem('demo_projects', JSON.stringify(updatedProjects));
      return;
    }

    try {
      const projectRef = doc(db, 'projects', id);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    if (isDemoMode) {
      // Handle demo mode project deletion
      const updatedProjects = projects.filter(project => project.id !== id);
      setProjects(updatedProjects);
      localStorage.setItem('demo_projects', JSON.stringify(updatedProjects));
      
      // Clear current project if it's the one being deleted
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'projects', id));
      
      // Clear current project if it's the one being deleted
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  };

  const updateLayout = async (layout: LayoutSection[]): Promise<void> => {
    if (!currentProject) {
      throw new Error('No current project selected');
    }

    try {
      await updateProject(currentProject.id, { layout });
      
      // Update local state immediately for better UX
      setCurrentProject(prev => prev ? { ...prev, layout } : null);
    } catch (error) {
      console.error('Error updating layout:', error);
      throw new Error('Failed to update layout');
    }
  };

  const value: ProjectContextType = {
    projects,
    currentProject,
    loading,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    updateLayout,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}; 