import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { leaveApi } from '../../api/endpoints';
import { formatDate, toInputDate } from '../../utils/format';

const EMPTY = { type: 'annual', startDate: toInputDate(), endDate: toInputDate(), reason: '' };

export default function StaffLeave() {
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function load() {
    leaveApi.myLeaves()
      .then(({ data }) => setLeaves(data.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load leave requests'));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      await leaveApi.submit(form);
      setNotice('Leave request submitted successfully.');
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    }
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Leave Requests</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New Request'}
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {notice && <p className="text-green-600 mb-4">{notice}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 max-w-xl space-y-4">
          <div>
            <label className="label">Leave Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input type="date" required className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" required className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea required className="input min-h-[80px]" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">Submit Request</button>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-700 text-gray-500">
              <th className="p-3">Type</th>
              <th className="p-3">Dates</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3 capitalize">{l.type}</td>
                <td className="p-3">{formatDate(l.startDate)} – {formatDate(l.endDate)}</td>
                <td className="p-3 max-w-xs truncate" title={l.reason}>{l.reason}</td>
                <td className="p-3"><StatusBadge status={l.status} type="leave" /></td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-gray-500">No leave requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
