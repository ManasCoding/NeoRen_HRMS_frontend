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
  LogOut,
  Menu,
  X,
  FileSignature
} from 'lucide-react';

const EmployeeLayout = ({ children, title, subtitle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Employee', email: 'employee@company.com', slug: '' };
  const slug = user.slug || '';

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: `/employee/${slug}/dashboard` },
    { name: 'Profile', icon: <User size={18} />, path: `/employee/${slug}/profile` },
    { name: 'Directory', icon: <User size={18} />, path: `/employee/${slug}/directory` },
    { name: 'Hourly Report', icon: <Clock size={18} />, path: `/employee/${slug}/schedule` },
    { name: 'Attendance', icon: <ClipboardList size={18} />, path: `/employee/${slug}/attendance` },
    { name: 'Leave', icon: <Calendar size={18} />, path: `/employee/${slug}/apply-leave` },
    { name: 'Resignation', icon: <FileSignature size={18} />, path: `/employee/${slug}/resignation` },
    { name: 'Payslip', icon: <FileText size={18} />, path: `/employee/${slug}/payslip` },
    { name: 'Company Policy', icon: <ShieldCheck size={18} />, path: `/employee/${slug}/policy` },
    { name: 'Site Visits', icon: <ClipboardList size={18} />, path: `/employee/${slug}/site-visits` },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#0f172a] text-white p-4 flex items-center justify-between shadow-lg z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
          </div>
          <span className="font-bold tracking-tight">Employee Portal</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#0B1426] text-white p-6 flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 border-r border-slate-800
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="hidden md:flex flex-col items-center gap-4 mb-10 px-2 text-center mt-4">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center overflow-hidden shadow-lg shadow-black/20">
            <img src="/logo.jpeg" alt="CitiCon" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span class="text-2xl font-black text-amber-500">OG</span>'; }} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white leading-tight">
              CitiCon<br />GLOBAL
            </h2>
            <p className="text-[11px] text-[#2563eb] font-bold uppercase tracking-[0.2em] mt-3">Employee Portal</p>
          </div>
        </div>

        {/* Signed in user */}
        <div className="flex items-center gap-4 mb-8 px-2">
          <div className="overflow-hidden flex flex-col justify-center">
            <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Signed in as</p>
            <p className="text-[15px] font-bold text-white truncate leading-none mb-1">{user.name}</p>
            <p className="text-[12px] text-[#64748b] truncate leading-none">{user.email}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${isActive
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#3730a3] text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {React.cloneElement(link.icon, { strokeWidth: isActive ? 2.5 : 2 })}
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="mt-auto pt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[13px] font-bold text-rose-500 hover:text-white hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={18} strokeWidth={2.5} />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#f1f5f9] p-4 md:p-8 lg:p-10">
        {title && (
          <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 md:mb-10 gap-6">
            <div>
              <h1 className="text-3xl font-black text-[#1e293b] leading-tight">{title}</h1>
              {subtitle && <p className="text-slate-400 text-sm mt-1 font-medium">{subtitle}</p>}
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-200">
              <button className="relative p-2.5 bg-white text-slate-400 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-bold text-[#1e293b]">{user.name}</p>
                  <p className="text-xs text-slate-400">Employee</p>
                </div>
              </div>
            </div>
          </header>
        )}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>

        {/* Footer Credit */}
        <footer className="mt-20 pb-10 border-t border-slate-200 pt-8 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Designed & Developed by <span className="text-slate-400">ODITECH GLOBAL</span>
          </p>
        </footer>
        <div className="py-6 text-center">
          <p className="text-[11px] font-medium text-slate-400">© 2026 CitiCon. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
};

export default EmployeeLayout;
