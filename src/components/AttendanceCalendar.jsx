import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useAttendance } from '../context/AttendanceContext';

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || 'https://citicon-hrms-backend.onrender.com/api').replace('/api', '');

import { getEmployeeAttendanceStatus } from '../utils/attendanceUtils';

const AttendanceCalendar = ({ employeeId }) => {
  const { refreshKey } = useAttendance();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [leaves, setLeaves] = useState([]);

  const fetchHolidays = async () => {
    try {
      const res = await api.get('/holidays');
      if (res.data.success) {
        setHolidays(res.data.holidays);
      }
    } catch (err) {
      console.error('Error fetching holidays:', err);
    }
  };

  const fetchAttendance = async () => {
    if (!employeeId) return;
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await api.get(`/employee/attendance/log/${employeeId}?month=${month}&year=${year}`);
      if (res.data.success) {
        setAttendanceData(res.data.records || res.data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching attendance log:', err);
    }
  };

  const fetchLeaves = async () => {
    if (!employeeId) return;
    try {
      const res = await api.get(`/employee/leaves/${employeeId}`);
      if (res.data.success) {
        setLeaves(res.data.leaves || []);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
    }
  };

  useEffect(() => {
    fetchHolidays();
    fetchAttendance();
    fetchLeaves();

    const socket = io(SOCKET_URL);
    socket.on('holidayUpdated', () => {
      fetchHolidays();
    });

    return () => {
      socket.disconnect();
    };
  }, [employeeId, refreshKey, currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const getDayStatus = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay();

    if (dateObj > new Date()) {
      return { status: 'Future', color: 'text-slate-400 bg-transparent', tooltip: '' };
    }

    // 1. Holiday (Blue)
    const holiday = holidays.find(h => h.holidayDate === dateStr);
    if (holiday) {
      return { status: 'Holiday', color: 'bg-[#EAF4FF] text-[#1E88E5] shadow-[#EAF4FF]', tooltip: `Holiday: ${holiday.holidayName}` };
    }

    // 2. Sunday (Weekend)
    if (dayOfWeek === 0) {
      return { status: 'Weekend', color: 'bg-[#F2F2F2] text-[#616161] shadow-[#F2F2F2]', tooltip: 'Weekend' };
    }

    // 3. Leave
    const leave = leaves.find(l => {
      if (l.status !== 'Approved') return false;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      return dateObj >= start && dateObj <= end;
    });
    if (leave) {
      const isUnpaid = leave.leaveType && (leave.leaveType.toLowerCase().includes('unpaid') || leave.leaveType.toLowerCase() === 'lwp');
      if (isUnpaid) {
        return { status: 'Unpaid Leave', color: 'bg-[#FFFBEB] text-[#D97706] shadow-[#FFFBEB]', tooltip: `Unpaid Leave: ${leave.leaveType}` };
      }
      return { status: 'Paid Leave', color: 'bg-[#F3E8FF] text-[#8E44AD] shadow-[#F3E8FF]', tooltip: `Paid Leave: ${leave.leaveType}` };
    }

    // Attendance Log Checks
    const log = attendanceData.find(a => {
      const logDateStr = new Date(a.date || a.createdAt).toISOString().split('T')[0];
      return logDateStr === dateStr;
    });

    if (log) {
      // The backend already applies applyDisplayStatus():
      //   Pending  → status = 'Absent'
      //   Approved → status = actual (Late / Half Day / Present)
      //   Rejected → status = 'Absent'
      const s = getEmployeeAttendanceStatus(log);
      if (s === 'Half Day') return { status: 'Half Day', color: 'bg-[#F0FDFA] text-[#0D9488] shadow-[#F0FDFA]', tooltip: 'Half Day' };
      if (s === 'Late')     return { status: 'Late',     color: 'bg-[#FFF3E0] text-[#FB8C00] shadow-[#FFF3E0]', tooltip: 'Late' };
      if (s === 'Present')  return { status: 'Present',  color: 'bg-[#E8F8F0] text-[#00A86B] shadow-[#E8F8F0]', tooltip: 'Present' };
      return { status: 'Absent', color: 'bg-[#FDECEC] text-[#E53935] shadow-[#FDECEC]', tooltip: 'Absent' };
    }

    // If past and no record, and not weekend/holiday -> Absent
    return { status: 'Absent', color: 'bg-[#FDECEC] text-[#E53935] shadow-[#FDECEC]', tooltip: 'Absent' };
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 p-8 relative overflow-hidden h-full">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1e293b]"></div>
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-50 text-[#1e293b] rounded-[16px] flex items-center justify-center shadow-sm">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#1e293b]">Attendance</h3>
            <p className="text-xs text-slate-400 font-bold">Your monthly attendance overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors shadow-sm"><ChevronLeft size={16} /></button>
          <span className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-[#1e293b] uppercase tracking-widest min-w-[120px] text-center shadow-sm">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors shadow-sm"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center mb-6">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <span key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{day}</span>
        ))}
        
        {/* Empty slots for first week */}
        {[...Array(firstDayOfMonth)].map((_, i) => (
          <div key={`empty-${i}`} className="w-10 h-10 mx-auto"></div>
        ))}
        
        {/* Days */}
        {[...Array(daysInMonth)].map((_, i) => {
          const day = i + 1;
          const { color, tooltip } = getDayStatus(day);
          return (
            <div key={day} className="flex flex-col items-center group relative cursor-pointer">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black shadow-md transition-all duration-300 transform group-hover:scale-110 group-hover:shadow-lg ${color}`}>
                {day}
              </div>
              {tooltip && (
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-max max-w-[150px] bg-[#1e293b] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl z-10 text-center">
                  {tooltip}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between w-full pt-8 border-t border-slate-100 gap-2">
        {[
          { label: 'Present', color: '#00A86B' },
          { label: 'Absent', color: '#E53935' },
          { label: 'Half Day', color: '#0D9488' },
          { label: 'Late', color: '#FB8C00' },
          { label: 'Paid Leave', color: '#8E44AD' },
          { label: 'Unpaid Leave', color: '#D97706' },
          { label: 'Holiday', color: '#1E88E5' },
          { label: 'Weekend', color: '#616161' }
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 flex-1 justify-center min-w-[70px] hover:scale-105 transition-transform cursor-pointer">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
            <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceCalendar;
