import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';

const LINKS_BY_ROLE = {
  admin: [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/courses', label: 'Courses' },
    { to: '/admin/analytics', label: 'Analytics' },
    { to: '/admin/settings', label: 'Settings' }
  ],
  lecturer: [
    { to: '/lecturer', label: 'My Courses', end: true },
    { to: '/lecturer/reports', label: 'Reports' }
  ],
  student: [
    { to: '/student', label: 'Dashboard', end: true },
    { to: '/student/scanner', label: 'Scan QR Code' },
    { to: '/student/history', label: 'Attendance History' }
  ]
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = LINKS_BY_ROLE[user?.role] || [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <span className="font-bold text-primary-600">Smart Attendance</span>
        <button aria-label="Toggle menu" className="btn-secondary px-3 py-1" onClick={() => setOpen((o) => !o)}>
          ☰
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${open ? 'block' : 'hidden'} md:block w-full md:w-64 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4`}
      >
        <div className="hidden md:block mb-6">
          <h1 className="text-lg font-bold text-primary-600">Smart Attendance</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role} portal</p>
        </div>
        <nav className="space-y-1" aria-label="Main navigation">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button onClick={toggle} className="btn-secondary w-full" aria-label="Toggle dark mode">
            {dark ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
          <button onClick={handleLogout} className="btn-danger w-full">
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}
