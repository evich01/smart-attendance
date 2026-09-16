import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { attendanceApi } from '../../api/endpoints';
import { formatTime, formatDuration } from '../../utils/format';

export default function ManagerAttendance() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    attendanceApi.today()
      .then(({ data: d }) => setData(d.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load attendance'));

    const interval = setInterval(() => {
      attendanceApi.today().then(({ data: d }) => setData(d.data)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = (data?.records || []).filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.employeeName.toLowerCase().includes(q) || (r.department || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || (r.displayStatus || r.status) === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Today&apos;s Attendance</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input className="input sm:max-w-xs" placeholder="Search employee or department…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input sm:max-w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="not_checked_in">Not Checked In</option>
          <option value="missing_checkout">Missing Check-Out</option>
        </select>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 text-sm">
          <div className="card p-3 text-center"><p className="text-gray-500">Total</p><p className="font-bold text-lg">{data.totalStaff}</p></div>
          <div className="card p-3 text-center"><p className="text-gray-500">Present</p><p className="font-bold text-lg text-green-600">{data.present}</p></div>
          <div className="card p-3 text-center"><p className="text-gray-500">Late</p><p className="font-bold text-lg text-amber-600">{data.late}</p></div>
          <div className="card p-3 text-center"><p className="text-gray-500">Not Checked In</p><p className="font-bold text-lg">{data.notCheckedIn}</p></div>
          <div className="card p-3 text-center"><p className="text-gray-500">Missing Check-Out</p><p className="font-bold text-lg text-amber-600">{data.missingCheckout}</p></div>
        </div>
      )}

      <div className="card overflow-x-auto">
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
            {filtered.map((r) => (
              <tr key={r.employeeId} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">{r.employeeName}</td>
                <td className="p-3">{r.department || '—'}</td>
                <td className="p-3">{formatTime(r.checkInTime)}</td>
                <td className="p-3"><StatusBadge status={r.displayStatus || r.status} /></td>
                <td className="p-3">{formatTime(r.checkOutTime)}</td>
                <td className="p-3">{formatDuration(r.workingDuration)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No matching records.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
