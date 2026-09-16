import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  User, Mail, Phone, Briefcase, Calendar,
  Edit3, Save, X, CheckCircle2, Lock, Camera, Clock
} from 'lucide-react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import api from '../services/api';

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 py-4 border-b border-slate-50 last:border-0">
    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-[#1e293b] truncate">{value || '—'}</p>
    </div>
  </div>
);

const EmployeeProfile = () => {
  const { employeeSlug } = useParams();
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [changePassword, setChangePassword] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    newPassword: '',
    confirmPassword: ''
  });

  const employeeId = user.id || user.slug;

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/employee/profile/${employeeId}`);
      if (res.data.success) {
        setProfile(res.data.employee);
        setForm({
          fullName: res.data.employee.fullName || '',
          email: res.data.employee.email || '',
          phone: res.data.employee.phone || '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile. Please ensure you are logged in correctly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchProfile();
    } else {
      setLoading(false);
      setError('Your session has expired or is incomplete. Please log out and sign in again to view your profile.');
    }
  }, [employeeId]);


  const handleSave = async () => {
    setError('');
    if (changePassword && form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (changePassword && form.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
      };
      if (changePassword && form.newPassword) {
        payload.password = form.newPassword;
      }

      const res = await api.put(`/employee/profile/${employeeId}`, payload);
      if (res.data.success) {
        setProfile(res.data.employee);
        // Update localStorage name
        const stored = JSON.parse(localStorage.getItem('user')) || {};
        stored.name = form.fullName;
        localStorage.setItem('user', JSON.stringify(stored));
        setEditing(false);
        setChangePassword(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setSaving(true);
    try {
      const res = await api.post(`/employee/upload-avatar/${employeeId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setProfile(res.data.employee);
        setSuccess('Profile photo updated!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to upload photo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setChangePassword(false);
    setError('');
    if (profile) {
      setForm({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'E';

  return (
    <EmployeeLayout title="My Profile" subtitle="View and manage your personal information.">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1e293b] rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading profile...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT — Avatar + Identity Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Card */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1e293b]"></div>

              {/* Avatar */}
              <div className="relative group mb-6">
                <div className="w-28 h-28 rounded-full bg-[#1e293b] flex items-center justify-center text-white text-3xl font-black shadow-xl overflow-hidden relative group">
                  {profile?.profileImage ? (
                    <img src={profile.profileImage} alt={profile.fullName} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                  ) : (
                    <span>{initials}</span>
                  )}
                  
                  {/* Upload Overlay */}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    <Camera size={24} className="text-white" />
                  </label>
                </div>
                <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              </div>

              <h2 className="text-xl font-black text-[#1e293b] mb-1">{profile?.fullName}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{profile?.role || 'Team Member'}</p>
              <p className="text-xs font-bold text-slate-400">{profile?.department || '—'}</p>

              <div className="mt-5 w-full pt-5 border-t border-slate-50">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {profile?.status || 'Active'}
                </span>
              </div>

              <div className="mt-4 w-full">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee Code</p>
                <p className="text-lg font-black text-[#1e293b]">{profile?.empCode}</p>
              </div>
            </div>

            {/* Join Date Card */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Member Since</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1e293b] rounded-xl flex items-center justify-center">
                  <Calendar size={18} className="text-white" />
                </div>
                <p className="text-base font-black text-[#1e293b]">
                  {profile?.joinDate
                    ? new Date(profile.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>

            {/* Employment Journey */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">Employment Journey</p>
              
              <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 pb-2">
                {[...(profile?.employmentHistory || [])]
                  .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                  .map((hist, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow shadow-blue-500/50"></div>
                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                            {hist.employmentType}
                          </h4>
                          <p className="text-xs font-semibold text-blue-600 mt-0.5">{hist.empCode}</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-200 px-2.5 py-1 rounded-full">COMPLETED</span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 mt-3 text-xs">
                        <p><span className="text-slate-500">Designation:</span> <span className="font-medium text-slate-800">{hist.designation}</span></p>
                        <p><span className="text-slate-500">Department:</span> <span className="font-medium text-slate-800">{hist.department}</span></p>
                        <p className="col-span-2 text-blue-700 mt-1 font-bold">
                          {new Date(hist.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} → {hist.endDate ? new Date(hist.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="relative">
                  <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow shadow-blue-500/50"></div>
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                          ⭐ {profile?.employmentType || (profile?.empCode?.includes('OD-IN') ? 'Intern' : 'Regular')} (Current)
                        </h4>
                        <p className="text-xs font-semibold text-blue-600 mt-0.5">{profile?.empCode}</p>
                      </div>
                      <span className="text-[10px] font-bold text-green-700 uppercase bg-green-100 px-2.5 py-1 rounded-full">ACTIVE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 mt-3 text-xs">
                      <p><span className="text-slate-500">Designation:</span> <span className="font-medium text-slate-800">{profile?.role}</span></p>
                      <p><span className="text-slate-500">Department:</span> <span className="font-medium text-slate-800">{profile?.department}</span></p>
                      <p className="col-span-2 text-blue-700 mt-1 font-bold">
                        {profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'} → Present
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Details + Edit */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success/Error alerts */}
            {success && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-bold text-emerald-700">{success}</p>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <X size={20} className="text-rose-500 flex-shrink-0" />
                <p className="text-sm font-bold text-rose-600">{error}</p>
              </div>
            )}

            {/* Personal Information */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500"></div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-[#1e293b]">Personal Information</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Your contact and personal details.</p>
                </div>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1e293b] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <Edit3 size={14} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Save size={14} />
                      )}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              {!editing ? (
                <div>
                  <InfoRow icon={<User size={18} />} label="Full Name" value={profile?.fullName} />
                  <InfoRow icon={<Mail size={18} />} label="Email Address" value={profile?.email} />
                  <InfoRow icon={<Phone size={18} />} label="Phone Number" value={profile?.phone} />
                  <InfoRow icon={<Briefcase size={18} />} label="Department" value={profile?.department} />
                  <InfoRow icon={<User size={18} />} label="Role / Position" value={profile?.role} />
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Full Name', field: 'fullName', type: 'text', icon: <User size={16} /> },
                    { label: 'Email Address', field: 'email', type: 'email', icon: <Mail size={16} /> },
                    { label: 'Phone Number', field: 'phone', type: 'tel', icon: <Phone size={16} /> },
                  ].map(({ label, field, type, icon }) => (
                    <div key={field}>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
                        <input
                          type={type}
                          value={form[field]}
                          onChange={e => setForm({ ...form, [field]: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1e293b]/10 focus:border-[#1e293b] transition-all"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Read-only fields */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Department', value: profile?.department },
                      { label: 'Role', value: profile?.role },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
                        <input
                          type="text"
                          value={value || ''}
                          disabled
                          className="w-full px-4 py-3 bg-slate-100 border border-slate-100 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Change Password (only shown in edit mode) */}
            {editing && (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500"></div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black text-[#1e293b]">Change Password</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Leave blank to keep your current password.</p>
                  </div>
                  <button
                    onClick={() => setChangePassword(!changePassword)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      changePassword ? 'bg-violet-50 text-violet-600 border border-violet-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <Lock size={14} />
                    {changePassword ? 'Cancel' : 'Change Password'}
                  </button>
                </div>

                {changePassword && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {[
                      { label: 'New Password', field: 'newPassword' },
                      { label: 'Confirm New Password', field: 'confirmPassword' },
                    ].map(({ label, field }) => (
                      <div key={field}>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={form[field]}
                            onChange={e => setForm({ ...form, [field]: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Read-only Work Info */}
            {!editing && (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                <h3 className="text-xl font-black text-[#1e293b] mb-6">Work Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: 'Employee Code', value: profile?.empCode },
                    { label: 'Department', value: profile?.department },
                    { label: 'Role', value: profile?.role },
                    { label: 'Status', value: profile?.status },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                      <p className="text-sm font-black text-[#1e293b]">{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
};

export default EmployeeProfile;
