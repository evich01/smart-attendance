import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout.jsx';
import { courseApi, userApi } from '../../api/endpoints';

const EMPTY_FORM = { code: '', name: '', lecturerId: '', credits: 3, semester: '', academicYear: '' };

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [enrollModal, setEnrollModal] = useState(null); // course being enrolled into
  const [enrollEmail, setEnrollEmail] = useState('');
  const [unenrolledStudents, setUnenrolledStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    Promise.all([
      courseApi.listAll(),
      userApi.listLecturers()
    ])
      .then(([coursesRes, lecturersRes]) => {
        setCourses(coursesRes.data.data);
        setLecturers(lecturersRes.data.data);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load courses'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadUnenrolledStudents = useCallback(() => {
    if (!enrollModal) return;
    courseApi.getUnenrolledStudents(enrollModal._id, searchQuery)
      .then(res => setUnenrolledStudents(res.data.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load students'));
  }, [enrollModal, searchQuery]);

  useEffect(() => {
    if (enrollModal) {
      loadUnenrolledStudents();
    }
  }, [enrollModal, loadUnenrolledStudents]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(course) {
    setEditing(course);
    setForm({
      code: course.code,
      name: course.name,
      lecturerId: course.lecturerId?._id || '',
      credits: course.credits,
      semester: course.semester,
      academicYear: course.academicYear
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await courseApi.update(editing._id, form);
      } else {
        await courseApi.create(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this course? Enrollments will also be removed.')) return;
    await courseApi.remove(id);
    load();
  }

  async function handleEnroll(e) {
    e.preventDefault();
    setError(''); setNotice('');
    try {
      await courseApi.enroll(enrollModal._id, enrollEmail);
      setNotice(`Enrolled ${enrollEmail} successfully.`);
      setEnrollEmail('');
      loadUnenrolledStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Enrollment failed');
    }
  }

  async function handleQuickEnroll(student) {
    setError(''); setNotice('');
    try {
      await courseApi.enroll(enrollModal._id, student.email);
      setNotice(`Enrolled ${student.email} successfully.`);
      loadUnenrolledStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Enrollment failed');
    }
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <button className="btn-primary" onClick={openCreate}>+ New Course</button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <th className="p-3">Code</th><th className="p-3">Name</th><th className="p-3">Lecturer</th>
              <th className="p-3">Semester</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c._id} className="border-b border-gray-100 dark:border-gray-80">
                <td className="p-3 font-medium">{c.code}</td>
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.lecturerId?.userId?.name || '—'}</td>
                <td className="p-3">{c.semester} {c.academicYear}</td>
                <td className="p-3 space-x-2 whitespace-nowrap">
                  <button className="text-primary-600 hover:underline" onClick={() => openEdit(c)}>Edit</button>
                  <button className="text-primary-600 hover:underline" onClick={() => { setEnrollModal(c); setNotice(''); setSearchQuery(''); }}>Enrol</button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(c._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-50">No courses yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Course' : 'New Course'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="label">Course Code</label>
                <input required disabled={!!editing} className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div>
                <label className="label">Course Name</label>
                <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Lecturer</label>
                <select
                  className="input"
                  value={form.lecturerId}
                  onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}
                >
                  <option value="">Select a lecturer</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.name} ({lecturer.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Credits</label>
                  <input type="number" min="1" max="12" className="input" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Semester</label>
                  <input className="input" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Academic Year</label>
                <input className="input" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {enrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md p-6 max-h-[80vh] flex flex-col">
            <h2 className="text-lg font-bold mb-1">Enrol Student</h2>
            <p className="text-sm text-gray-500 mb-4">into {enrollModal.code} — {enrollModal.name}</p>
            {notice && <p className="text-green-600 text-sm mb-2">{notice}</p>}
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            
            <div className="mb-3">
              <label className="label">Search Students</label>
              <input 
                className="input" 
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto mb-4 max-h-60 border border-gray-200 dark:border-gray-700 rounded-lg">
              {unenrolledStudents.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No unenrolled students found.</div>
              ) : (
                unenrolledStudents.map(student => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => setEnrollEmail(student.email)}
                  >
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.email} · {student.studentNumber}</p>
                    </div>
                    <button 
                      className="btn-primary text-sm px-3 py-1"
                      onClick={(e) => { e.stopPropagation(); handleQuickEnroll(student); }}
                    >
                      Enrol
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleEnroll} className="space-y-3">
              <div>
                <label className="label">Or Enter Email Manually</label>
                <input required type="email" className="input" value={enrollEmail} onChange={(e) => setEnrollEmail(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Enrol</button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setEnrollModal(null)}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
