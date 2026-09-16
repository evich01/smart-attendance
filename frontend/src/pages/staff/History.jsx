import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { attendanceApi } from '../../api/endpoints';
import { formatDate, formatTime, formatDuration } from '../../utils/format';

export default function StaffHistory() {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    attendanceApi.myHistory({ page, limit: 20 })
      .then(({ data }) => { setRecords(data.data); setPagination(data.pagination); })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load history'));
  }, [page]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Attendance History</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-700 text-gray-500">
              <th className="p-3">Date</th>
              <th className="p-3">Check-In</th>
              <th className="p-3">Status</th>
              <th className="p-3">Check-Out</th>
              <th className="p-3">Working Time</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">{formatDate(r.date)}</td>
                <td className="p-3">{formatTime(r.checkInTime)}</td>
                <td className="p-3"><StatusBadge status={r.status} /></td>
                <td className="p-3">{formatTime(r.checkOutTime)}</td>
                <td className="p-3">{formatDuration(r.workingDuration)}</td>
              </tr>
            ))}
            {records.length === 0 && !error && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No attendance records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={p === page ? 'btn-primary px-3 py-1' : 'btn-secondary px-3 py-1'}>{p}</button>
          ))}
        </div>
      )}
    </Layout>
  );
}
