import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { attendanceApi } from '../../api/endpoints';
import { formatDate, formatTime, formatDuration } from '../../utils/format';

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([attendanceApi.today(), attendanceApi.todaySessions()])
      .then(([attRes, sessRes]) => {
        setData(attRes.data.data);
        setSessions(sessRes.data.data);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard'));

    const interval = setInterval(() => {
      attendanceApi.today().then(({ data: d }) => setData(d.data)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeCheckIn = sessions.find((s) => s.type === 'CHECK_IN' && s.status === 'active');
  const activeCheckOut = sessions.find((s) => s.type === 'CHECK_OUT' && s.status === 'active');

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Manager Dashboard</h1>
      <p className="text-gray-500 mb-6">Today&apos;s Attendance — {formatDate(new Date())}</p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!data ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Staff" value={data.totalStaff} />
            <StatCard label="Present" value={data.present} color="success" />
            <StatCard label="Late" value={data.late} color="amber" />
            <StatCard label="Not Checked In" value={data.notCheckedIn} />
            <StatCard label="Missing Check-Out" value={data.missingCheckout} color="amber" />
            <StatCard label="Checked Out" value={data.checkedOut} />
            <StatCard label="Check-In Session" value={activeCheckIn ? 'Active' : 'Inactive'} color={activeCheckIn ? 'success' : undefined} />
            <StatCard label="Check-Out Session" value={activeCheckOut ? 'Active' : 'Inactive'} color={activeCheckOut ? 'success' : undefined} />
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <Link to="/manager/check-in-qr" className="btn-primary">Check-In QR</Link>
            <Link to="/manager/check-out-qr" className="btn-primary">Check-Out QR</Link>
            <Link to="/manager/attendance" className="btn-secondary">Full Attendance View</Link>
          </div>

          <div className="card overflow-x-auto">
            <h2 className="font-semibold p-4 border-b border-gray-100 dark:border-gray-800">Today&apos;s Records</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700 text-gray-500">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Check-In</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Check-Out</th>
                  <th className="p-3">Working Time</th>
                </tr>
              </thead>
              <tbody>
                {data.records.slice(0, 10).map((r) => (
                  <tr key={r.employeeId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="p-3">{r.employeeName}</td>
                    <td className="p-3">{r.department || '—'}</td>
                    <td className="p-3">{formatTime(r.checkInTime)}</td>
                    <td className="p-3"><StatusBadge status={r.displayStatus || r.status} /></td>
                    <td className="p-3">{formatTime(r.checkOutTime)}</td>
                    <td className="p-3">{formatDuration(r.workingDuration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
}

function StatCard({ label, value, color }) {
  let cls = 'text-gray-900 dark:text-gray-100';
  if (color === 'success') cls = 'text-green-600';
  else if (color === 'amber') cls = 'text-amber-600';
  return (
    <div className="card p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${cls}`}>{value}</p>
    </div>
  );
}
