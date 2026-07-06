import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import Layout from '../../components/Layout.jsx';
import { reportApi } from '../../api/endpoints';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed'];

export default function Analytics() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    reportApi.institutionReport()
      .then(({ data }) => setReport(data.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load analytics'));
  }, []);

  if (error) return <Layout><p className="text-red-600">{error}</p></Layout>;
  if (!report) return <Layout><p className="text-gray-500">Loading analytics…</p></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Institution Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-3">14-Day Daily Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={report.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">Course Attendance Rate Comparison</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={report.courseRates}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="courseCode" tick={{ fontSize: 11 }} />
              <YAxis unit="%" />
              <Tooltip />
              <Bar dataKey="rate" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">Top 5 Courses by Attendance</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={report.top5} dataKey="rate" nameKey="courseCode" outerRadius={90} label>
                {report.top5.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">10 Most Recent Sessions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-2">Course</th><th className="p-2">Title</th><th className="p-2">Date</th><th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.recentSessions.map((s) => (
                  <tr key={s.sessionId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="p-2 font-medium">{s.courseCode}</td>
                    <td className="p-2">{s.title}</td>
                    <td className="p-2">{new Date(s.sessionDate).toLocaleDateString()}</td>
                    <td className="p-2">
                      <span className={s.isActive ? 'badge-good' : 'badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}>
                        {s.isActive ? 'Active' : 'Ended'}
                      </span>
                    </td>
                  </tr>
                ))}
                {report.recentSessions.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">No sessions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
