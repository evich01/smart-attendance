import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { attendanceApi } from '../../api/endpoints';
import { formatDate, formatTime, formatDuration } from '../../utils/format';

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    attendanceApi.myToday()
      .then(({ data: d }) => setData(d.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load status'));

    const interval = setInterval(() => {
      attendanceApi.myToday().then(({ data: d }) => setData(d.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">My Attendance</h1>
      <p className="text-gray-500 mb-6">{formatDate(new Date())}</p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!data ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <>
          <div className="card p-6 mb-6 max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Today&apos;s Status</h2>
              <StatusBadge status={data.status} />
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Check-In</dt>
                <dd className="font-semibold text-lg">{formatTime(data.checkInTime)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Check-Out</dt>
                <dd className="font-semibold text-lg">{formatTime(data.checkOutTime)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Working Duration</dt>
                <dd className="font-semibold text-lg">{formatDuration(data.workingDuration)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Active Sessions</dt>
                <dd className="text-sm mt-1">
                  {data.activeCheckIn && <span className="badge-good mr-1">Check-In Open</span>}
                  {data.activeCheckOut && <span className="badge-good">Check-Out Open</span>}
                  {!data.activeCheckIn && !data.activeCheckOut && <span className="text-gray-400">None</span>}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/staff/scanner" className="btn-primary">Scan QR Code</Link>
            <Link to="/staff/history" className="btn-secondary">View History</Link>
            <Link to="/staff/leave" className="btn-secondary">Request Leave</Link>
          </div>
        </>
      )}
    </Layout>
  );
}
