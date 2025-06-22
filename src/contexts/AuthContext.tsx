import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  updateEmail,
  deleteUser,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../services/firebase';
import type { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Function to refresh demo user data
  const refreshDemoUser = () => {
    const demoUser = localStorage.getItem('demo_user');
    if (demoUser) {
      setUser(JSON.parse(demoUser));
      setIsDemoMode(true);
    }
  };

  useEffect(() => {
    // Check for demo user in localStorage
    const demoUser = localStorage.getItem('demo_user');
    if (demoUser) {
      setUser(JSON.parse(demoUser));
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
        });
        setIsDemoMode(false);
      } else {
        setUser(null);
        setIsDemoMode(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await firebaseUpdateProfile(firebaseUser, { displayName });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    // Check for demo credentials
    if (email === 'admin' && password === 'admin') {
      const demoUser: User = {
        uid: 'demo-user-123',
        email: 'admin@demo.com',
        displayName: 'Demo Admin',
        photoURL: undefined,
      };
      
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setIsDemoMode(true);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    // Handle demo mode logout
    if (isDemoMode) {
      localStorage.removeItem('demo_user');
      localStorage.removeItem('demo_projects'); // Clear demo projects too
      setUser(null);
      setIsDemoMode(false);
      return;
    }

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateProfile = async (data: { displayName?: string; email?: string }) => {
    if (!auth.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      if (data.displayName) {
        await firebaseUpdateProfile(auth.currentUser, { displayName: data.displayName });
      }
      
      if (data.email && data.email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, data.email);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      await deleteUser(auth.currentUser);
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    deleteAccount,
    refreshDemoUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 