import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import Layout from '../../components/Layout.jsx';
import { userApi } from '../../api/endpoints';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b']; // Blue for Admin, Green for Lecturer, Amber for Student

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.stats()
      .then(({ data }) => setStats(data.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load stats'));
  }, []);

  // Prepare data for chart
  const userRoleData = stats ? [
    { name: 'Admins', value: stats.usersByRole.admin, fill: COLORS[0] },
    { name: 'Lecturers', value: stats.usersByRole.lecturer, fill: COLORS[1] },
    { name: 'Students', value: stats.usersByRole.student, fill: COLORS[2] }
  ] : [];

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Administrator Dashboard</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!stats ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Admins" value={stats.usersByRole.admin} color="primary" />
            <StatCard label="Lecturers" value={stats.usersByRole.lecturer} color="success" />
            <StatCard label="Students" value={stats.usersByRole.student} color="amber" />
            <StatCard label="Total Users" value={stats.totalUsers} />
            <StatCard label="Sessions" value={stats.totalSessions} />
            <StatCard label="Attendance Records" value={stats.totalAttendanceRecords} />
          </div>

          {/* Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="font-semibold mb-3">User Distribution by Role</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <Pie
                    data={userRoleData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                  >
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-3">Last 7 Days Registrations</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

function StatCard({ label, value, color }) {
  let colorClasses = 'text-gray-900 dark:text-gray-100';
  
  if (color === 'primary') {
    colorClasses = 'text-primary-600 dark:text-primary-400';
  } else if (color === 'success') {
    colorClasses = 'text-green-600 dark:text-green-400';
  } else if (color === 'amber') {
    colorClasses = 'text-amber-600 dark:text-amber-400';
  }

  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colorClasses}`}>{value}</p>
    </div>
  );
}
