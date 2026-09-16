import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Download, CheckCircle2, User,
  Briefcase, Calendar, Clock, AlertCircle,
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || 'https://citicon-hrms-backend.onrender.com/api').replace('/api', '');

const TIME_SLOTS = [
  '09:30 - 10:30',
  '10:30 - 11:30',
  '11:30 - 12:30',
  '12:30 - 01:30',
  '01:30 - 02:30',
  '02:30 - 03:30',
  '03:00 - 04:00',
  '04:00 - 04:50',
  '05:00 - 06:30',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Build the 7 ISO date strings for a week that contains a given date
const getWeekDates = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day); // shift so Monday = 0
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt.toISOString().split('T')[0]; // YYYY-MM-DD
  });
};

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const parseMin = (str) => {
  if (!str) return 0;
  const h = str.match(/(\d+)h/);
  const m = str.match(/(\d+)m/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
};
const fmtMin = (min) => {
  if (min <= 0) return '0h 0m';
  return `${Math.floor(min / 60)}h ${Math.floor(min % 60)}m`;
};

const AdminWeeklyTimesheet = ({ employee, onBack, initialTimesheet }) => {
  const [loading, setLoading]         = useState(true);
  const [weekTimesheets, setWeekTimesheets] = useState([]); // one per submitted day
  const [weekDates, setWeekDates]     = useState([]);
  const [currentDate, setCurrentDate] = useState(
    initialTimesheet?.date || new Date().toISOString().split('T')[0]
  );

  // ── fetch all timesheets for this employee, then filter to current week ──
  const fetchWeekData = useCallback(async () => {
    if (!employee?._id) return;
    setLoading(true);
    try {
      const wDates = getWeekDates(currentDate);
      setWeekDates(wDates);
      const [year, month] = wDates[0].split('-');
      const res = await api.get(`/timesheets/${employee._id}?month=${parseInt(month)}&year=${year}`);
      if (res.data.success) {
        // Also grab timesheets from following month if week spans two months
        const [y2, m2] = wDates[6].split('-');
        let extra = [];
        if (m2 !== month) {
          const res2 = await api.get(`/timesheets/${employee._id}?month=${parseInt(m2)}&year=${y2}`);
          if (res2.data.success) extra = res2.data.timesheets;
        }
        const all = [...res.data.timesheets, ...extra];
        const weekOnly = all.filter(ts => wDates.includes(ts.date));
        setWeekTimesheets(weekOnly);
      }
    } catch (err) {
      console.error('Error fetching week timesheets:', err);
    } finally {
      setLoading(false);
    }
  }, [employee?._id, currentDate]);

  useEffect(() => {
    fetchWeekData();
  }, [fetchWeekData]);

  // ── Socket.IO — re-fetch if any timesheet for this employee updates ──
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('timesheetSubmitted', (data) => {
      if (String(data.employeeId) === String(employee?._id)) fetchWeekData();
    });
    socket.on('timesheetUpdated', (data) => {
      if (String(data.employeeId) === String(employee?._id)) fetchWeekData();
    });
    return () => socket.disconnect();
  }, [employee?._id, fetchWeekData]);

  // ── Navigate weeks ──
  const navigateWeek = (dir) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  // ── Build lookup: date -> timesheet ──
  const tsMap = {};
  weekTimesheets.forEach(ts => { tsMap[ts.date] = ts; });

  // ── Build task grid: slot -> { [YYYY-MM-DD]: task title, remarks } ──
  const buildSlotData = () => {
    const grid = {};
    TIME_SLOTS.forEach(slot => {
      grid[slot] = {};
      weekDates.forEach(date => {
        const ts = tsMap[date];
        if (!ts) { grid[slot][date] = ''; return; }
        const found = ts.hourlyTasks?.find(t => t.slotKey === slot);
        grid[slot][date] = found?.title || '';
      });
    });
    return grid;
  };
  const slotGrid = buildSlotData();

  // ── Compute weekly summary stats ──
  const totalMins = weekTimesheets.reduce((acc, ts) => acc + parseMin(ts.totalHours), 0);
  const totalOTMins = weekTimesheets.reduce((acc, ts) => acc + parseMin(ts.overtime), 0);
  const avgMins = weekTimesheets.length > 0 ? Math.round(totalMins / weekTimesheets.length) : 0;
  const daysSubmitted = `${weekTimesheets.length}/7`;

  // ── For the most-recent submission in this week (used in info bar) ──
  const latestTs = initialTimesheet || weekTimesheets[0];

  // ── Excel download — exports real data ──
  const handleDownloadExcel = () => {
    const rows = [];
    // Header info
    rows.push(`Employee,${employee?.fullName || ''} (${employee?.empCode || ''}),,,,,,`);
    rows.push(`Department,${employee?.department || ''},,,,,,`);
    rows.push(`Week,${fmt(weekDates[0])} to ${fmt(weekDates[6])},,,,,,`);
    rows.push('');
    // Grid header
    rows.push(['Time Slot', ...DAYS, 'Daily Remarks'].join(','));

    TIME_SLOTS.forEach(slot => {
      const cells = [slot];
      DAYS.forEach((_, i) => {
        const date = weekDates[i] || '';
        const val = slotGrid[slot]?.[date] || '-';
        cells.push(`"${val.replace(/"/g, '""')}"`);
      });
      // remarks for this slot (collect from all days' timesheets that have this slot)
      const remarks = weekDates.map((date) => {
        const ts = tsMap[date];
        return ts?.dailyRemarks || '';
      }).filter(Boolean)[0] || '-';
      cells.push(`"${remarks.replace(/"/g, '""')}"`);
      rows.push(cells.join(','));
    });

    rows.push('');
    rows.push(`Total Work Hours,${fmtMin(totalMins)},,,,,,`);
    rows.push(`Total Overtime,${fmtMin(totalOTMins)},,,,,,`);
    rows.push(`Average Per Day,${fmtMin(avgMins)},,,,,,`);
    rows.push(`Days Submitted,${daysSubmitted},,,,,,`);

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet_${employee?.fullName?.replace(/\s+/g, '_')}_${weekDates[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-black text-[#1e293b] tracking-tight">Hourly Report — Weekly Timesheet</h1>
          <p className="text-xs font-bold text-slate-400 mt-1">Live data from submitted employee timesheets</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Week Navigator */}
          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm">
            <button onClick={() => navigateWeek(-1)} className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest min-w-[180px] text-center">
              {weekDates.length > 0 ? `${fmt(weekDates[0])} — ${fmt(weekDates[6])}` : '—'}
            </span>
            <button onClick={() => navigateWeek(1)} className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft size={16} /> Back to List
          </button>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#3b82f6] text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200"
          >
            <Download size={16} /> Download Excel
          </button>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-white rounded-[24px] border border-slate-100 p-8 shadow-sm grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Employee</p>
          <p className="text-sm font-black text-slate-700">
            {employee?.fullName || '—'}{employee?.empCode ? ` (${employee.empCode})` : ''}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Department</p>
          <p className="text-sm font-black text-slate-700">{employee?.department || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Week Range</p>
          <p className="text-sm font-black text-slate-700">
            {weekDates.length > 0 ? `${fmt(weekDates[0])} – ${fmt(weekDates[6])}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
            latestTs?.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            latestTs?.status === 'Submitted'  ? 'bg-blue-50 text-blue-600 border-blue-100' :
            'bg-orange-50 text-orange-600 border-orange-100'
          }`}>
            {latestTs?.status || 'Pending'}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Submitted On</p>
          <p className="text-sm font-black text-slate-700">{fmtDateTime(latestTs?.submissionTime)}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Week Total</p>
          <p className="text-sm font-black text-slate-700">{fmtMin(totalMins)}</p>
        </div>
      </div>

      {/* Timesheet Grid */}
      {weekTimesheets.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 gap-4 opacity-40">
          <AlertCircle size={48} strokeWidth={1.5} />
          <p className="text-lg font-black text-slate-700">No Timesheet Data Available</p>
          <p className="text-xs font-bold text-slate-400">No timesheets have been submitted for this week.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap sticky left-0 bg-[#f8fafc] z-10">Time</th>
                  {weekDates.map((date, i) => {
                    const ts = tsMap[date];
                    return (
                      <th key={date} className="px-6 py-5 text-center min-w-[130px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{DAYS[i]}</p>
                        <p className={`text-[10px] font-bold mt-0.5 ${ts ? 'text-blue-500' : 'text-slate-300'}`}>{date}</p>
                      </th>
                    );
                  })}
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {TIME_SLOTS.map(slot => (
                  <tr key={slot} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-[11px] font-black text-slate-700 whitespace-nowrap bg-slate-50/30 sticky left-0 z-10">
                      {slot}
                    </td>
                    {weekDates.map((date) => {
                      const task = slotGrid[slot]?.[date] || '';
                      return (
                        <td key={date} className="px-6 py-4 text-center">
                          <p className={`text-[11px] font-bold leading-relaxed ${task ? 'text-slate-700' : 'text-slate-300'}`}>
                            {task || '—'}
                          </p>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-500 italic max-w-[180px]">
                      {/* show daily remarks of the first submitted day in this week that has them */}
                      {weekDates.map(d => tsMap[d]?.dailyRemarks).filter(Boolean)[0] || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Weekly Remarks */}
      {weekTimesheets.some(ts => ts.weeklyRemarks) && (
        <div className="bg-blue-50/60 border border-blue-100 rounded-[24px] p-6">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Weekly Remarks</p>
          <p className="text-sm font-medium text-slate-700 leading-relaxed">
            {weekTimesheets.find(ts => ts.weeklyRemarks)?.weeklyRemarks}
          </p>
        </div>
      )}

      {/* Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
          <h3 className="text-lg font-black text-[#1e293b] mb-8 tracking-tight">Weekly Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="bg-emerald-50/50 p-6 rounded-[24px] border border-emerald-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                <Briefcase size={22} />
              </div>
              <div>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Hours (Week)</p>
                <p className="text-xl font-black text-slate-800">{fmtMin(totalMins)}</p>
              </div>
            </div>
            <div className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100">
                <User size={22} />
              </div>
              <div>
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Average Per Day</p>
                <p className="text-xl font-black text-slate-800">{fmtMin(avgMins)}</p>
              </div>
            </div>
            <div className="bg-violet-50/50 p-6 rounded-[24px] border border-violet-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-violet-500 shadow-sm border border-violet-100">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-[9px] font-black text-violet-600 uppercase tracking-widest mb-1">Overtime</p>
                <p className="text-xl font-black text-slate-800">{fmtMin(totalOTMins)}</p>
              </div>
            </div>
            <div className="bg-orange-50/50 p-6 rounded-[24px] border border-orange-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-100">
                <Calendar size={22} />
              </div>
              <div>
                <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Days Submitted</p>
                <p className="text-xl font-black text-slate-800">{daysSubmitted}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
          <h3 className="text-lg font-black text-[#1e293b] mb-8 tracking-tight">Submission Info</h3>
          <div className="space-y-4">
            {weekTimesheets.length === 0 ? (
              <p className="text-sm text-slate-400 font-bold italic text-center py-8">No submissions this week.</p>
            ) : (
              weekTimesheets.map((ts) => (
                <div key={ts._id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm text-white text-xs font-black ${
                      ts.status === 'Completed' ? 'bg-emerald-500' :
                      ts.status === 'Submitted'  ? 'bg-blue-500' : 'bg-orange-400'
                    }`}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700">{fmt(ts.date)}</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {ts.loginTime || '—'} → {ts.logoutTime || '—'} · {ts.totalHours}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    ts.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                    ts.status === 'Submitted'  ? 'bg-blue-50 text-blue-600' :
                    'bg-orange-50 text-orange-600'
                  }`}>
                    {ts.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWeeklyTimesheet;
