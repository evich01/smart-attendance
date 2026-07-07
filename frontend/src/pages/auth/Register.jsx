import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student', studentNumber: '', staffId: '', department: ''
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
          <p className="text-sm text-gray-500 dark:text-gray-400">Join the Smart Attendance System.</p>
        </div>

        {success && (
          <div role="alert" className="mb-6 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-2xl px-4 py-3 border border-emerald-100 dark:border-emerald-800/30">
            ✅ Registration successful! Redirecting to login...
          </div>
        )}

        {error && (
          <div role="alert" className="mb-6 text-sm text-rose-700 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300 rounded-2xl px-4 py-3 border border-rose-100 dark:border-rose-800/30">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input id="name" required className="input" value={form.name} onChange={(e) => update('name', e.target.value)} disabled={success} placeholder="John Doe" />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" required className="input" value={form.email} onChange={(e) => update('email', e.target.value)} disabled={success} placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" type="password" required className="input" value={form.password} onChange={(e) => update('password', e.target.value)} disabled={success} placeholder="••••••••" />
          </div>
          <div>
            <label htmlFor="role" className="label">Role</label>
            <select id="role" className="input" value={form.role} onChange={(e) => update('role', e.target.value)} disabled={success}>
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
            </select>
          </div>

          {form.role === 'student' && (
            <div>
              <label htmlFor="studentNumber" className="label">Student number</label>
              <input id="studentNumber" required className="input" value={form.studentNumber} onChange={(e) => update('studentNumber', e.target.value)} disabled={success} placeholder="STU-001" />
            </div>
          )}
          {form.role === 'lecturer' && (
            <div>
              <label htmlFor="staffId" className="label">Staff ID</label>
              <input id="staffId" required className="input" value={form.staffId} onChange={(e) => update('staffId', e.target.value)} disabled={success} placeholder="STF-001" />
            </div>
          )}

          <button type="submit" disabled={loading || success} className="btn-primary w-full text-base py-3">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                Creating account…
              </span>
            ) : 'Register'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Already have an account? <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
