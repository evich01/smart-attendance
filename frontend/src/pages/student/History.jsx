import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { reportApi } from '../../api/endpoints';

export default function History() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    reportApi.studentHistory()
      .then(({ data }) => setHistory(data.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load attendance history'));
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Attendance History</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        {history.map((h) => (
          <div key={h.courseCode} className="card p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">{h.courseCode}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{h.courseName}</p>
              </div>
              <StatusBadge status={h.status} />
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mt-3">
              <div
                className={`h-2.5 rounded-full ${h.percentage >= 75 ? 'bg-green-500' : h.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${h.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{h.attended} / {h.total} sessions attended ({h.percentage}%)</p>
          </div>
        ))}
        {history.length === 0 && !error && <p className="text-gray-500">No enrolled courses yet.</p>}
      </div>
    </Layout>
  );
}
