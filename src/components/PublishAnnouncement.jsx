import React, { useState, useEffect } from 'react';
import { Send, Megaphone, CheckCircle2, X, Users, Mail } from 'lucide-react';
import api from '../services/api';
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || 'https://citicon-hrms-backend-03wr.onrender.com/api').replace('/api', '');

const PublishAnnouncement = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Normal',
    validUntil: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('notificationSummary', (data) => {
      setSummary(data);
    });
    return () => socket.disconnect();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.validUntil) {
      showToast('Please fill all required fields.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/announcements', form);
      if (res.data.success) {
        showToast('Announcement published successfully.');
        setForm({ title: '', description: '', priority: 'Normal', validUntil: '' });
      }
    } catch (err) {
      console.error('Error publishing announcement:', err);
      showToast('Failed to publish announcement.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1e293b]"></div>
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`absolute top-4 right-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold shadow-xl animate-in slide-in-from-right-4 z-50 ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
          {toast.message}
        </div>
      )}

      {/* Summary Modal */}
      {summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setSummary(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 mx-auto border-4 border-emerald-100">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-black text-center text-[#1e293b] mb-1">{summary.title}</h3>
            <p className="text-xs text-center text-slate-400 font-bold mb-8">Notification dispatch completed</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500"><Users size={16} /></div>
                  Total Employees
                </div>
                <span className="font-black text-[#1e293b]">{summary.stats.total}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                <div className="flex items-center gap-3 text-emerald-700 font-bold text-sm">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-500"><Mail size={16} /></div>
                  Emails Sent
                </div>
                <span className="font-black text-emerald-700">{summary.stats.emailsSent}</span>
              </div>
              {summary.stats.failedEmails > 0 && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-1">Failed Deliveries</p>
                  <p className="text-sm font-bold text-rose-700">Emails: {summary.stats.failedEmails}</p>
                </div>
              )}
            </div>
            
            <button onClick={() => setSummary(null)} className="w-full mt-8 py-4 bg-[#1e293b] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20">
              Close Summary
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
          <Megaphone size={20} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-[#1e293b]">Publish Announcement</h3>
          <p className="text-xs text-slate-400 font-bold mt-1">Broadcast messages to all employees instantly.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Independence Day Holiday"
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1e293b]/10 focus:border-[#1e293b] transition-all placeholder:font-medium placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Priority *</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1e293b]/10 focus:border-[#1e293b] transition-all text-[#1e293b]"
            >
              <option value="Normal">Normal</option>
              <option value="Holiday">Holiday</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valid Until *</label>
            <input
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1e293b]/10 focus:border-[#1e293b] transition-all text-[#1e293b]"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Enter announcement details..."
            rows="4"
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1e293b]/10 focus:border-[#1e293b] transition-all resize-none placeholder:font-medium placeholder:text-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#1e293b] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Send size={16} /> Publish Announcement
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default PublishAnnouncement;
