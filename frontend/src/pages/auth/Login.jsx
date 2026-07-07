import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';

const HOME_BY_ROLE = { admin: '/admin', lecturer: '/lecturer', student: '/student' };

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(HOME_BY_ROLE[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-gradient">
      <div className="card w-full max-w-md p-8 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent mb-2">Smart Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-cream-200/70">QR-based attendance, no GPS required.</p>
        </div>

        {error && (
          <div role="alert" className="mb-6 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-200 rounded-2xl px-4 py-3 border border-red-100 dark:border-red-800/30 flex items-center gap-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="email" type="email" required autoComplete="email" className="input pl-10"
                value={email} onChange={(e) => setEmail(e.target.value)}
                aria-describedby={error ? 'login-error' : undefined}
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="password" type="password" required autoComplete="current-password" className="input pl-10"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Signing in…
              </span>
            ) : 'Sign in'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-cream-200 dark:border-gray-700">
          <p className="text-sm text-center text-gray-600 dark:text-cream-200/70">
            Don't have an account? <Link to="/register" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
