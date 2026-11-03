import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Heart, Shield, Cloud, Check, LogOut, Bell, Code,
  Globe
} from 'lucide-react';
import api from '../services/api';

const parseDuration = (message) => {
  if (!message) return 2 * 60; // Default 2 hours
  
  const hoursMatch = message.match(/offline\s+for\s+(\d+)\s*hour/i);
  if (hoursMatch) {
    return parseInt(hoursMatch[1], 10) * 60;
  }
  
  const minutesMatch = message.match(/offline\s+for\s+(\d+)\s*min/i);
  if (minutesMatch) {
    return parseInt(minutesMatch[1], 10);
  }
  
  return 2 * 60; // Default 2 hours
};

const MaintenanceMode = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    maintenance_message: 'System will be offline for 4 hours.',
    maintenance_start_time: ''
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Load current user
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);

    // Fetch settings
    api.get('/settings')
      .then(res => {
        if (res.data.success && res.data.settings) {
          setSettings(res.data.settings);
        }
      })
      .catch(err => console.error('Error fetching settings for maintenance:', err));
  }, []);

  useEffect(() => {
    const startTimeStr = settings.maintenance_start_time;
    const startTime = startTimeStr ? new Date(startTimeStr).getTime() : Date.now() - 15 * 60 * 1000;
    
    const durationMinutes = parseDuration(settings.maintenance_message);
    const totalSeconds = durationMinutes * 60;

    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsedSeconds);
      const pct = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));

      setTimeLeft(remaining);
      setPercentage(pct);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [settings.maintenance_start_time, settings.maintenance_message]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(h)}:${pad(m)}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans flex flex-col justify-between">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden">
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight leading-none text-slate-800">CitiCon <span className="text-[10px] text-slate-400 font-normal">Pvt. Ltd.</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Innovate • Build • Elevate</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm relative">
            <Bell size={18} className="text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#2563eb] rounded-full"></span>
          </button>

          {/* Logout Button */}
          {currentUser && (
            <button 
              onClick={handleLogout}
              title="Logout" 
              className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center hover:bg-rose-100 transition-colors shadow-sm"
            >
              <LogOut size={18} className="text-rose-600" />
            </button>
          )}

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-extrabold text-slate-800 leading-none">{currentUser?.name || 'Oditech Global'}</p>
              <p className="text-[9px] font-black uppercase text-[#8b5cf6] tracking-wider mt-1">Super User</p>
            </div>
            <img 
              src="/demo/emp1.png" 
              alt="Avatar" 
              className="w-9 h-9 rounded-full object-cover border-2 border-white ring-2 ring-slate-100" 
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop";
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center gap-8">
        
        {/* Upper Card containing Left Detail Panel and Right Graphic */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 md:p-10 lg:p-12 flex flex-col lg:flex-row items-center gap-10">
          
          {/* Left Columns Details */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-600">
              <Code size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Developer Mode</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">
                We're Building <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Something Amazing! 🚀</span>
              </h2>
              <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed">
                Our developer is working on this website. Please login after some time.
              </p>
            </div>

            {/* Live Timer Alert Panel */}
            <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="text-[#2563eb] animate-spin" style={{ animationDuration: '6s' }} size={24} />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-extrabold text-[#2563eb] text-sm">Please wait a moment...</h4>
                  <p className="text-slate-500 text-xs font-semibold">Developer is working on the website</p>
                  <p className="text-[11px] text-slate-400">You will be able to login automatically.</p>
                </div>
              </div>

              {/* Progress and Countdown bar */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Estimated time remaining: <span className="text-blue-600 font-black">{formatTime(timeLeft)}</span></span>
                  <span className="text-blue-600 font-black">{percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Graphic */}
          <div className="flex-1 w-full max-w-[500px] flex justify-center">
            <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-md">
              <img 
                src="/developer_working.png" 
                alt="Developer Working Illustration" 
                className="w-full h-auto object-cover rounded-2xl scale-100 hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/20 to-transparent pointer-events-none"></div>
            </div>
          </div>

        </div>

        {/* Lower Row Grid: WIP, Love It, Credits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Work in progress checklist */}
          <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Code size={16} strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">Work in Progress</h3>
            </div>
            
            <ul className="space-y-4">
              {[
                { text: 'Initializing...', completed: true },
                { text: 'Loading modules...', completed: true },
                { text: 'Building UI components...', completed: true },
                { text: 'Optimizing performance...', completed: true },
                { text: 'Almost ready...', completed: false }
              ].map((task, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                    <span className="text-[13px] font-medium text-slate-500">
                      {task.text}
                    </span>
                  </div>
                  {task.completed ? (
                    <Check size={16} strokeWidth={3} className="text-emerald-500" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Why you'll love it features */}
          <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center">
                <Heart size={16} fill="currentColor" className="text-rose-400" />
              </div>
              <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">Why You'll Love It</h3>
            </div>
            
            <ul className="space-y-4">
              {[
                { text: 'Beautiful & Modern UI', icon: <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><Heart size={10} /></div> },
                { text: 'Fast & Optimized', icon: <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Check size={10} strokeWidth={3}/></div> },
                { text: 'Secure & Reliable', icon: <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Shield size={10} /></div> },
                { text: 'Built with Latest Tech', icon: <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center"><Cloud size={10} /></div> }
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-[13px] font-medium text-slate-600">
                  {item.icon}
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Designed & Developed credits card */}
          <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between">
            
            <div className="flex items-start gap-4">
              <img 
                src="/demo/emp1.png" 
                alt="Oditech Global" 
                className="w-14 h-14 rounded-full object-cover border border-slate-200"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                }}
              />
              <div className="mt-1">
                <p className="text-[11px] font-medium text-slate-500 mb-0.5">Designed & Developed by</p>
                <h4 className="text-[15px] font-bold text-slate-800 leading-none">Oditech Global</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-1.5">Software & IT Solutions</p>
              </div>
            </div>

            {/* Tech Badges */}
            <div className="flex flex-wrap gap-2 mt-6">
              {[
                { name: 'HTML5', bg: 'bg-orange-500', text: 'text-white' },
                { name: 'CSS3', bg: 'bg-blue-600', text: 'text-white' },
                { name: 'JS', bg: 'bg-yellow-400', text: 'text-slate-900' },
                { name: 'React', bg: 'bg-white', text: 'text-cyan-400', border: 'border border-slate-200' },
                { name: 'NodeJS', bg: 'bg-white', text: 'text-emerald-500', border: 'border border-slate-200' }
              ].map((badge, idx) => (
                <div 
                  key={idx} 
                  className={`px-2.5 py-1 ${badge.bg} ${badge.text} ${badge.border || ''} rounded-md text-[10px] font-black tracking-wide uppercase flex items-center justify-center`}
                >
                  {badge.name}
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
              {['linkedin', 'youtube', 'twitter', 'instagram', 'globe'].map((social, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-[10px] border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                  <Globe size={14} />
                </a>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* Footer credits */}
      <footer className="py-6 border-t border-slate-100 text-center text-xs font-semibold text-slate-400">
        <p>© 2026 CitiCon. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default MaintenanceMode;
