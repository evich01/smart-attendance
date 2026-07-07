import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  Users,
  BookOpen,
  LineChart,
  Settings,
  FileText,
  Scan,
  History
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';

const LINKS_BY_ROLE = {
  admin: [
    { to: '/admin', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/analytics', label: 'Analytics', icon: LineChart },
    { to: '/admin/settings', label: 'Settings', icon: Settings }
  ],
  lecturer: [
    { to: '/lecturer', label: 'My Courses', end: true, icon: BookOpen },
    { to: '/lecturer/reports', label: 'Reports', icon: FileText }
  ],
  student: [
    { to: '/student', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/student/scanner', label: 'Scan QR Code', icon: Scan },
    { to: '/student/history', label: 'Attendance History', icon: History }
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
      <div className="md:hidden flex items-center justify-between p-4 border-b border-cream-300/50 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
        <span className="font-extrabold text-xl bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Smart Attendance</span>
        <button aria-label="Toggle menu" className="btn-secondary px-3 py-1.5" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${open ? 'block' : 'hidden'} md:block w-full md:w-72 shrink-0 bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl border-r border-cream-300/50 dark:border-gray-700 p-6`}
      >
        <div className="hidden md:block mb-8">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Smart Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-cream-200/70 capitalize mt-1">{user?.role} portal</p>
        </div>
        <nav className="space-y-2" aria-label="Main navigation">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-xl shadow-primary-500/20'
                      : 'text-gray-700 dark:text-cream-100 hover:bg-cream-100 dark:hover:bg-gray-700 hover:shadow-md'
                  }`
                }
              >
                <Icon size={18} />
                {l.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-8 pt-6 border-t border-cream-300/50 dark:border-gray-700 space-y-3">
          <button onClick={toggle} className="btn-secondary w-full" aria-label="Toggle dark mode">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={handleLogout} className="btn-danger w-full">
            <LogOut size={18} />
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
