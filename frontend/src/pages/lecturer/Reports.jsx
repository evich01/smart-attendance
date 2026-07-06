import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { courseApi, reportApi } from '../../api/endpoints';
import client from '../../api/client';

export default function LecturerReports() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    courseApi.myCourses().then(({ data }) => setCourses(data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourse) { setReport(null); return; }
    reportApi.courseReport(selectedCourse)
      .then(({ data }) => setReport(data.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load report'));
  }, [selectedCourse]);

  async function handleExport() {
    if (!selectedCourse) return;
    const res = await client.get(`/reports/export/${selectedCourse}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report?.course?.code || 'course'}_attendance.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Course Reports</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select className="input sm:max-w-xs" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
          <option value="">Select a course…</option>
          {courses.map((c) => <option key={c._id} value={c._id}>{c.code} — {c.name}</option>)}
        </select>
        {report && <button onClick={handleExport} className="btn-secondary">Export CSV</button>}
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {report && (
        <div className="card overflow-x-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="font-semibold">{report.course.code} — {report.course.name}</p>
            <p className="text-sm text-gray-500">{report.totalSessions} session(s) held</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3">Student</th><th className="p-3">Attended</th><th className="p-3">Total</th>
                <th className="p-3">%</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.students.map((s) => (
                <tr key={s.studentId} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-3">{s.studentName} <span className="text-gray-400 text-xs">({s.studentNumber})</span></td>
                  <td className="p-3">{s.attended}</td>
                  <td className="p-3">{s.total}</td>
                  <td className="p-3">{s.percentage}%</td>
                  <td className="p-3"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
              {report.students.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No enrolled students.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
