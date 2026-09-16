import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { reportApi, userApi, departmentApi } from '../../api/endpoints';
import { formatDate, formatTime, formatDuration, toInputDate } from '../../utils/format';

export default function Reports() {
  const [filters, setFilters] = useState({
    from: toInputDate(new Date(Date.now() - 30 * 86400000)),
    to: toInputDate(),
    employeeId: '',
    departmentId: '',
    status: ''
  });
  const [report, setReport] = useState(null);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.listStaff().then(({ data }) => setStaff(data.data)).catch(() => {});
    departmentApi.list().then(({ data }) => setDepartments(data.data)).catch(() => {});
  }, []);

  async function loadReport(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await reportApi.attendanceReport(filters);
      setReport(data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const { data } = await reportApi.exportCsv(filters);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${filters.from}_${filters.to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || 'Export failed');
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Attendance Reports</h1>

      <form onSubmit={loadReport} className="card p-5 mb-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <div>
          <label className="label">Employee</label>
          <select className="input" value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}>
            <option value="">All employees</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Department</label>
          <select className="input" value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="missing_checkout">Missing Check-Out</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Loading…' : 'Generate'}</button>
          <button type="button" onClick={handleExport} className="btn-secondary flex-1">Export CSV</button>
        </div>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard label="Total Records" value={report.summary.total} />
            <SummaryCard label="Present" value={report.summary.present} />
            <SummaryCard label="Late" value={report.summary.late} />
            <SummaryCard label="Absent" value={report.summary.absent} />
            <SummaryCard label="Missing Check-Out" value={report.summary.missing_checkout} />
            <SummaryCard label="Avg Working Hours" value={report.summary.averageWorkingHours} />
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700 text-gray-500">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Check-In</th>
                  <th className="p-3">Check-Out</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Working Time</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="p-3">{r.employeeName}</td>
                    <td className="p-3">{r.department || '—'}</td>
                    <td className="p-3">{formatDate(r.date)}</td>
                    <td className="p-3">{formatTime(r.checkInTime)}</td>
                    <td className="p-3">{formatTime(r.checkOutTime)}</td>
                    <td className="p-3"><StatusBadge status={r.status} /></td>
                    <td className="p-3">{formatDuration(r.workingDuration)}</td>
                  </tr>
                ))}
                {report.rows.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500">No records for selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
