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
  Building2,
  BarChart3,
  Settings,
  FileText,
  Scan,
  History,
  QrCode,
  ClipboardList,
  CalendarClock,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';

const LINKS_BY_ROLE = {
  admin: [
    { to: '/admin', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/admin/users', label: 'Employees', icon: Users },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/leaves', label: 'Leave Requests', icon: CalendarClock },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
    { to: '/admin/settings', label: 'Settings', icon: Settings }
  ],
  manager: [
    { to: '/manager', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/manager/check-in-qr', label: 'Check-In QR', icon: QrCode },
    { to: '/manager/check-out-qr', label: 'Check-Out QR', icon: QrCode },
    { to: '/manager/attendance', label: 'Attendance', icon: ClipboardList },
    { to: '/manager/leaves', label: 'Leave Requests', icon: CalendarClock }
  ],
  staff: [
    { to: '/staff', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/staff/scanner', label: 'Scan QR Code', icon: Scan },
    { to: '/staff/history', label: 'Attendance History', icon: History },
    { to: '/staff/leave', label: 'Leave Requests', icon: CalendarClock },
    { to: '/staff/profile', label: 'My Profile', icon: UserIcon }
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
      <div className="md:hidden flex items-center justify-between p-4 border-b border-cream-300/50 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
        <span className="font-extrabold text-xl bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Smart Attendance</span>
        <button aria-label="Toggle menu" className="btn-secondary px-3 py-1.5" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside
        className={`${open ? 'block' : 'hidden'} md:block w-full md:w-72 shrink-0 bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl border-r border-cream-300/50 dark:border-gray-700 p-6`}
      >
        <div className="hidden md:block mb-8">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Smart Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-cream-200/70 capitalize mt-1">{user?.role} portal</p>
          {user?.name && (
            <p className="text-sm text-gray-600 dark:text-cream-200 mt-2 truncate">{user.name}</p>
          )}
          {user?.departmentName && (
            <p className="text-xs text-gray-400 dark:text-cream-300/60 mt-0.5 truncate">{user.departmentName}</p>
          )}
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

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

