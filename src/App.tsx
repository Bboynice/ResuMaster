import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard'; 
import { Editor } from './pages/Editor';
import { Settings } from './pages/Settings';
import { Templates } from './pages/Templates';
import { AllProjects } from './pages/AllProjects';

// App Wrapper with Sidebar - manages sidebar at app level using context
const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOpen, isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();

  // Check if current route should show sidebar (exclude login/signup)
  const showSidebar = !location.pathname.includes('/login') && !location.pathname.includes('/signup');

  return (
    <>
      {showSidebar && (
        <Sidebar 
          isOpen={isOpen} 
          onToggle={toggleSidebar} 
          isMobile={isMobile}
        />
      )}
      {children}
    </>
  );
};

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route component (redirect to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <AppWrapper>
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Navigate to="/dashboard" replace />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/editor/:id" element={
        <ProtectedRoute>
          <Editor />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      <Route path="/templates" element={
        <ProtectedRoute>
          <Templates />
        </ProtectedRoute>
      } />

      <Route path="/projects" element={
        <ProtectedRoute>
          <AllProjects />
        </ProtectedRoute>
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </AppWrapper>
  );
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ProjectProvider>
          <SidebarProvider>
          <AppRoutes />
          </SidebarProvider>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
