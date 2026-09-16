import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, LogOut, ArrowLeft, XCircle } from 'lucide-react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import api from '../services/api';

const EmployeeCheckOut = () => {
  const { employeeSlug } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // status: idle | loading | success | failed
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [attendance, setAttendance] = useState(null);

  const handleCheckOut = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const checkOutRes = await api.post('/employee/attendance/check-out', {
        employeeId: user.id,
      });

      const data = checkOutRes.data;
      if (!data.success) {
        setStatus('failed');
        setMessage(data.message || 'Check-out failed. Please try again.');
        return;
      }

      setAttendance(data.attendance);
      setStatus('success');
      setMessage(data.message || 'Checked out successfully.');
      setTimeout(() => navigate(`/employee/${user.slug}/dashboard`), 2500);

    } catch (err) {
      setStatus('failed');
      setMessage(err.response?.data?.message || 'Could not process check-out. Please try again.');
    }
  };

  const slug = user.slug || employeeSlug;

  return (
    <EmployeeLayout title="Attendance Check-Out" subtitle="Mark your day as completed.">
      <div className="max-w-2xl mx-auto pb-20">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <button 
            onClick={() => navigate(`/employee/${slug}/dashboard`)}
            className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#1e293b] transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <div className="w-20 h-20 bg-[#1e293b] rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200">
            <LogOut size={32} className="text-white" />
          </div>
          <h2 className="text-4xl font-black text-[#1e293b] mb-2">Check-Out</h2>
          <p className="text-slate-400 text-sm font-medium">Record your check-out time and conclude your workday.</p>
        </div>

        <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden p-10 relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#1e293b]"></div>

          <div className="space-y-8">
            {/* User Profile Summary */}
            <div className="flex items-center gap-4 p-6 bg-slate-50/50 rounded-[32px] border border-slate-100">
               <div className="w-14 h-14 bg-[#1e293b] rounded-2xl flex items-center justify-center text-white font-black text-xl overflow-hidden border border-slate-200">
                 {user.profileImage ? (
                   <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                 ) : (
                   user.name?.[0] || 'U'
                 )}
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checking out as</p>
                 <h4 className="text-lg font-black text-[#1e293b]">{user.name}</h4>
               </div>
            </div>

            {/* Date/Time Display */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Today's Date</p>
                <p className="text-lg font-black text-[#1e293b]">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Time</p>
                <p className="text-lg font-black text-[#1e293b]">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            {/* ── Status Messages ─────────────────────────────────────── */}

            {/* Loading */}
            {status === 'loading' && (
              <div className="py-8 flex flex-col items-center gap-4 animate-pulse">
                <Loader2 size={40} className="text-[#1e293b] animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Processing Check-Out...</p>
              </div>
            )}

            {/* Check-Out success */}
            {status === 'success' && (
              <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 text-center animate-in zoom-in duration-300">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-black text-emerald-900 mb-1">Check-Out Successful</h3>
                <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest">{message}</p>
                {attendance?.workHours && (
                  <p className="text-emerald-700 font-bold mt-2">Work Hours: {attendance.workHours}</p>
                )}
              </div>
            )}

            {/* Check-Out failure */}
            {status === 'failed' && (
              <div className="p-8 bg-rose-50 rounded-[32px] border border-rose-100 text-center animate-in zoom-in duration-300">
                <XCircle size={48} className="text-rose-500 mx-auto mb-4" />
                <h3 className="text-xl font-black text-rose-900 mb-1">Check-Out Failed</h3>
                <p className="text-rose-600 text-xs font-bold uppercase tracking-widest">{message}</p>
              </div>
            )}


            {/* ── Action Buttons ─────────────────────────────────────────── */}

            {/* Main Check-Out Button */}
            {status !== 'success' && status !== 'loading' && (
              <button
                onClick={handleCheckOut}
                className="w-full py-6 bg-[#1e293b] text-white rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-300 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                <LogOut size={20} />
                Confirm Check-Out
              </button>
            )}

            {/* Return to Dashboard button for completed/terminal states */}
            {(status === 'success' || status === 'failed') && (
              <button
                onClick={() => navigate(`/employee/${slug}/dashboard`)}
                className="w-full py-5 border-2 border-slate-100 text-slate-400 rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all mt-4"
              >
                Return to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeCheckOut;
