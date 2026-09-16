import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { auditApi } from '../../api/endpoints';
import { formatDate, formatTime } from '../../utils/format';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    auditApi.list({ action: actionFilter, page, limit: 25 })
      .then(({ data }) => { setLogs(data.data); setPagination(data.pagination); })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load audit logs'));
  }, [actionFilter, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <input
          className="input sm:max-w-xs" placeholder="Filter by action…"
          value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
        />
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-700 text-gray-500">
              <th className="p-3">Timestamp</th>
              <th className="p-3">User</th>
              <th className="p-3">Action</th>
              <th className="p-3">Details</th>
              <th className="p-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3 whitespace-nowrap">{formatDate(l.timestamp)} {formatTime(l.timestamp)}</td>
                <td className="p-3">
                  <p className="font-medium">{l.userName}</p>
                  <p className="text-xs text-gray-400 capitalize">{l.userRole}</p>
                </td>
                <td className="p-3 font-mono text-xs">{l.action}</td>
                <td className="p-3 text-xs max-w-md truncate" title={l.details}>{l.details || '—'}</td>
                <td className="p-3 text-xs">{l.ipAddress || '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No audit logs found.</td></tr>
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
