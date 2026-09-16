import React, { useCallback, useEffect, useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import { leaveApi } from '../api/endpoints';
import { formatDate } from '../utils/format';

const LEAVE_TYPES = { annual: 'Annual Leave', sick: 'Sick Leave', personal: 'Personal', other: 'Other' };

export default function LeaveReviewPanel({ title = 'Leave Requests' }) {
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(null);
  const [notes, setNotes] = useState('');

  const load = useCallback(() => {
    leaveApi.reviewList({ status: statusFilter, page, limit: 10 })
      .then(({ data }) => { setLeaves(data.data); setPagination(data.pagination); })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load leave requests'));
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  async function handleReview(id, status) {
    setError('');
    try {
      await leaveApi.approveReject(id, status, notes);
      setReviewing(null);
      setNotes('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Review failed');
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <select className="input sm:max-w-[180px]" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <th className="p-3">Employee</th>
              <th className="p-3">Type</th>
              <th className="p-3">Dates</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">
                  <p className="font-medium">{l.employeeName}</p>
                  <p className="text-xs text-gray-400">{l.employeeCode}</p>
                </td>
                <td className="p-3 capitalize">{LEAVE_TYPES[l.type] || l.type}</td>
                <td className="p-3">{formatDate(l.startDate)} – {formatDate(l.endDate)}</td>
                <td className="p-3 max-w-xs truncate" title={l.reason}>{l.reason}</td>
                <td className="p-3"><StatusBadge status={l.status} type="leave" /></td>
                <td className="p-3">
                  {l.status === 'pending' ? (
                    <button className="text-primary-600 hover:underline" onClick={() => { setReviewing(l); setNotes(''); }}>Review</button>
                  ) : (
                    <span className="text-gray-400 text-xs">{l.reviewNotes || '—'}</span>
                  )}
                </td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No leave requests found.</td></tr>
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

      {reviewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-2">Review Leave Request</h2>
            <p className="text-sm text-gray-500 mb-4">{reviewing.employeeName} — {LEAVE_TYPES[reviewing.type]}</p>
            <textarea className="input min-h-[80px] mb-4" placeholder="Review notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={() => handleReview(reviewing.id, 'approved')}>Approve</button>
              <button className="btn-danger flex-1" onClick={() => handleReview(reviewing.id, 'rejected')}>Reject</button>
              <button className="btn-secondary flex-1" onClick={() => setReviewing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
