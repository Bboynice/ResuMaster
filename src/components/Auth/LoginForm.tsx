import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      onSuccess?.();
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 transition-colors duration-300">Welcome Back</h2>
          <p className="text-neutral-600 dark:text-neutral-400 transition-colors duration-300">Sign in to your ResuMaster account</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 transition-colors duration-300">
            <p className="text-red-600 dark:text-red-400 text-sm transition-colors duration-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 transition-colors duration-300">
              Username / Email
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="Enter username or email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 transition-colors duration-300">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Trial Access Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors duration-300">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 transition-colors duration-300">🚀 Try the Demo</h3>
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 transition-colors duration-300">
            Test the app without registration:
          </p>
          <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1 mb-3 transition-colors duration-300">
            <div><strong>Username:</strong> admin</div>
            <div><strong>Password:</strong> admin</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('admin');
              setPassword('admin');
            }}
            className="text-xs bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-md transition-colors duration-300"
          >
            Fill Demo Credentials
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-neutral-600 dark:text-neutral-400 transition-colors duration-300">
            Don't have an account?{' '}
            <Link to="/signup" className="text-neutral-900 dark:text-emerald-400 hover:text-neutral-700 dark:hover:text-emerald-300 font-medium transition-colors duration-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}; 