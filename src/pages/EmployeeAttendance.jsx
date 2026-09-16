import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle2, Clock, AlertTriangle, XCircle, Calendar, Hourglass } from 'lucide-react';
import api from '../services/api';

import { getEmployeeAttendanceStatus } from '../utils/attendanceUtils';
import { useAttendance } from '../context/AttendanceContext';
import { useAttendanceTimer } from '../hooks/useAttendanceTimer';

const EmployeeAttendance = () => {
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || { name: 'Employee', slug: '', id: '' });
  const { refreshKey } = useAttendance();
  const navigate = useNavigate();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();

  // Hook for live timer states
  const timerState = useAttendanceTimer(todayAttendance);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [todayRes, logRes] = await Promise.all([
        api.get(`/employee/attendance/today/${user.id}`).catch(() => ({ data: { success: false } })),
        api.get(`/employee/attendance/log/${user.id}`).catch(() => ({ data: { success: false } })),
      ]);
      if (todayRes.data.success) setTodayAttendance(todayRes.data.attendance || null);
      if (logRes.data.success) {
        setAttendanceLog((logRes.data.records || []).slice(0, 10));
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAttendance();
    }
  }, [user?.id, refreshKey]);

  const fmtTime = (dt) =>
    dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--';

  const fmtDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDisplayStatus = (att) => {
    return getEmployeeAttendanceStatus(att);
  };

  const statusColor = (s) => {
    switch (s) {
      case 'NOT CHECKED IN': case 'Not Checked In': return 'bg-slate-100 text-slate-600';
      case 'Present': return 'bg-emerald-100 text-emerald-700';
      case 'Late': return 'bg-orange-100 text-orange-700';
      case 'Half Day': return 'bg-yellow-100 text-yellow-700';
      case 'Absent': return 'bg-rose-100 text-rose-700';
      case 'On Leave': case 'Paid Leave': case 'Unpaid Leave': return 'bg-purple-100 text-purple-700';
      case 'Holiday': return 'bg-blue-100 text-blue-700';
      case 'Weekend': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const slug = user.slug || user.id;
  const todayStatus = getDisplayStatus(todayAttendance);
  const approval = todayAttendance?.checkInApprovalStatus;
  const exType = todayAttendance?.exceptionType;
  const isCheckedIn = !!todayAttendance?.checkIn;
  const isCheckedOut = !!todayAttendance?.checkOut;

  return (
    <EmployeeLayout title="Attendance" subtitle="Check in and out for your shift.">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#1e293b]" />
          <div className="mb-8">
            <h2 className="text-3xl font-black text-[#1e293b] mb-1">Today's Attendance</h2>
            <p className="text-slate-400 font-bold text-sm">{fmtDate(today)}</p>
          </div>

          {loading ? (
            <div className="text-slate-400 font-bold text-sm py-4">Loading...</div>
          ) : (
            <>
              {/* Detailed Timer & Attendance Card */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 rounded-2xl p-6 mb-6">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Login Time</p>
                  <p className="text-base font-black text-[#1e293b]">
                    {isCheckedIn ? fmtTime(todayAttendance.checkIn) : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Logout Time</p>
                  <p className="text-base font-black text-[#1e293b]">
                    {isCheckedOut ? fmtTime(todayAttendance.checkOut) : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Break Time</p>
                  <p className="text-base font-black text-[#1e293b]">{isCheckedIn ? '45 Min' : '00 Min'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Working Time</p>
                  <p className="text-base font-black text-blue-600">
                    {isCheckedIn ? (
                      todayAttendance.checkInApprovalStatus === 'Pending' ? '00h 00m' : timerState.workingFormatted
                    ) : '00h 00m'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Overtime</p>
                  <p className="text-base font-black text-orange-500">
                    {isCheckedIn ? (
                      todayAttendance.checkInApprovalStatus === 'Pending' ? '00h 00m' : timerState.overtimeFormatted
                    ) : '00h 00m'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest ${statusColor(todayStatus)}`}>
                    {todayStatus}
                  </span>
                  
                  {isCheckedIn && todayAttendance.checkInApprovalStatus !== 'Pending' && (
                    <span className={`px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest ${
                      timerState.isOnLunchBreak ? 'bg-amber-100 text-amber-700' :
                      timerState.statusText === 'Shift Completed' ? 'bg-emerald-100 text-emerald-700' :
                      timerState.statusText === 'Overtime' ? 'bg-orange-100 text-orange-700' :
                      timerState.statusText === 'Working' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {timerState.isOnLunchBreak ? 'On Lunch Break' : timerState.statusText}
                    </span>
                  )}
                </div>

                {approval === 'Pending' && (
                  <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4">
                    <AlertTriangle size={20} className="text-rose-600 shrink-0" />
                    <div>
                      <p className="text-rose-800 font-black text-sm">
                        Absent — Awaiting Admin Approval
                      </p>
                      <p className="text-rose-600 text-xs font-bold mt-0.5">
                        Your check-in requires admin approval before it is recorded.
                      </p>
                    </div>
                  </div>
                )}

                {approval === 'Approved' && exType && exType !== 'None' && (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-emerald-800 font-black text-sm">Approved — {exType}</p>
                      <p className="text-emerald-600 text-xs font-bold mt-0.5">Your attendance exception has been approved by admin.</p>
                    </div>
                  </div>
                )}

                {approval === 'Rejected' && (
                  <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4">
                    <XCircle size={20} className="text-rose-600 shrink-0" />
                    <div>
                      <p className="text-rose-800 font-black text-sm">Attendance Request Rejected</p>
                      {todayAttendance?.rejectionReason && (
                        <p className="text-rose-600 text-xs font-bold mt-0.5">Reason: {todayAttendance.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate(`/employee/${slug}/check-in`)}
                  disabled={isCheckedIn}
                  className={`flex-1 py-5 rounded-[28px] font-black text-base uppercase tracking-widest transition-all ${
                    !isCheckedIn 
                      ? 'bg-[#1e293b] text-white hover:scale-[1.02] active:scale-95 shadow-2xl shadow-[#1e293b]/20 cursor-pointer' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  }`}>
                  Check In Now
                </button>
                <button 
                  onClick={() => navigate(`/employee/${slug}/check-out`)}
                  disabled={!isCheckedIn || isCheckedOut || approval === 'Rejected'}
                  className={`flex-1 py-5 rounded-[28px] font-black text-base uppercase tracking-widest transition-all ${
                    isCheckedIn && !isCheckedOut && approval !== 'Rejected'
                      ? 'bg-white text-[#1e293b] border-2 border-slate-100 hover:bg-slate-50 active:scale-95 shadow-md cursor-pointer' 
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-100 cursor-not-allowed shadow-none'
                  }`}>
                  Check Out Now
                </button>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
              <MapPin size={28} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-1">Office Location</p>
              <h4 className="text-lg font-black text-[#1e293b]">20.2961, 85.8331</h4>
              <p className="text-xs font-bold text-slate-400">Within 50m radius</p>
            </div>
          </div>
          <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mb-1">Today's Work Hours</p>
              <h4 className="text-lg font-black text-[#1e293b]">
                {todayAttendance?.checkIn ? (
                  todayAttendance.checkInApprovalStatus === 'Pending' ? '00h 00m' : timerState.workingFormatted
                ) : '00h 00m'}
              </h4>
              <p className="text-xs font-bold text-slate-400">Expected: 8h 15m</p>
            </div>
          </div>
        </div>

        {attendanceLog.length > 0 && (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-6 border-b border-slate-100">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1e293b]">Recent Attendance</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 10 records</p>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {attendanceLog.map((rec, idx) => {
                const ds = getDisplayStatus(rec);
                const recApproval = rec.checkInApprovalStatus;
                const recExType = rec.exceptionType;
                return (
                  <div key={idx} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="text-sm font-black text-[#1e293b]">{fmtDate(rec.date)}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {fmtTime(rec.checkIn)} to {fmtTime(rec.checkOut)}
                        {rec.workHours !== '0h 0m' && rec.workHours !== '00h 00m' ? (
                          <span className="ml-2 text-blue-500">({rec.workHours})</span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColor(ds)}`}>
                        {ds}
                      </span>
                      {recApproval === 'Pending' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                          Awaiting Approval
                        </span>
                      )}
                      {recApproval === 'Approved' && recExType && recExType !== 'None' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-widest">
                          Approved
                        </span>
                      )}
                      {recApproval === 'Rejected' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeAttendance;
