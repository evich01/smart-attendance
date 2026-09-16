import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminDepartments from './pages/admin/Departments.jsx';
import AdminReports from './pages/admin/Reports.jsx';
import AdminSettings from './pages/admin/Settings.jsx';
import AdminAuditLogs from './pages/admin/AuditLogs.jsx';
import AdminLeaveReview from './pages/admin/LeaveReview.jsx';

import ManagerDashboard from './pages/manager/Dashboard.jsx';
import ManagerCheckInQr from './pages/manager/CheckInQr.jsx';
import ManagerCheckOutQr from './pages/manager/CheckOutQr.jsx';
import ManagerAttendance from './pages/manager/Attendance.jsx';
import ManagerLeaveReview from './pages/manager/LeaveReview.jsx';

import StaffDashboard from './pages/staff/Dashboard.jsx';
import StaffScanner from './pages/staff/Scanner.jsx';
import StaffHistory from './pages/staff/History.jsx';
import StaffLeave from './pages/staff/Leave.jsx';
import StaffProfile from './pages/staff/Profile.jsx';

const HOME_BY_ROLE = { admin: '/admin', manager: '/manager', staff: '/staff' };

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
      <Route path="/admin/departments" element={<ProtectedRoute roles={['admin']}><AdminDepartments /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['admin']}><AdminAuditLogs /></ProtectedRoute>} />
      <Route path="/admin/leaves" element={<ProtectedRoute roles={['admin']}><AdminLeaveReview /></ProtectedRoute>} />

      <Route path="/manager" element={<ProtectedRoute roles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/check-in-qr" element={<ProtectedRoute roles={['manager']}><ManagerCheckInQr /></ProtectedRoute>} />
      <Route path="/manager/check-out-qr" element={<ProtectedRoute roles={['manager']}><ManagerCheckOutQr /></ProtectedRoute>} />
      <Route path="/manager/attendance" element={<ProtectedRoute roles={['manager']}><ManagerAttendance /></ProtectedRoute>} />
      <Route path="/manager/leaves" element={<ProtectedRoute roles={['manager']}><ManagerLeaveReview /></ProtectedRoute>} />

      <Route path="/staff" element={<ProtectedRoute roles={['staff']}><StaffDashboard /></ProtectedRoute>} />
      <Route path="/staff/scanner" element={<ProtectedRoute roles={['staff']}><StaffScanner /></ProtectedRoute>} />
      <Route path="/staff/history" element={<ProtectedRoute roles={['staff']}><StaffHistory /></ProtectedRoute>} />
      <Route path="/staff/leave" element={<ProtectedRoute roles={['staff']}><StaffLeave /></ProtectedRoute>} />
      <Route path="/staff/profile" element={<ProtectedRoute roles={['staff']}><StaffProfile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

