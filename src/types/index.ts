export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface Project {
  id: string;
  title: string;
  type: 'resume' | 'cover-letter';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  layout: LayoutSection[];
}

export interface LayoutSection {
  id: string;
  type: 'header' | 'photo' | 'section' | 'text' | 'skills' | 'experience' | 'education' | 'contact';
  title?: string;
  content?: string | string[];
  url?: string;
  order: number;
  isEditing?: boolean;
  // Column layout properties
  row?: number; // Which row this section belongs to
  column?: number; // Which column within the row (0-based)
  columnsInRow?: number; // Total number of columns in this row
}

export interface ExperienceItem {
  position: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string;
}

export interface EducationItem {
  degree: string;
  institution: string;
  location?: string;
  graduationDate?: string;
  gpa?: string;
  description?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  linkedin?: string;
  website?: string;
  github?: string;
}

export interface AIGenerateLayoutRequest {
  prompt: string;
  currentLayout?: LayoutSection[];
  projectType: 'resume' | 'cover-letter';
}

export interface AIRewriteRequest {
  text: string;
  context: string;
  tone?: 'professional' | 'casual' | 'creative';
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { displayName?: string; email?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshDemoUser?: () => void;
}

export interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  createProject: (title: string, type: 'resume' | 'cover-letter', templateLayout?: LayoutSection[]) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  updateLayout: (layout: LayoutSection[]) => Promise<void>;
} 