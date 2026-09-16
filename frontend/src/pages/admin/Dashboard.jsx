import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import Layout from '../../components/Layout.jsx';
import { userApi, reportApi, attendanceApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';

const ROLE_COLORS = ['#2563eb', '#16a34a', '#f59e0b'];
const STATUS_COLORS = { present: '#16a34a', late: '#f59e0b', absent: '#ef4444' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      userApi.stats(),
      reportApi.dashboardAnalytics(),
      attendanceApi.todaySessions()
    ])
      .then(([statsRes, analyticsRes, sessionsRes]) => {
        setStats(statsRes.data.data);
        setAnalytics(analyticsRes.data.data);
        setSessions(sessionsRes.data.data);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard'));
  }, []);

  const userRoleData = stats ? [
    { name: 'Admins', value: stats.usersByRole.admin, fill: ROLE_COLORS[0] },
    { name: 'Managers', value: stats.usersByRole.manager, fill: ROLE_COLORS[1] },
    { name: 'Staff', value: stats.usersByRole.staff, fill: ROLE_COLORS[2] }
  ] : [];

  const statusPieData = analytics ? [
    { name: 'Present', value: analytics.statusPie.present, fill: STATUS_COLORS.present },
    { name: 'Late', value: analytics.statusPie.late, fill: STATUS_COLORS.late },
    { name: 'Absent', value: analytics.statusPie.absent, fill: STATUS_COLORS.absent }
  ] : [];

  const activeCheckIn = sessions.find((s) => s.type === 'CHECK_IN' && s.status === 'active');
  const activeCheckOut = sessions.find((s) => s.type === 'CHECK_OUT' && s.status === 'active');

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Administrator Dashboard</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!stats ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Staff" value={stats.usersByRole.staff} color="success" />
            <StatCard label="Managers" value={stats.usersByRole.manager} color="primary" />
            <StatCard label="Present Today" value={stats.today.present} color="success" />
            <StatCard label="Late Today" value={stats.today.late} color="amber" />
            <StatCard label="Not Checked In" value={stats.today.notCheckedIn} />
            <StatCard label="Missing Check-Out" value={stats.today.missingCheckout} color="amber" />
            <StatCard label="Check-In Session" value={activeCheckIn ? 'Active' : 'Inactive'} color={activeCheckIn ? 'success' : undefined} />
            <StatCard label="Check-Out Session" value={activeCheckOut ? 'Active' : 'Inactive'} color={activeCheckOut ? 'success' : undefined} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card p-5">
              <h2 className="font-semibold mb-3">User Distribution by Role</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={userRoleData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name">
                    {userRoleData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-3">14-Day Attendance Status</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name">
                    {statusPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="font-semibold mb-3">Daily Attendance Trend (7 days)</h2>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="present" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="late" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="absent" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-3">Department Attendance Today</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics?.departmentStats || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="todayPresent" fill="#16a34a" name="Present" />
                  <Bar dataKey="todayLate" fill="#f59e0b" name="Late" />
                  <Bar dataKey="todayAbsent" fill="#ef4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-6">Today: {formatDate(new Date())}</p>
        </>
      )}
    </Layout>
  );
}

function StatCard({ label, value, color }) {
  let colorClasses = 'text-gray-900 dark:text-gray-100';
  if (color === 'primary') colorClasses = 'text-primary-600 dark:text-primary-400';
  else if (color === 'success') colorClasses = 'text-green-600 dark:text-green-400';
  else if (color === 'amber') colorClasses = 'text-amber-600 dark:text-amber-400';

  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorClasses}`}>{value}</p>
    </div>
  );
}
