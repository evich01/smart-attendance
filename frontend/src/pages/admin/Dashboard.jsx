import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { userApi } from '../../api/endpoints';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.stats()
      .then(({ data }) => setStats(data.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load stats'));
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Administrator Dashboard</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!stats ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Admins" value={stats.usersByRole.admin} />
          <StatCard label="Lecturers" value={stats.usersByRole.lecturer} />
          <StatCard label="Students" value={stats.usersByRole.student} />
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Sessions" value={stats.totalSessions} />
          <StatCard label="Attendance Records" value={stats.totalAttendanceRecords} />
        </div>
      )}
    </Layout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
