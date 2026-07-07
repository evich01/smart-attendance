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
    <div className="min-h-screen flex flex-col md:flex-row page-gradient">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl">
        <span className="font-extrabold text-xl bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Smart Attendance</span>
        <button aria-label="Toggle menu" className="btn-secondary px-3 py-1.5" onClick={() => setOpen((o) => !o)}>
          <span className="text-xl">☰</span>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${open ? 'block' : 'hidden'} md:block w-full md:w-72 shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800 p-6`}
      >
        <div className="hidden md:block mb-8">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Smart Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mt-1">{user?.role} portal</p>
        </div>
        <nav className="space-y-2" aria-label="Main navigation">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/25'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-800 space-y-3">
          <button onClick={toggle} className="btn-secondary w-full" aria-label="Toggle dark mode">
            {dark ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
          <button onClick={handleLogout} className="btn-danger w-full">
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
