import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeLayout from '../layouts/EmployeeLayout';
import api from '../services/api';
import {
  Calendar, CheckCircle, XCircle, Clock,
  AlertCircle, ChevronRight, ChevronLeft, LayoutDashboard,
  ClipboardList, UserCheck, Bell, ArrowRight, PieChart, Hourglass, Coffee
} from 'lucide-react';
import ActiveAnnouncements from '../components/ActiveAnnouncements';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { useAttendance } from '../context/AttendanceContext';
import { useAttendanceTimer } from '../hooks/useAttendanceTimer';
import { getEmployeeAttendanceStatus } from '../utils/attendanceUtils';

const StatCard = ({ label, value, subValue, colorClass, bgClass, textClass, icon }) => (
  <div className={`bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col items-center justify-center border-t-4 ${colorClass} hover:-translate-y-1 transition-transform duration-300`}>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${bgClass} ${textClass}`}>
      {icon}
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">{label}</p>
    <h3 className="text-3xl lg:text-2xl xl:text-xl 2xl:text-2xl font-black text-slate-800 mb-2 truncate max-w-full px-1">{value}</h3>
    <p className={`text-[9px] font-bold uppercase tracking-widest text-center ${textClass}`}>{subValue}</p>
  </div>
);

const EmployeeDashboard = () => {
  const { refreshKey } = useAttendance();
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || { name: 'Employee', slug: '' });
  const employeeId = user.id;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    presentDays: 0,
    absentDays: 0,
    halfDays: 0,
    leavesTaken: 0,
    availableLeaves: 12,
    pendingLeaves: 0,
    attendanceRate: 0,
    lateCount: 0,
  });
  const [todayStatus, setTodayStatus] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    view: 'monthly',
  });

  const timerState = useAttendanceTimer(todayStatus);

  const fetchDashboardData = useCallback(async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [todayRes, statsRes] = await Promise.all([
        api.get(`/employee/attendance/today/${employeeId}`),
        api.get(`/employee/stats/${employeeId}?month=${currentPeriod.month}&year=${currentPeriod.year}&period=${currentPeriod.view}`),
      ]);

      if (todayRes.data.success) setTodayStatus(todayRes.data.attendance);
      if (statsRes.data.success) setStats(statsRes.data.stats);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId, currentPeriod]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  const changePeriod = (dir) => {
    let newMonth = currentPeriod.month + dir;
    let newYear = currentPeriod.year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setCurrentPeriod({ ...currentPeriod, month: newMonth, year: newYear });
  };

  const monthName = new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleString('default', { month: 'long' });

  const getAttendanceSubValue = (rate) => {
    if (rate >= 90) return 'Excellent';
    if (rate >= 75) return 'Good';
    if (rate >= 50) return 'Average';
    return 'Needs Improvement';
  };
  const getAttendanceColor = (rate) => {
    if (rate >= 90) return { colorClass: 'border-green-400', bgClass: 'bg-green-50', textClass: 'text-green-500' };
    if (rate >= 75) return { colorClass: 'border-blue-400', bgClass: 'bg-blue-50', textClass: 'text-blue-500' };
    if (rate >= 50) return { colorClass: 'border-orange-400', bgClass: 'bg-orange-50', textClass: 'text-orange-500' };
    return { colorClass: 'border-red-400', bgClass: 'bg-red-50', textClass: 'text-red-500' };
  };

  const attendanceColors = getAttendanceColor(stats.attendanceRate || 0);

  return (
    <EmployeeLayout title="" subtitle="" hideHeader={true}>

      {/* Welcome Header */}
      <div className="flex items-start justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight mb-2">
            Welcome back, <span className="text-[#2563eb]">{user.name}</span>! 👋
          </h1>
          <p className="text-slate-500 text-[13px] font-medium">
            Here&apos;s your work summary for {currentPeriod.view === 'monthly' ? `${monthName} ${currentPeriod.year}` : currentPeriod.year}.
          </p>
        </div>
        <div className="relative cursor-pointer">
          <Bell className="text-slate-600" size={24} />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#2563eb] text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-[#f8fafc]">3</span>
        </div>
      </div>

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Top Row: Period Selector + Today's Status */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Period Selector Card */}
          <div className="bg-[#0B1426] rounded-2xl p-6 lg:p-8 flex-1 flex items-center justify-between relative overflow-hidden shadow-lg shadow-blue-900/10">
            <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle at 70% -20%, #2563eb 0%, transparent 60%)' }} />
            <div className="absolute bottom-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle at 10% 120%, #3b82f6 0%, transparent 50%)' }} />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">View Period</p>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => changePeriod(-1)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-2xl font-bold text-white min-w-[160px] text-center tracking-tight">
                  {currentPeriod.view === 'monthly' ? `${monthName} ${currentPeriod.year}` : currentPeriod.year}
                </h3>
                <button
                  onClick={() => changePeriod(1)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 relative z-10 bg-white/5 p-1.5 rounded-xl border border-white/10">
              {['monthly', 'yearly'].map((v) => (
                <button
                  key={v}
                  onClick={() => setCurrentPeriod({ ...currentPeriod, view: v })}
                  className={`px-5 py-2 rounded-lg text-[11px] font-bold capitalize transition-all ${
                    currentPeriod.view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Today's Status Card */}
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 lg:p-8 flex items-center justify-between min-w-[380px]">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today&apos;s Status</p>
              {todayStatus && todayStatus.checkIn ? (
                <>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-bold text-slate-800">
                      {todayStatus.checkInApprovalStatus === 'Pending'
                        ? 'Checked In — Approval Pending'
                        : todayStatus.checkOut 
                          ? `Checked Out at ${timerState.checkOutTimeFormatted}`
                          : `Checked In at ${timerState.checkInTimeFormatted}`}
                    </h4>
                  </div>

                  {todayStatus.checkInApprovalStatus === 'Pending' && (
                    <span className="inline-block text-[10px] font-black bg-rose-100 text-rose-700 px-3 py-1 rounded-full uppercase tracking-widest">
                      ABSENT · AWAITING ADMIN APPROVAL
                    </span>
                  )}

                  {todayStatus.checkInApprovalStatus !== 'Pending' && (
                    <div className="flex items-center gap-4 text-xs font-bold pt-1 text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Working Time</span>
                        <span className="text-sm font-black text-blue-600">
                          {timerState.workingFormatted} {timerState.isShiftCompleted ? '✓' : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Break</span>
                        <span className="text-sm font-black text-amber-600">45 Min</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Overtime</span>
                        <span className="text-sm font-black text-orange-500">{timerState.overtimeFormatted}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-1">
                    <span className={`inline-block text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      timerState.isOnLunchBreak ? 'bg-amber-100 text-amber-700' :
                      timerState.statusText === 'Shift Completed' ? 'bg-emerald-100 text-emerald-700' :
                      timerState.statusText === 'Overtime' ? 'bg-orange-100 text-orange-700' :
                      timerState.statusText === 'Working' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {timerState.isOnLunchBreak ? 'On Lunch Break (1:30 PM - 2:15 PM)' : timerState.statusText}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h4 className="text-xl font-bold text-slate-800">Not Checked In</h4>
                  <div className="flex items-center gap-4 text-xs font-bold pt-1 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Working Time</span>
                      <span className="text-sm font-black text-slate-400">00h 00m</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Break</span>
                      <span className="text-sm font-black text-slate-400">00 Min</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Overtime</span>
                      <span className="text-sm font-black text-slate-400">00h 00m</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="inline-block text-[10px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-full uppercase tracking-widest">
                      NOT CHECKED IN
                    </span>
                  </div>
                </>
              )}
            </div>
            {(!todayStatus || !todayStatus.checkIn) ? (
              <button
                onClick={() => navigate(`/employee/${user.slug}/check-in`)}
                className="px-6 py-3.5 bg-[#0B1426] text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-200 hover:scale-105 transition-all"
              >
                Check In
              </button>
            ) : todayStatus.checkInApprovalStatus === 'Pending' ? (
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center shrink-0 ml-4">
                <Hourglass size={24} strokeWidth={2.5} />
              </div>
            ) : todayStatus.checkInApprovalStatus === 'Rejected' ? (
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0 ml-4">
                <XCircle size={24} strokeWidth={2.5} />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center shrink-0 ml-4">
                <UserCheck size={24} strokeWidth={2.5} />
              </div>
            )}
          </div>

        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <StatCard
            label="Present Days"
            value={stats.presentDays ?? 0}
            subValue="Completed"
            colorClass="border-emerald-400"
            bgClass="bg-emerald-50"
            textClass="text-emerald-500"
            icon={<CheckCircle size={24} strokeWidth={2.5} />}
          />
          <StatCard
            label="Absent Days"
            value={stats.absentDays ?? 0}
            subValue="Total Missed"
            colorClass="border-rose-400"
            bgClass="bg-rose-50"
            textClass="text-rose-500"
            icon={<XCircle size={24} strokeWidth={2.5} />}
          />
          <StatCard
            label="Half Days"
            value={stats.halfDays ?? 0}
            subValue="Partial Shift"
            colorClass="border-teal-400"
            bgClass="bg-teal-50"
            textClass="text-teal-500"
            icon={<PieChart size={24} strokeWidth={2.5} />}
          />
          <StatCard
            label="Working Days"
            value={((stats.presentDays ?? 0) + (stats.absentDays ?? 0) + (stats.halfDays ?? 0)).toString()}
            subValue="Total Days"
            colorClass="border-sky-400"
            bgClass="bg-sky-50"
            textClass="text-sky-500"
            icon={<Calendar size={24} strokeWidth={2.5} />}
          />
          <StatCard
            label="Week Off"
            value={stats.weekOffs ?? 4}
            subValue="Scheduled Days"
            colorClass="border-indigo-400"
            bgClass="bg-indigo-50"
            textClass="text-indigo-500"
            icon={<Coffee size={24} strokeWidth={2.5} />}
          />
          <StatCard
            label="Leaves Taken"
            value={stats.leavesTaken ?? 0}
            subValue="Approved"
            colorClass="border-violet-400"
            bgClass="bg-violet-50"
            textClass="text-violet-500"
            icon={<ClipboardList size={24} strokeWidth={2.5} />}
          />
          <StatCard
            label="Holidays"
            value={stats.holidayCount ?? 0}
            subValue={
              stats.holidays && stats.holidays.length === 1 
                ? (stats.holidays[0].holidayName.length > 18 ? stats.holidays[0].holidayName.substring(0, 18) + '...' : stats.holidays[0].holidayName)
                : stats.holidays && stats.holidays.length > 1
                  ? "Multiple Holidays"
                  : "This Period"
            }
            colorClass="border-blue-400"
            bgClass="bg-blue-50"
            textClass="text-blue-500"
            icon={<Calendar size={24} strokeWidth={2.5} />}
          />
          <StatCard
            label="Late Arrivals"
            value={stats.lateCount ?? 0}
            subValue="Days Late"
            colorClass="border-red-400"
            bgClass="bg-red-50"
            textClass="text-red-500"
            icon={<Clock size={24} strokeWidth={2.5} />}
          />
        </div>

        {/* Announcements & Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActiveAnnouncements />
          <AttendanceCalendar employeeId={employeeId} />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

          {/* Attendance Logs */}
          <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex flex-col justify-between relative overflow-hidden h-[240px]">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 relative z-10">
              <LayoutDashboard size={24} strokeWidth={2.5} />
            </div>
            <div className="relative z-10">
              <h3 className="text-[22px] font-bold text-slate-800 mb-2">Attendance Logs</h3>
              <p className="text-slate-500 text-sm max-w-[200px] leading-relaxed mb-6">
                View your full attendance history and timings.
              </p>
              <button
                onClick={() => navigate(`/employee/${user.slug}/attendance`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                View Logs <ArrowRight size={14} />
              </button>
            </div>
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-20 transform translate-x-4 translate-y-4">
              <Calendar size={180} strokeWidth={1} className="text-blue-500" />
            </div>
          </div>

          {/* Work Schedule */}
          <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex flex-col justify-between relative overflow-hidden h-[240px]">
            <div className="w-12 h-12 bg-violet-50 text-violet-500 rounded-full flex items-center justify-center mb-4 relative z-10">
              <Clock size={24} strokeWidth={2.5} />
            </div>
            <div className="relative z-10">
              <h3 className="text-[22px] font-bold text-slate-800 mb-2">Work Schedule</h3>
              <p className="text-slate-500 text-sm max-w-[200px] leading-relaxed mb-6">
                Check your shift timings and assigned tasks.
              </p>
              <button
                onClick={() => navigate(`/employee/${user.slug}/schedule`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#6d28d9] text-white text-xs font-bold rounded-lg hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
              >
                View Schedule <ArrowRight size={14} />
              </button>
            </div>
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-20 transform translate-x-4 translate-y-4">
              <ClipboardList size={180} strokeWidth={1} className="text-violet-500" />
            </div>
          </div>

        </div>

      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
