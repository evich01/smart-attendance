import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, UserCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student', department: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-gradient">
      <div className="card w-full max-w-md p-8 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent mb-2">Create an account</h1>
          <p className="text-sm text-gray-500 dark:text-cream-200/70">Join the Smart Attendance System.</p>
        </div>

        {success && (
          <div role="alert" className="mb-6 text-sm text-primary-800 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-200 rounded-2xl px-4 py-3 border border-primary-100 dark:border-primary-800/30">
            Registration successful! Redirecting to login...
          </div>
        )}

        {error && (
          <div role="alert" className="mb-6 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 rounded-2xl px-4 py-3 border border-red-100 dark:border-red-800/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="name" required className="input pl-10" value={form.name} onChange={(e) => update('name', e.target.value)} disabled={success} placeholder="John Doe" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="email" type="email" required className="input pl-10" value={form.email} onChange={(e) => update('email', e.target.value)} disabled={success} placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="password" type="password" required className="input pl-10" value={form.password} onChange={(e) => update('password', e.target.value)} disabled={success} placeholder="••••••••" />
            </div>
          </div>
          <div>
            <label htmlFor="role" className="label">Role</label>
            <div className="relative">
              <UserCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select id="role" className="input pl-10" value={form.role} onChange={(e) => update('role', e.target.value)} disabled={success}>
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading || success} className="btn-primary w-full text-base py-3">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Creating account…
              </span>
            ) : 'Register'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-cream-200 dark:border-gray-700">
          <p className="text-sm text-center text-gray-600 dark:text-cream-200/70">
            Already have an account? <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
