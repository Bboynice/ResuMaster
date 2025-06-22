import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignupForm } from '../components/Auth/SignupForm';

export const Signup: React.FC = () => {
  const navigate = useNavigate();

  const handleSignupSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SignupForm onSuccess={handleSignupSuccess} />
    </div>
  );
}; 