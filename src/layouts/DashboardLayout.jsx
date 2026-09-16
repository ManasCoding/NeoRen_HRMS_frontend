import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Clock,
  CheckSquare,
  FileText,
  Calendar,
  ClipboardList,
  Bell,
  ShieldCheck,
  LogOut
} from 'lucide-react';

const DashboardLayout = ({ children, title, subtitle, employeeSlug, hideHeader = false }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Attendance', icon: <CheckSquare size={18} />, path: `/employee/${employeeSlug}/attendance` },
    { name: 'Hourly Update', icon: <Clock size={18} />, path: `/employee/${employeeSlug}/schedule` },
  ];

  const handleLogout = () => {
    // Logout logic
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {!hideHeader && (
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Employee Portal</p>
              <h1 className="text-2xl md:text-3xl font-bold text-text-main">{title}</h1>
              {subtitle && <p className="text-text-muted text-sm mt-1">{subtitle}</p>}
            </div>
            <div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </header>
        )}

        <main className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
