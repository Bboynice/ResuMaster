import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Save, AlertCircle, CheckCircle, Zap, Moon, Sun, Monitor } from 'lucide-react';
import { testOpenAIConnection, isOpenAIConfigured } from '../services/openai';
import { AppLayout } from '../components/Layout/AppLayout';

export const Settings: React.FC = () => {
  const { user, updateProfile, refreshDemoUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingAI, setTestingAI] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ success: boolean; error?: string } | null>(null);

  // Check if user is in demo mode
  const isDemoMode = user?.uid === 'demo-user-123';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isDemoMode) {
        // Handle demo mode update
        const updatedUser = {
          ...user!,
          displayName: displayName || undefined,
          email: email,
        };
        
        localStorage.setItem('demo_user', JSON.stringify(updatedUser));
        
        // Refresh the demo user in context
        if (refreshDemoUser) {
          refreshDemoUser();
        }
        
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        // Handle Firebase user update
        const updateData: { displayName?: string; email?: string } = {};
        
        if (displayName !== user?.displayName) {
          updateData.displayName = displayName;
        }
        
        if (email !== user?.email) {
          updateData.email = email;
        }

        if (Object.keys(updateData).length > 0) {
          await updateProfile(updateData);
          setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } else {
          setMessage({ type: 'success', text: 'No changes to save.' });
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestAI = async () => {
    setTestingAI(true);
    setAiStatus(null);
    
    try {
      const result = await testOpenAIConnection();
      setAiStatus(result);
    } catch (error) {
      setAiStatus({ success: false, error: 'Failed to test connection' });
    } finally {
      setTestingAI(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your account settings and preferences.</p>
        </div>

        {isDemoMode && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">Demo Mode</h3>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  You're in demo mode. Changes will be saved locally and cleared when you log out.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <User size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Profile Information</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your personal information.</p>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <AlertCircle size={20} className="text-red-600" />
                )}
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-900' : 'text-red-900'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
                placeholder="Enter your display name"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This is how your name will appear in the app.
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter your email address"
                disabled={!isDemoMode}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isDemoMode 
                  ? "You can change your email in demo mode." 
                  : "Email changes require re-authentication and are currently disabled."}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Account Type</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isDemoMode ? 'Demo Account' : 'Firebase Account'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isDemoMode 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isDemoMode ? 'Demo' : 'Live'}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={20} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setDisplayName(user?.displayName || '');
                  setEmail(user?.email || '');
                  setMessage(null);
                }}
                className="btn-secondary"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Theme Settings */}
        <div className="card p-8 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              {theme === 'dark' ? (
                <Moon size={24} className="text-purple-600 dark:text-purple-400" />
              ) : (
                <Sun size={24} className="text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Theme Settings</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme appearance.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  theme === 'light'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg border border-neutral-200 flex items-center justify-center shadow-sm">
                    <Sun size={24} className="text-yellow-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Light</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clean and bright</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  theme === 'dark'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center shadow-sm">
                    <Moon size={24} className="text-blue-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dark</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Easy on the eyes</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  setTheme(systemTheme);
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  !['light', 'dark'].includes(theme)
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-neutral-100 to-neutral-800 rounded-lg flex items-center justify-center shadow-sm">
                    <Monitor size={24} className="text-neutral-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">System</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Follow system</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Current theme:</strong> {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Theme preference is saved automatically and will persist across sessions.
              </p>
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="card p-8 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Zap size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI Features</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configure and test your AI functionality.</p>
            </div>
          </div>

                      <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">OpenAI Configuration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isOpenAIConfigured() 
                    ? 'API key is configured and ready to use'
                    : 'API key not configured - using mock responses'}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                isOpenAIConfigured() 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isOpenAIConfigured() ? 'Configured' : 'Mock Mode'}
              </div>
            </div>

            {!isOpenAIConfigured() && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">How to configure OpenAI:</h4>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
                  <li>Open the <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env</code> file in your project root</li>
                  <li>Replace <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">sk-your_openai_api_key_here</code> with your actual API key</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                onClick={handleTestAI}
                disabled={testingAI}
                className="btn-secondary flex items-center gap-2"
              >
                <Zap size={16} />
                {testingAI ? 'Testing...' : 'Test AI Connection'}
              </button>

              {aiStatus && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  aiStatus.success 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  {aiStatus.success ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    {aiStatus.success ? 'Connection successful!' : aiStatus.error}
                  </span>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Available AI Features:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>AI Generate Layout - Create resume/cover letter layouts from prompts</li>
                <li>AI Rewrite Text - Enhance and improve your content</li>
                <li>Smart Templates - Pre-built professional templates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}; 