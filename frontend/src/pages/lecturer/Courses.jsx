import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { courseApi, attendanceApi } from '../../api/endpoints';

export default function LecturerCourses() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    courseApi.myCourses()
      .then(({ data }) => setCourses(data.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load courses'));
  }, []);

  async function handleStartSession(e) {
    e.preventDefault();
    if (!selectedCourse) { setError('Please select a course first.'); return; }
    setCreating(true); setError('');
    try {
      const { data } = await attendanceApi.createSession(selectedCourse, title);
      navigate(`/lecturer/session/${data.data.sessionId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">My Courses</h1>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold mb-4">Start Attendance Session</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleStartSession} className="flex flex-col sm:flex-row gap-3">
          <select className="input sm:max-w-xs" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="">Select a course…</option>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.code} — {c.name}</option>)}
          </select>
          <input className="input sm:max-w-xs" placeholder="Session title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button type="submit" disabled={creating} className="btn-primary whitespace-nowrap">
            {creating ? 'Starting…' : 'Start Session'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-3">No location step required — just pick a course and go.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c) => (
          <div key={c._id} className="card p-5">
            <p className="font-bold">{c.code}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{c.name}</p>
            <p className="text-xs text-gray-400 mt-2">{c.semester} · {c.academicYear} · {c.credits} credits</p>
          </div>
        ))}
        {courses.length === 0 && !error && <p className="text-gray-500">No courses assigned yet.</p>}
      </div>
    </Layout>
  );
}
