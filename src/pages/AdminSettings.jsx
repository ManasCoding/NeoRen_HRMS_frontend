import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { 
  Save, 
  Archive,
  CheckCircle2,
  MapPin,
  Clock,
  Calendar,
  Navigation,
  Bell,
  Trash2,
  ShieldCheck,
  UserPlus,
  Mail,
  Lock,
  User
} from 'lucide-react';

import api from '../services/api';
import PublishAnnouncement from '../components/PublishAnnouncement';
import ActiveAnnouncements from '../components/ActiveAnnouncements';

const SettingCard = ({ label, value, name, onChange, colorClass = "bg-slate-50", type = "text", suffix = "", subLabel = "", readOnly = false }) => (
  <div className={`bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center group transition-all hover:shadow-md relative overflow-hidden ${readOnly ? 'select-none' : ''}`}>
    <div className={`absolute top-0 left-0 w-full h-1.5 ${colorClass}`}></div>
    {readOnly && (
      <div className="absolute top-3 right-3 w-5 h-5 text-slate-300">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1C9.24 1 7 3.24 7 6v1H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v1H9V6c0-1.66 1.34-3 3-3zm0 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>
      </div>
    )}
    <span className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4">{label}</span>
    <div className="flex items-center justify-center gap-1 w-full">
      {readOnly ? (
        <span className="text-2xl font-black text-[#1e293b]">{value}</span>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="bg-transparent border-none p-0 text-2xl font-black text-[#1e293b] w-full text-center focus:outline-none placeholder:text-slate-200"
        />
      )}
      {suffix && <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">{suffix}</span>}
    </div>
    {subLabel && <span className="text-[10px] font-medium text-slate-400 mt-2">{subLabel}</span>}
  </div>
);

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    workday_start: '09:30',
    logout_time: '19:00',
    late_threshold: '09:40',
    max_work_hours: '9.0',
    lunch_start: '13:00',
    lunch_end: '14:00',
    break_duration: '1.0',
    min_work_hours: '4.0',
    half_day_threshold: '13:30',
    overtime_threshold: '18:30',
    casual_leave: '12',
    sick_leave: '10',
    Holidays: '13',
    office_lat: '20.296142',
    office_lng: '85.833122',
    geofence_radius: '50',
    maintenance_mode: 'false',
    maintenance_message: 'System will be offline for 2 hours.'
  });
  
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ fullName: '', email: '', password: '' });
  const [adminLoading, setAdminLoading] = useState(false);
  const [existingAdmin, setExistingAdmin] = useState(null);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings(prev => ({ ...prev, ...res.data.settings }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admin/admins');
      if (res.data.success) setAdmins(res.data.admins);
    } catch (err) {
      console.error('Error fetching admins:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, []);

  useEffect(() => {
    const checkEmail = async () => {
      if (!newAdmin.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdmin.email)) {
        setExistingAdmin(null);
        return;
      }
      setEmailCheckLoading(true);
      try {
        const res = await api.get(`/admin/admins/check-email?email=${encodeURIComponent(newAdmin.email)}`);
        if (res.data.exists && res.data.admin) {
          setExistingAdmin(res.data.admin);
          setNewAdmin(prev => ({ ...prev, fullName: res.data.admin.fullName }));
        } else {
          setExistingAdmin(null);
        }
      } catch (err) {
        console.error('Error checking email:', err);
      } finally {
        setEmailCheckLoading(false);
      }
    };
    
    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [newAdmin.email]);


  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSettings({
            ...settings,
            office_lat: position.coords.latitude.toFixed(6),
            office_lng: position.coords.longitude.toFixed(6)
          });
          setSuccess('Live location captured!');
          setTimeout(() => setSuccess(''), 2000);
        },
        (error) => { setError('Error: ' + error.message); setTimeout(() => setError(''), 3000); }
      );
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const settingsArray = Object.keys(settings).map(key => ({
        key,
        value: settings[key]
      }));
      const res = await api.post('/admin/settings', { settings: settingsArray });
      if (res.data.success) {
        setSuccess('Global policies updated!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error saving settings');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.email) return;
    
    if (newAdmin.password && newAdmin.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setAdminLoading(true);
    try {
      if (existingAdmin) {
        const updateRes = await api.put(`/admin/admins/${existingAdmin._id}`, {
          fullName: newAdmin.fullName,
          email: newAdmin.email,
          password: newAdmin.password
        });
        
        if (updateRes.data.success) {
          setSuccess(`Administrator Updated ✓ ${newAdmin.fullName}'s administrator account has been updated successfully.`);
          setNewAdmin({ fullName: '', email: '', password: '' });
          setExistingAdmin(null);
          fetchAdmins();
          setTimeout(() => setSuccess(''), 5000);
        }
      } else {
        if (!newAdmin.fullName || !newAdmin.password) {
           setError("Please fill all required fields");
           setTimeout(() => setError(''), 3000);
           setAdminLoading(false);
           return;
        }
        const res = await api.post('/admin/admins', newAdmin);
        if (res.data.success) {
          setSuccess('New administrator added!');
          setNewAdmin({ fullName: '', email: '', password: '' });
          fetchAdmins();
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || `Unable to update administrator account. (${err.response?.status || 'Network error'})`;
      setError(msg);
      setTimeout(() => setError(''), 8000);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (adminId === currentUser.id) {
      setError("You cannot delete your own account while logged in.");
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!window.confirm('Are you sure you want to remove this administrator? They will lose all access.')) return;
    try {
      const res = await api.delete(`/admin/admins/${adminId}`);
      if (res.data.success) {
        setAdmins(admins.filter(a => a._id !== adminId));
        setSuccess('Administrator removed');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error deleting admin');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <AdminLayout title="System Configuration" subtitle="Define organization-wide policies and system parameters.">
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#1e293b] p-8 rounded-[40px] text-white shadow-xl shadow-slate-200 overflow-hidden relative">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
           <div className="relative z-10 text-center md:text-left">
              <h3 className="text-2xl font-black mb-1">Global Policy Control</h3>
              <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Update rules across all employee portals.</p>
           </div>
           <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
              {success && (
                <div className="hidden lg:flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest animate-in slide-in-from-right-4">
                   <CheckCircle2 size={16} /> {success}
                </div>
              )}
              {error && (
                <div className="hidden lg:flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-widest animate-in slide-in-from-right-4">
                   <ShieldCheck size={16} /> {error}
                </div>
              )}
              {/* Edit / Lock toggle */}
              <button
                onClick={() => setEditMode(prev => !prev)}
                className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all border ${
                  editMode
                    ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {editMode ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1a5 5 0 0 1 5 5v1h-2V6a3 3 0 0 0-6 0v1h-2V6a5 5 0 0 1 5-5zM3 9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2H3zm7 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg> Lock Settings</>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11V9a9 9 0 1 1 18 0v2h1a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V12a1 1 0 0 1 1-1h1zm2 0h14V9A7 7 0 0 0 5 9v2zm7 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg> Edit Settings</>
                )}
              </button>
              {editMode && (
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-white text-[#1e293b] rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 disabled:opacity-50"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-[#1e293b]/30 border-t-[#1e293b] rounded-full animate-spin"></div> : <Save size={16} />}
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              )}
           </div>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {/* Maintenance Mode Section */}
          <section className="bg-slate-50 border border-slate-200/80 rounded-[32px] p-8 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Clock size={24} className="animate-spin duration-1000" style={{ animationDuration: '8s' }} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-[#1e293b] uppercase tracking-widest">Maintenance Mode</h4>
                  <p className="text-slate-500 text-xs font-medium mt-1">Restrict employee access to the portal while developers perform system work.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ 
                    ...prev, 
                    maintenance_mode: prev.maintenance_mode === 'true' || prev.maintenance_mode === true ? 'false' : 'true' 
                  }))}
                  className={`w-14 h-8 rounded-full transition-colors relative focus:outline-none ${
                    settings.maintenance_mode === 'true' || settings.maintenance_mode === true 
                      ? 'bg-amber-500 shadow-lg shadow-amber-500/20' 
                      : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
                    settings.maintenance_mode === 'true' || settings.maintenance_mode === true
                      ? 'translate-x-6'
                      : 'translate-x-0'
                  }`} />
                </button>
                <span className="text-xs font-black text-[#1e293b] uppercase tracking-wider min-w-[70px]">
                  {settings.maintenance_mode === 'true' || settings.maintenance_mode === true ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {(settings.maintenance_mode === 'true' || settings.maintenance_mode === true) && (
              <div className="mt-6 pt-6 border-t border-slate-200/60 animate-in slide-in-from-top-3 duration-300">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Maintenance Notification Message</label>
                <input 
                  type="text"
                  name="maintenance_message"
                  value={settings.maintenance_message || ''}
                  onChange={handleChange}
                  placeholder="System will be offline for 2 hours."
                  className="w-full mt-2 p-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium text-[#1e293b]"
                />
              </div>
            )}
          </section>

          {/* Timing Section */}
          <section>
            <div className="flex items-center gap-3 mb-6 px-4">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                <Clock size={20} />
              </div>
              <h4 className="text-lg font-black text-[#1e293b] uppercase tracking-widest">Timing &amp; Attendance Rules</h4>
            </div>

            {/* Row 1 — Core shift times */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <SettingCard label="Shift Start"      name="workday_start"   value={settings.workday_start}   onChange={handleChange} type="time"   colorClass="bg-sky-500"     />
              <SettingCard label="Shift End"        name="logout_time"     value={settings.logout_time}     onChange={handleChange} type="time"   colorClass="bg-sky-500"     />
              <SettingCard label="Late Threshold"   name="late_threshold"  value={settings.late_threshold}  onChange={handleChange} type="time"   colorClass="bg-rose-500"    />
              <SettingCard label="Daily Max Hours"  name="max_work_hours"  value={settings.max_work_hours}  onChange={handleChange} suffix="HRS"  type="number" colorClass="bg-emerald-500" />
            </div>

            {/* Row 2 — Lunch & break */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <SettingCard label="Lunch Start"      name="lunch_start"     value={settings.lunch_start}     onChange={handleChange} type="time"   colorClass="bg-violet-500"  subLabel="Lunch break begins" />
              <SettingCard label="Lunch End"        name="lunch_end"       value={settings.lunch_end}       onChange={handleChange} type="time"   colorClass="bg-violet-500"  subLabel="Lunch break ends" />
              <SettingCard label="Break Duration"   name="break_duration"  value={settings.break_duration}  onChange={handleChange} suffix="HRS"  type="number" colorClass="bg-orange-500" subLabel="Lunch break duration" />
              <SettingCard label="Min. Work Hours"  name="min_work_hours"  value={settings.min_work_hours}  onChange={handleChange} suffix="HRS"  type="number" colorClass="bg-teal-500"   subLabel="Minimum hours for half day" />
            </div>

            {/* Row 3 — Half day & overtime thresholds */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <SettingCard label="Half Day Threshold"  name="half_day_threshold"  value={settings.half_day_threshold}  onChange={handleChange} type="time"   colorClass="bg-amber-500"  subLabel="Check-in for half day" />
              <SettingCard label="Overtime Starts"     name="overtime_threshold"  value={settings.overtime_threshold}  onChange={handleChange} type="time"   colorClass="bg-indigo-500" subLabel="Overtime begins after" />
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 px-5 py-4 bg-sky-50 border border-sky-100 rounded-2xl text-sky-700">
              <Clock size={16} className="mt-0.5 shrink-0 text-sky-500" />
              <p className="text-xs font-bold leading-relaxed">
                Employees must work at least <span className="font-black text-sky-600">{settings.min_work_hours}</span> hours to be eligible for half day.
                Full day requires <span className="font-black text-sky-600">{settings.max_work_hours}</span> hours or more of working time.
                Check-in at or after <span className="font-black text-sky-600">{settings.half_day_threshold}</span> is counted as a Half Day.
              </p>
            </div>
          </section>

          {/* Leave Section */}
          <section>
            <div className="flex items-center gap-3 mb-6 px-4">
              <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <h4 className="text-lg font-black text-[#1e293b] uppercase tracking-widest">Yearly Leave Quotas</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl">
              <SettingCard label="Casual Leave" name="casual_leave" value={settings.casual_leave} onChange={handleChange} suffix="DAYS" type="number" colorClass="bg-violet-500" />
              <SettingCard label="Sick Leave" name="sick_leave" value={settings.sick_leave} onChange={handleChange} suffix="DAYS" type="number" colorClass="bg-violet-500" />
              <SettingCard label="Sick Leave" name="sick_leave" value={settings.Holidays} onChange={handleChange} suffix="DAYS" type="number" colorClass="bg-violet-500" />
            </div>
          </section>

          {/* Geofencing Section */}
          <section>
            <div className="flex items-center justify-between mb-6 px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Navigation size={20} />
                </div>
                <h4 className="text-lg font-black text-[#1e293b] uppercase tracking-widest">Geofencing & Security</h4>
              </div>
              <button onClick={handleGetLocation} className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2">
                <MapPin size={12} /> Sync Office Coordinates
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <SettingCard label="Office Latitude" name="office_lat" value={settings.office_lat} onChange={handleChange} type="number" colorClass="bg-[#1e293b]" />
              <SettingCard label="Office Longitude" name="office_lng" value={settings.office_lng} onChange={handleChange} type="number" colorClass="bg-[#1e293b]" />
              <SettingCard label="Verification Radius" name="geofence_radius" value={settings.geofence_radius} onChange={handleChange} suffix="METERS" type="number" colorClass="bg-emerald-500" />
            </div>
          </section>
        </div>

        {/* Notifications & Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
          <PublishAnnouncement />
          <ActiveAnnouncements />
        </div>

        {/* Administrator Access Control */}
        <section className="pt-10">
          <div className="flex items-center gap-3 mb-8 px-4">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-xl font-black text-[#1e293b] uppercase tracking-widest">Administrator Access Control</h4>
              <p className="text-slate-400 text-xs font-bold mt-1">Manage users with full administrative privileges.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Add New Admin Form */}
            <div className="lg:col-span-1 bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900"></div>
               
               {success && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest rounded-xl border border-emerald-100">
                   <CheckCircle2 size={16} /> <span className="leading-tight">{success}</span>
                </div>
               )}
               {error && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-rose-50 text-rose-500 font-black text-xs uppercase tracking-widest rounded-xl border border-rose-100">
                   <ShieldCheck size={16} /> <span className="leading-tight">{error}</span>
                </div>
               )}

               <div className="flex items-center gap-4 mb-8">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${existingAdmin ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-900 border-slate-100'}`}>
                    {existingAdmin ? <CheckCircle2 size={24} /> : <UserPlus size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#1e293b]">{existingAdmin ? 'Existing Administrator Found' : 'Add New Admin'}</h3>
                    {existingAdmin && <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-1">Account Ready to Update</p>}
                  </div>
               </div>

               <form onSubmit={handleSubmitAdmin} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                       <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                       <input 
                         type="email" 
                         required
                         value={newAdmin.email}
                         onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                         placeholder="admin@company.com" 
                         className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-sm text-[#1e293b]" 
                       />
                       {emailCheckLoading && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative">
                       <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                       <input 
                         type="text" 
                         required
                         value={newAdmin.fullName}
                         onChange={(e) => setNewAdmin({...newAdmin, fullName: e.target.value})}
                         placeholder="Admin Name" 
                         className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-sm text-[#1e293b]" 
                       />
                    </div>
                  </div>

                  {existingAdmin && (
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 mb-4 animate-in slide-in-from-top-2">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Active Administrator</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Activity</span>
                          <span className="text-xs font-bold text-slate-600">{existingAdmin.lastLogin ? new Date(existingAdmin.lastLogin).toLocaleDateString() : 'Never'}</span>
                       </div>
                    </div>
                  )}

                  <div className="space-y-1.5 animate-in slide-in-from-top-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{existingAdmin ? 'New Temporary Password' : 'Temporary Password'}</label>
                    <div className="relative">
                       <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                       <input 
                         type="password" 
                         required
                         value={newAdmin.password}
                         onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                         placeholder="••••••••" 
                         className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-sm text-[#1e293b]" 
                       />
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={adminLoading}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
                  >
                    {adminLoading ? 'Processing...' : (existingAdmin ? 'UPDATE ADMIN ACCOUNT' : 'GRANT ADMIN ACCESS')}
                  </button>
               </form>
            </div>

            {/* Existing Admins List */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Active Administrators</h3>
                     <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400">{admins.length} ACCOUNTS</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {admins.map((admin) => (
                      <div key={admin._id} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-sm">
                            {admin.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <h4 className="font-black text-[#1e293b]">{admin.fullName}</h4>
                               {admin._id === currentUser.id && (
                                 <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-md uppercase tracking-widest border border-emerald-100">You</span>
                               )}
                            </div>
                            <p className="text-xs text-slate-400 font-bold">{admin.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="text-right mr-4 hidden sm:block">
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Last Activity</p>
                              <p className="text-[10px] font-bold text-slate-500">
                                {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                              </p>
                           </div>
                           {admin._id !== currentUser.id && (
                             <button 
                               onClick={() => handleDeleteAdmin(admin._id)}
                               className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                             >
                               <Trash2 size={18} />
                             </button>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
               
               <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Security Notice</p>
                    <p className="text-xs text-amber-700/70 font-medium leading-relaxed">
                      Administrators have full access to employee records, salaries, and system configurations. Only grant access to trusted team members.
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
