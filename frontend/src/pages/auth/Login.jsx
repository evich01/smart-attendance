import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="card w-full max-w-md p-6 md:p-8">
        <h1 className="text-2xl font-bold text-primary-600 mb-1">Smart Attendance</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">QR-based attendance, no GPS required.</p>

        {error && (
          <div role="alert" className="mb-4 text-sm text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-300 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email" type="email" required autoComplete="email" className="input"
              value={email} onChange={(e) => setEmail(e.target.value)}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password" type="password" required autoComplete="current-password" className="input"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-600 dark:text-gray-400">
          Don't have an account? <Link to="/register" className="text-primary-600 font-medium">Register</Link>
        </p>
      </div>
    </div>
  );
}
