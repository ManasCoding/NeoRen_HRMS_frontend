import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Clock, AlertCircle, X, CheckCircle2, Trash2, Loader2 } from 'lucide-react';
import api from '../services/api';
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || 'https://citicon-hrms-backend.onrender.com/api').replace('/api', '');

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Holiday': return 'bg-pink-50 text-pink-600 border-pink-100';
    case 'Urgent': return 'bg-rose-50 text-rose-600 border-rose-100';
    default: return 'bg-blue-50 text-blue-600 border-blue-100';
  }
};

const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'Holiday': return <Calendar size={14} />;
    case 'Urgent': return <AlertCircle size={14} />;
    default: return <Megaphone size={14} />;
  }
};

const ActiveAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'admin' || window.location.pathname.includes('/admin') || !user?.slug;

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/active');
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
      }
    } catch (err) {
      console.error('Error fetching active announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await api.delete(`/announcements/${id}`);
      if (res.data.success) {
        setAnnouncements(prev => prev.filter(a => a._id !== id));
        showToast('Announcement deleted everywhere successfully.');
      } else {
        showToast(res.data.message || 'Failed to delete announcement.', 'error');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      showToast(err.response?.data?.message || 'Failed to delete announcement.', 'error');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    const socket = io(SOCKET_URL);
    
    socket.on('announcementCreated', () => {
      fetchAnnouncements();
    });
    
    socket.on('announcementUpdated', () => {
      fetchAnnouncements();
    });
    
    socket.on('announcementDeleted', () => {
      fetchAnnouncements();
    });

    // Local interval to remove expired announcements automatically
    const interval = setInterval(() => {
      setAnnouncements(prev => prev.filter(a => new Date(a.validUntil) >= new Date()));
    }, 60000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1e293b] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200"></div>
        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <Megaphone size={32} />
        </div>
        <h3 className="text-[#1e293b] font-black text-lg mb-1">No Active Announcements</h3>
        <p className="text-slate-400 text-xs font-bold">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`absolute top-4 right-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold shadow-xl animate-in slide-in-from-right-4 z-50 ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
          <Megaphone size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-[#1e293b]">Active Announcements</h3>
          <p className="text-xs text-slate-400 font-bold">Important updates and holidays</p>
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {announcements.map(announcement => (
          <div key={announcement._id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all group relative">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-base font-black text-[#1e293b] pr-4 flex-1">{announcement.title}</h4>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-sm ${getPriorityColor(announcement.priority)}`}>
                  {getPriorityIcon(announcement.priority)}
                  {announcement.priority}
                </span>

                {isAdmin && (
                  <button
                    onClick={() => setConfirmDeleteId(confirmDeleteId === announcement._id ? null : announcement._id)}
                    disabled={deletingId === announcement._id}
                    title="Delete announcement everywhere"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                  >
                    {deletingId === announcement._id ? (
                      <Loader2 size={16} className="animate-spin text-rose-600" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Confirm Delete Banner */}
            {confirmDeleteId === announcement._id && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                <span className="text-xs font-bold text-rose-800">
                  Delete this announcement everywhere?
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(announcement._id)}
                    disabled={deletingId === announcement._id}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-rose-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {deletingId === announcement._id && <Loader2 size={12} className="animate-spin" />}
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={deletingId === announcement._id}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
              {announcement.description}
            </p>

            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>Published: {new Date(announcement.publishDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-500">
                <Calendar size={14} />
                <span>Valid until: {new Date(announcement.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveAnnouncements;

