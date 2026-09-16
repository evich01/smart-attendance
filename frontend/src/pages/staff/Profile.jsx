import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { authApi } from '../../api/endpoints';

export default function StaffProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    authApi.me()
      .then(({ data }) => setProfile(data.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load profile'));
  }, []);

  async function handlePasswordChange(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setNotice('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Password change failed');
    }
  }

  const p = profile || user;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {notice && <p className="text-green-600 mb-4">{notice}</p>}

      <div className="card p-6 max-w-xl mb-6">
        <h2 className="font-semibold mb-4">Account Information</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd className="font-medium">{p?.name}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{p?.email}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Employee ID</dt><dd className="font-mono">{p?.employeeId || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Role</dt><dd className="capitalize">{p?.role}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd>{p?.phone || '—'}</dd></div>
        </dl>
      </div>

      <form onSubmit={handlePasswordChange} className="card p-6 max-w-xl space-y-4">
        <h2 className="font-semibold">Change Password</h2>
        <div>
          <label className="label">Current Password</label>
          <input type="password" required className="input" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
        </div>
        <div>
          <label className="label">New Password</label>
          <input type="password" required className="input" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary">Update Password</button>
      </form>
    </Layout>
  );
}
