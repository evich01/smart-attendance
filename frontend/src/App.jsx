import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminCourses from './pages/admin/Courses.jsx';
import AdminAnalytics from './pages/admin/Analytics.jsx';
import AdminSettings from './pages/admin/Settings.jsx';

import LecturerCourses from './pages/lecturer/Courses.jsx';
import LecturerLiveSession from './pages/lecturer/LiveSession.jsx';
import LecturerReports from './pages/lecturer/Reports.jsx';

import StudentDashboard from './pages/student/Dashboard.jsx';
import StudentScanner from './pages/student/Scanner.jsx';
import StudentHistory from './pages/student/History.jsx';

const HOME_BY_ROLE = { admin: '/admin', lecturer: '/lecturer', student: '/student' };

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_BY_ROLE[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute roles={['admin']}><AdminCourses /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>} />

      <Route path="/lecturer" element={<ProtectedRoute roles={['lecturer']}><LecturerCourses /></ProtectedRoute>} />
      <Route path="/lecturer/session/:sessionId" element={<ProtectedRoute roles={['lecturer']}><LecturerLiveSession /></ProtectedRoute>} />
      <Route path="/lecturer/reports" element={<ProtectedRoute roles={['lecturer']}><LecturerReports /></ProtectedRoute>} />

      <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/scanner" element={<ProtectedRoute roles={['student']}><StudentScanner /></ProtectedRoute>} />
      <Route path="/student/history" element={<ProtectedRoute roles={['student']}><StudentHistory /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
