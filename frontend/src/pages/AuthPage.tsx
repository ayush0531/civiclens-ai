import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const authenticatedUser = isLoginTab
        ? await login(email, password)
        : await register({ name, email, password });

      // Route using the role returned by the authenticated API response.
      if (authenticatedUser.role === 'admin') navigate('/admin');
      else if (authenticatedUser.role === 'authority') navigate('/authority');
      else navigate('/citizen');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-navy-900 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 mb-3">
            <ShieldCheck className="w-6 h-6 text-teal-200" />
          </div>
          <h2 className="text-2xl font-extrabold text-navy-900">
            {isLoginTab ? 'Sign in to Civic Lens AI' : 'Create Citizen Account'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Road Infrastructure Monitoring & Prioritization Platform
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-5">
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setError(null); }}
              className={`flex-1 pb-3 text-xs font-bold transition-colors ${
                isLoginTab ? 'text-teal-700 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setError(null); }}
              className={`flex-1 pb-3 text-xs font-bold transition-colors ${
                !isLoginTab ? 'text-teal-700 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginTab && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 12 characters"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>



            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoginTab ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{submitting ? 'Creating Account...' : 'Register'}</span>
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
