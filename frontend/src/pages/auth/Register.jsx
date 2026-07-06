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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="card w-full max-w-md p-6 md:p-8">
        <h1 className="text-2xl font-bold text-primary-600 mb-1">Create an account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Join the Smart Attendance System.</p>

        {success && (
          <div role="alert" className="mb-4 text-sm text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-300 rounded-lg px-3 py-2">
            Registration successful! Redirecting to login...
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 text-sm text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-300 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input id="name" required className="input" value={form.name} onChange={(e) => update('name', e.target.value)} disabled={success} />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" required className="input" value={form.email} onChange={(e) => update('email', e.target.value)} disabled={success} />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" type="password" required className="input" value={form.password} onChange={(e) => update('password', e.target.value)} disabled={success} />
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
              <input id="studentNumber" required className="input" value={form.studentNumber} onChange={(e) => update('studentNumber', e.target.value)} disabled={success} />
            </div>
          )}
          {form.role === 'lecturer' && (
            <div>
              <label htmlFor="staffId" className="label">Staff ID</label>
              <input id="staffId" required className="input" value={form.staffId} onChange={(e) => update('staffId', e.target.value)} disabled={success} />
            </div>
          )}

          <button type="submit" disabled={loading || success} className="btn-primary w-full">
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-600 dark:text-gray-400">
          Already have an account? <Link to="/login" className="text-primary-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
