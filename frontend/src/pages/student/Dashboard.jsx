import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { courseApi } from '../../api/endpoints';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCourses, setShowCourses] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const { data } = await courseApi.enrolledCourses();
        setCourses(data.data);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  function handleRegisterAttendance() {
    setShowCourses(true);
  }

  function handleScanQR() {
    navigate('/student/scanner');
  }

  function handleViewHistory() {
    navigate('/student/history');
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleRegisterAttendance}>
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-lg font-semibold mb-2">Register Attendance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">View your courses and scan QR codes</p>
        </div>

        <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleScanQR}>
          <div className="text-4xl mb-3">📷</div>
          <h2 className="text-lg font-semibold mb-2">Scan QR Code</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Directly open camera to scan</p>
        </div>

        <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleViewHistory}>
          <div className="text-4xl mb-3">📊</div>
          <h2 className="text-lg font-semibold mb-2">Attendance History</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">View your attendance records</p>
        </div>
      </div>

      {showCourses && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Courses</h2>
            <button onClick={() => setShowCourses(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              ✕
            </button>
          </div>

          {loading && <p className="text-gray-500">Loading courses...</p>}

          {!loading && courses.length === 0 && (
            <p className="text-gray-500">You are not enrolled in any courses yet.</p>
          )}

          {!loading && courses.length > 0 && (
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{course.code}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{course.name}</p>
                    </div>
                    <button onClick={handleScanQR} className="btn-primary">
                      Scan QR Code
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
