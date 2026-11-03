import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  Phone,
  Briefcase,
  User,
  MapPin,
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Plane,
  Download,
  ChevronLeft,
  BadgeCheck,
  Plus,
  MoreVertical,
  Edit3,
  Lock,
  X,
  Eye,
  Trash2,
  Search,
  Filter
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import AdminWeeklyTimesheet from '../components/AdminWeeklyTimesheet';
import InlineAttendanceStatusEditor from '../components/admin/InlineAttendanceStatusEditor';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useAttendance } from '../context/AttendanceContext';
import PayrollTab from '../components/employee/PayrollTab';
import PayslipsTab from '../components/employee/PayslipsTab';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || 'https://citicon-hrms-backend-03wr.onrender.com/api').replace('/api', '');

const AdminEmployeeDetails = () => {
  const { refreshKey } = useAttendance();
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const tabs = [
    'Overview',
    'Attendance',
    'Leaves',
    'Late Marks',
    'Document',
    'Timesheet',
    'Login History',
    'Messages',
    'Journey',
    'Payroll',
    'Payslips'
  ];
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDocModal, setShowDocModal] = useState(false);
  const [docUploadLoading, setDocUploadLoading] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', category: 'Identity Proof' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    role: '',
    password: '',
    status: '',
    // Bank Details
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    panNumber: '',
    aadharNumber: '',
    upiId: '',
    pfAccount: ''
  });
  
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [bankDetailsSaving, setBankDetailsSaving] = useState(false);

  // Global Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [editingCheckIn, setEditingCheckIn] = useState({ date: null, time: '' });
  const [editingCheckOut, setEditingCheckOut] = useState({ date: null, time: '' });
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [documents, setDocuments] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [showWeeklyDetail, setShowWeeklyDetail] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [employeeNotes, setEmployeeNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const fetchEmployeeDetails = async () => {
    try {
      // Try active employees first
      const res = await api.get(`/admin/employees`);
      let found = null;

      if (res.data.success) {
        found = res.data.employees.find(emp => emp._id === id);
      }

      // If not found in active, try ex-employees
      if (!found) {
        try {
          const exRes = await api.get('/admin/employees/ex');
          if (exRes.data.success) {
            found = exRes.data.employees.find(emp => emp._id === id);
          }
        } catch (exErr) {
          console.warn('Could not fetch ex-employees:', exErr.message);
        }
      }

        if (found) {
          setEmployee(found);
          setEditForm({
            fullName: found.fullName || '',
            email: found.email || '',
            phone: found.phone || '',
            department: found.department || '',
            role: found.role || '',
            password: '',
            status: found.status || 'Active',
            accountHolderName: found.accountHolderName || '',
            bankName: found.bankName || '',
            accountNumber: found.accountNumber || '',
            ifscCode: found.ifscCode || '',
            branchName: found.branchName || '',
            panNumber: found.panNumber || '',
            aadharNumber: found.aadharNumber || '',
            upiId: found.upiId || '',
            pfAccount: found.pfAccount || ''
          });
      } else {
        console.error('Profile fetch error: employee not found for id', id);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealStats = async () => {
    try {
      const m = currentMonth + 1;
      const [statsRes, logsRes, leavesRes, docsRes, activityRes, timesheetsRes, holidaysRes] = await Promise.all([
        api.get(`/employee/stats/${id}?month=${m}&year=${currentYear}`),
        api.get(`/employee/attendance/log/${id}?month=${m}&year=${currentYear}`),
        api.get('/admin/leaves'),
        api.get(`/admin/documents/${id}`),
        api.get(`/admin/activity-logs/${id}`),
        api.get(`/timesheets/${id}?month=${m}&year=${currentYear}`),
        api.get('/holidays')
      ]);

      if (statsRes.data.success) setAttendanceStats(statsRes.data.stats);
      if (logsRes.data.success) {
        const records = logsRes.data.records || [];
        const filledRecords = [];
        const now = new Date();
        const isCurrentMonth = now.getFullYear() === currentYear && now.getMonth() === currentMonth;
        const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

        for (let i = totalDays; i >= 1; i--) {
          const currentDate = new Date(currentYear, currentMonth, i, 12, 0, 0);
          const isFuture = isCurrentMonth && i > now.getDate();
          const existing = records.find(r => {
             const rDate = new Date(r.date);
             return rDate.getDate() === i && rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
          });

          if (existing) {
             let derivedStatus = existing.status || 'Present';
             filledRecords.push({ ...existing, status: derivedStatus });
          } else {
             const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
             const isHoliday = holidaysRes.data?.holidays?.find(h => h.holidayDate === dateStr);
             const isWeekend = currentDate.getDay() === 0;
             
             let finalStatus = isHoliday ? 'Holiday' : isWeekend ? 'Weekend' : isFuture ? 'Upcoming' : 'Absent';

             filledRecords.push({
               date: currentDate.toISOString(),
               status: finalStatus,
               checkIn: null,
               checkOut: null,
               workHours: isHoliday ? 'Holiday' : isWeekend ? 'Weekend' : isFuture ? '--' : '0h 0m',
               remarks: isHoliday ? (isHoliday.holidayName || 'Holiday') : isWeekend ? 'Sunday' : '—'
             });
          }
        }
        setAttendanceRecords(filledRecords);
      }
      if (leavesRes.data.success) {
        // Filter leaves for this employee
        const myLeaves = leavesRes.data.leaves.filter(l => l.employeeId?._id === id || l.employeeId === id);
        setLeaveRecords(myLeaves);
      }
      if (holidaysRes.data?.success) {
        setHolidays(holidaysRes.data.holidays || []);
      }
      if (docsRes.data.success) setDocuments(docsRes.data.documents);
      if (activityRes.data.success) setLoginLogs(activityRes.data.logs);
      if (timesheetsRes.data.success) setTimesheets(timesheetsRes.data.timesheets);
    } catch (err) {
      console.error('Error fetching real stats:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployeeDetails();
      fetchRealStats();
    }
    const socket = io(SOCKET_URL);
    socket.on('timesheetSubmitted', (data) => {
      if (data.employeeId === id) fetchRealStats();
    });
    socket.on('timesheetUpdated', (data) => {
      if (data.employeeId === id) fetchRealStats();
    });
    socket.on('holidayUpdated', () => fetchRealStats());
    socket.on('holidayAdded', () => fetchRealStats());
    socket.on('holidayDeleted', () => fetchRealStats());
    socket.on('attendanceMarked', () => fetchRealStats());
    socket.on('attendanceUpdated', () => fetchRealStats());
    socket.on('leaveStatusUpdated', () => fetchRealStats());
    socket.on('leaveUpdated', () => fetchRealStats());
    socket.on('leaveApproved', () => fetchRealStats());
    
    return () => socket.disconnect();
  }, [id, currentMonth, currentYear, refreshKey]);

  useEffect(() => {
    if (activeTab === 'Messages' && id && employeeNotes.length === 0 && !notesLoading) {
      setNotesLoading(true);
      api.get(`/admin/notes/${id}`)
        .then(res => { if (res.data.success) setEmployeeNotes(res.data.notes); })
        .catch(err => console.error(err))
        .finally(() => setNotesLoading(false));
    }
  }, [activeTab, id]);

  const handleUploadDoc = async () => {
    if (!selectedFile || !newDoc.title) return;
    setDocUploadLoading(true);
    try {
      // 1. Upload to Cloudinary first
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Use the dedicated admin document upload endpoint
      const uploadRes = await api.post('/admin/documents/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadRes.data.success) {
        const fileUrl = uploadRes.data.url;
        const fileType = selectedFile.type.split('/')[1] || 'pdf';
        const fileSize = (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB';

        const saveRes = await api.post('/admin/documents', {
          employeeId: id,
          title: newDoc.title,
          category: newDoc.category,
          fileUrl,
          fileType,
          fileSize
        });

        if (saveRes.data.success) {
          setDocuments([saveRes.data.document, ...documents]);
          setShowDocModal(false);
          setNewDoc({ title: '', category: 'Identity Proof' });
          setSelectedFile(null);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload document');
    } finally {
      setDocUploadLoading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      const res = await api.delete(`/admin/documents/${docId}`);
      if (res.data.success) {
        setDocuments(documents.filter(d => d._id !== docId));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit - reset form
      setEditForm({
        fullName: employee.fullName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        role: employee.role || '',
        password: employee.password || '',
        status: employee.status || 'Active',
        accountHolderName: employee.accountHolderName || '',
        bankName: employee.bankName || '',
        accountNumber: employee.accountNumber || '',
        ifscCode: employee.ifscCode || '',
        branchName: employee.branchName || '',
        panNumber: employee.panNumber || '',
        aadharNumber: employee.aadharNumber || '',
        upiId: employee.upiId || '',
        pfAccount: employee.pfAccount || ''
      });
    }
    setIsEditing(!isEditing);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.put(`/admin/employees/${id}`, editForm);
      if (res.data.success) {
        setSuccess('Employee details updated successfully');
        setEmployee(res.data.employee);
        setIsEditing(false);
        setShowBankDetailsModal(false);
        fetchEmployeeDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCheckIn = async (rawDate) => {
    try {
      const d = new Date(rawDate);
      const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const res = await api.put('/admin/attendance/checkin', {
        employeeId: employee._id,
        date: formattedDate,
        checkInTime: editingCheckIn.time
      });
      setEditingCheckIn({ date: null, time: '' });
      if (res.data.success && res.data.record) {
        const updatedRec = res.data.record;
        setAttendanceRecords(prev => prev.map(rec => {
          const dRec = new Date(rec.date);
          const recDateStr = `${dRec.getFullYear()}-${String(dRec.getMonth() + 1).padStart(2, '0')}-${String(dRec.getDate()).padStart(2, '0')}`;
          if (recDateStr === formattedDate) {
            return { ...rec, ...updatedRec, status: updatedRec.status, workHours: updatedRec.workHours };
          }
          return rec;
        }));
      }
      fetchRealStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update check-in');
    }
  };

  const handleSaveCheckOut = async (rawDate) => {
    try {
      const d = new Date(rawDate);
      const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const res = await api.put('/admin/attendance/checkout', {
        employeeId: employee._id,
        date: formattedDate,
        checkOutTime: editingCheckOut.time
      });
      setEditingCheckOut({ date: null, time: '' });
      if (res.data.success && res.data.record) {
        const updatedRec = res.data.record;
        setAttendanceRecords(prev => prev.map(rec => {
          const dRec = new Date(rec.date);
          const recDateStr = `${dRec.getFullYear()}-${String(dRec.getMonth() + 1).padStart(2, '0')}-${String(dRec.getDate()).padStart(2, '0')}`;
          if (recDateStr === formattedDate) {
            return { ...rec, ...updatedRec, status: updatedRec.status, workHours: updatedRec.workHours };
          }
          return rec;
        }));
      }
      fetchRealStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update check-out');
    }
  };

  const handleUpdateStatus = async (rawDate, newStatus) => {
    try {
      const d = new Date(rawDate);
      const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const res = await api.put('/admin/attendance/status', {
        employeeId: employee._id,
        date: formattedDate,
        status: newStatus
      });
      if (res.data.success && res.data.record) {
        const updatedRec = res.data.record;
        setAttendanceRecords(prev => prev.map(rec => {
          const dRec = new Date(rec.date);
          const recDateStr = `${dRec.getFullYear()}-${String(dRec.getMonth() + 1).padStart(2, '0')}-${String(dRec.getDate()).padStart(2, '0')}`;
          if (recDateStr === formattedDate) {
            return { ...rec, ...updatedRec, status: updatedRec.status, workHours: updatedRec.workHours };
          }
          return rec;
        }));
      }
      fetchRealStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getDisplayStats = () => {
    if (!attendanceStats) return {
      present: 0, absent: 0, halfDay: 0, leave: 0, workingDays: 0, rate: 0,
      leavesTotal: 0, leavesApproved: 0, leavesPending: 0, leavesRejected: 0, leavesBalance: 0
    };

    const present    = attendanceRecords && attendanceRecords.length > 0 ? attendanceRecords.filter(r => r.status === 'Present' || r.status === 'Late').length : (attendanceStats.presentDays ?? 0);
    const absent     = attendanceRecords && attendanceRecords.length > 0 ? attendanceRecords.filter(r => r.status === 'Absent').length : (attendanceStats.absentDays ?? 0);
    const halfDay    = attendanceRecords && attendanceRecords.length > 0 ? attendanceRecords.filter(r => r.status === 'Half Day').length : (attendanceStats.halfDays ?? 0);
    const leave      = attendanceStats.leavesTaken   ?? 0;
    const workingDays= present + absent + halfDay;
    // Rate: only full-day present counts; half-days are excluded
    const rate       = Math.round((present / (workingDays || 1)) * 100);

    const late       = attendanceRecords && attendanceRecords.length > 0 ? attendanceRecords.filter(r => r.status === 'Late').length : 0;
    const holidays   = attendanceRecords && attendanceRecords.length > 0 ? attendanceRecords.filter(r => r.status === 'Holiday').length : 0;
    const weekend    = attendanceRecords && attendanceRecords.length > 0 ? attendanceRecords.filter(r => r.status === 'Weekend').length : 0;
    const paidLeave  = attendanceStats.paidLeaves   ?? leave;
    const unpaidLeave= attendanceStats.unpaidLeaves ?? 0;

    return {
      present,
      absent,
      halfDay,
      leave,
      late,
      holidays,
      weekend,
      paidLeave,
      unpaidLeave,
      workingDays,
      rate,
      leavesTotal: attendanceStats.totalLeaveQuota    ?? 0,
      leavesTakenYearly: attendanceStats.leavesTakenYearly ?? 0,
      leavesPending: attendanceStats.pendingLeaves    ?? 0,
      leavesBalance: attendanceStats.availableLeaves  ?? 0
    };
  };

  const dynamicStats = getDisplayStats();
  
  const handleExportAttendance = () => {
    const monthName = monthNames[currentMonth];
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const wb = XLSX.utils.book_new();

    // Prepare rows
    const dataRows = [];

    // Header info rows
    dataRows.push(['NeoRen HRMS - WHOLE MONTH ATTENDANCE REPORT']);
    dataRows.push([`Employee Name: ${employee?.fullName || 'N/A'}`, `Employee ID: ${employee?.empCode || employee?._id || 'N/A'}`]);
    dataRows.push([`Department: ${employee?.department || 'N/A'}`, `Designation: ${employee?.role || 'N/A'}`]);
    dataRows.push([`Month & Year: ${monthName} ${currentYear}`, `Total Days in Month: ${totalDaysInMonth}`]);
    dataRows.push([
      `Working Days: ${dynamicStats.workingDays}`,
      `Present: ${dynamicStats.present}`,
      `Absent: ${dynamicStats.absent}`,
      `Half Day: ${dynamicStats.halfDay}`,
      `Late: ${dynamicStats.late}`,
      `Leave: ${dynamicStats.leave}`,
      `Attendance Rate: ${dynamicStats.rate}%`
    ]);
    dataRows.push([]); // Empty spacing row

    // Table Column Headers
    dataRows.push(['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Work Hours', 'Note']);

    const now = new Date();
    const isCurrentMonth = now.getFullYear() === currentYear && now.getMonth() === currentMonth;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const currentDate = new Date(currentYear, currentMonth, day, 12, 0, 0);
      const dateFormatted = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const dayFormatted = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStrIso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Look for existing record in attendanceRecords
      const existing = attendanceRecords && attendanceRecords.find(r => {
        const rDate = new Date(r.date);
        return rDate.getDate() === day && rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
      });

      const isHoliday = holidays && holidays.find(h => h.holidayDate === dateStrIso);
      const isWeekend = currentDate.getDay() === 0;
      const isFuture = isCurrentMonth && day > now.getDate();

      let status = 'Absent';
      let checkIn = '--:--';
      let checkOut = '--:--';
      let workHours = '0h 0m';
      let note = '—';

      if (existing && existing.checkIn) {
        status = existing.status || 'Present';
        checkIn = existing.checkIn ? new Date(existing.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
        checkOut = existing.checkOut ? new Date(existing.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
        workHours = existing.workHours || '--';
        note = existing.remarks || existing.note || existing.notes || '—';
      } else if (existing && existing.status) {
        status = existing.status;
        checkIn = existing.checkIn ? new Date(existing.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
        checkOut = existing.checkOut ? new Date(existing.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
        workHours = existing.workHours || (isHoliday ? 'Holiday' : isWeekend ? 'Weekend' : isFuture ? '--' : '0h 0m');
        note = existing.remarks || existing.note || existing.notes || (isHoliday ? (isHoliday.holidayName || 'Holiday') : isWeekend ? 'Sunday' : '—');
      } else if (isHoliday) {
        status = 'Holiday';
        workHours = 'Holiday';
        note = isHoliday.holidayName || 'Holiday';
      } else if (isWeekend) {
        status = 'Weekend';
        workHours = 'Weekend';
        note = 'Sunday';
      } else if (isFuture) {
        status = 'Upcoming';
        workHours = '--';
        note = '—';
      }

      dataRows.push([
        dateFormatted,
        dayFormatted,
        status,
        checkIn,
        checkOut,
        workHours,
        note
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(dataRows);

    // Set column widths
    ws['!cols'] = [
      { wch: 16 }, // Date
      { wch: 10 }, // Day
      { wch: 14 }, // Status
      { wch: 12 }, // Check In
      { wch: 12 }, // Check Out
      { wch: 14 }, // Work Hours
      { wch: 25 }  // Note
    ];

    XLSX.utils.book_append_sheet(wb, ws, `${monthName.slice(0, 3)} Attendance`);

    const safeName = (employee?.fullName || 'Employee').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeName}_Whole_Month_Attendance_${monthName}_${currentYear}.xlsx`;

    XLSX.writeFile(wb, fileName);
    toast.success(`Whole month attendance report for ${monthName} ${currentYear} downloaded!`);
  };

  if (loading) return (
    <AdminLayout title="Loading Profile...">
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </AdminLayout>
  );

  if (!employee) return (
    <AdminLayout title="Error">
      <div className="text-center py-20">
        <AlertCircle size={64} className="text-rose-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-800">Profile Not Found</h2>
        <button onClick={() => navigate('/admin/dashboard')} className="mt-6 px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">Return to Dashboard</button>
      </div>
    </AdminLayout>
  );

  function formatHHMM(dateVal) {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const getDynamicWorkHours = (row) => {
    if (row.workHours && row.workHours !== '0h 0m' && row.workHours !== '--') return row.workHours;
    if (!row.checkIn) return '0h 0m';
    if (row.checkOut) {
      const cIn = new Date(row.checkIn);
      const cOut = new Date(row.checkOut);
      let diffMs = cOut.getTime() - cIn.getTime();
      const outTimeStr = cOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      if (diffMs <= 0 && outTimeStr === '00:00') {
        diffMs += 24 * 60 * 60 * 1000;
      }
      if (diffMs <= 0) return '0h 0m';
      const mins = Math.floor(diffMs / (1000 * 60));
      return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
    }
    const checkInDate = new Date(row.checkIn);
    const now = new Date();
    if (checkInDate.toDateString() === now.toDateString()) {
      const mins = Math.floor((now - checkInDate) / (1000 * 60));
      if (mins < 0) return '0h 0m';
      return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m (In Progress)`;
    }
    return '0h 0m';
  };

  return (
    <AdminLayout title="Profile Deep-Dive" hideHeader={true}>
      {/* Navigation & Header */}
      <div className="mb-4 flex items-center justify-between">
        <button 
          onClick={() => navigate('/admin/employees')}
          className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all text-slate-500 hover:text-primary active:scale-95"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          <span className="text-[8px] font-black uppercase tracking-widest">Back</span>
        </button>
        <div className="flex items-center gap-3">
           {!isEditing ? (
             <button 
               onClick={handleEditToggle}
               className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
             >
               <Edit3 size={14} /> Edit Profile
             </button>
           ) : (
             <div className="flex items-center gap-2">
               <button 
                 onClick={handleEditToggle}
                 className="flex items-center gap-2 px-4 py-1.5 bg-white border border-border text-slate-500 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
               >
                 <X size={14} /> Cancel
               </button>
               <button 
                 onClick={handleSave}
                 disabled={saving}
                 className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100 disabled:opacity-50"
               >
                 {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={14} />}
                 {saving ? 'Saving...' : 'Save Changes'}
               </button>
             </div>
           )}
        </div>
      </div>

      {success && (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-3xl flex items-center gap-3">
            <CheckCircle2 size={20} />
            <p className="text-xs font-black uppercase tracking-widest">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-3xl flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-xs font-black uppercase tracking-widest">{error}</p>
          </div>
        </div>
      )}

      {/* Header Profile Section */}
      <div className="bg-white rounded-[40px] border border-border shadow-sm p-10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-sky-400"></div>
        <div className="flex flex-col xl:flex-row items-center gap-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full overflow-hidden border-8 border-slate-50 shadow-2xl transition-transform group-hover:scale-105 duration-500">
              {employee.profileImage ? (
                <img src={employee.profileImage} alt={employee.fullName} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-primary text-5xl font-black">
                  {employee.fullName[0]}
                </div>
              )}
            </div>
            <div className={`absolute -bottom-2 -right-2 w-10 h-10 ${employee.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'} border-4 border-white rounded-full flex items-center justify-center shadow-lg`}>
              {employee.status === 'Active' ? <CheckCircle2 size={18} className="text-white" /> : <XCircle size={18} className="text-white" />}
            </div>

          </div>

          <div className="flex-1 text-center xl:text-left">
            <div className="flex items-center justify-center xl:justify-start gap-3 mb-2">
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">{employee.fullName}</h1>
              <BadgeCheck className="text-sky-500 fill-sky-500/10" size={28} />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-4 mb-4">
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 min-w-[120px]">
                <User size={16} className="text-primary flex-shrink-0" />
                <div className="flex flex-col leading-tight">
                  {(employee.role || 'Software Engineer').split(' ').map((word, i) => (
                    <span key={i} className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{word}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 min-w-[120px]">
                <Briefcase size={16} className="text-sky-500 flex-shrink-0" />
                <div className="flex flex-col leading-tight">
                  {employee.department.split(' ').map((word, i) => (
                    <span key={i} className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{word}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block px-5 py-2 bg-slate-50 text-slate-600 rounded-full text-xs font-black uppercase tracking-widest border border-slate-100 shadow-sm">
                {employee.empCode}
              </span>
              {!isEditing ? (
                <span className={`inline-block px-5 py-2 ${employee.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'} rounded-full text-xs font-black uppercase tracking-widest border shadow-sm`}>
                  {employee.status}
                </span>
              ) : (
                <select 
                  value={editForm.status} 
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="px-5 py-2 bg-white text-slate-800 rounded-full text-xs font-black uppercase tracking-widest border border-primary/20 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/10"
                >
                  <option value="Active">Active</option>
                  <option value="Ex-Employee">Ex-Employee</option>
                </select>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 w-full xl:w-auto">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400 border border-slate-100"><Mail size={18} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                {!isEditing ? (
                  <p className="text-sm font-black text-slate-700">{employee.email}</p>
                ) : (
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:border-primary" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400 border border-slate-100"><Phone size={18} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                {!isEditing ? (
                  <p className="text-sm font-black text-slate-700">{employee.phone || '+91 98765 43210'}</p>
                ) : (
                  <input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:border-primary" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400 border border-slate-100"><Briefcase size={18} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                {!isEditing ? (
                  <p className="text-sm font-black text-slate-700">{employee.department}</p>
                ) : (
                  <select value={editForm.department} onChange={(e) => setEditForm({...editForm, department: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:border-primary">
                    <option>Engineering</option>
                    <option>Design</option>
                    <option>Human Resources</option>
                    <option>Marketing</option>
                    <option>Product</option>
                    <option>Finance</option>
                    <option>Analytics</option>
                    <option>Sales</option>
                    <option>Quality Assurance</option>
                    <option>IT Support</option>
                    <option>Management</option>
                  </select>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400 border border-slate-100"><BadgeCheck size={18} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation / Role</p>
                {!isEditing ? (
                  <p className="text-sm font-black text-slate-700">{employee.role}</p>
                ) : (
                  <input type="text" value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:border-primary" />
                )}
              </div>
            </div>
            {isEditing && (
              <div className="flex items-center gap-4 col-span-2 mt-2 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                <div className="w-10 h-10 bg-violet-50 text-violet-500 rounded-xl flex items-center justify-center shadow-sm border border-violet-100"><Lock size={18} /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Login Password</p>
                  <input type="text" value={editForm.password} onChange={(e) => setEditForm({...editForm, password: e.target.value})} className="w-full bg-white border border-violet-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all" placeholder="Update password" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex items-center gap-8 border-b border-slate-100 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full animate-in fade-in duration-300"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Overview' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="bg-white rounded-[40px] border border-border shadow-sm p-10">
              <h3 className="text-lg font-black text-slate-800 mb-8">Summary <span className="text-slate-400 font-bold">(This Month)</span></h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 rounded-3xl border border-emerald-50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md shadow-emerald-200"><CheckCircle2 size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Present</p>
                    <p className="text-lg font-black text-slate-800">{dynamicStats.present} <span className="text-xs text-slate-400">Days</span></p>
                  </div>
                </div>
                <div className="p-4 bg-rose-50/50 rounded-3xl border border-rose-50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md shadow-rose-200"><XCircle size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Absent</p>
                    <p className="text-lg font-black text-slate-800">{dynamicStats.absent} <span className="text-xs text-slate-400">Days</span></p>
                  </div>
                </div>
                <div className="p-4 bg-violet-50/50 rounded-3xl border border-violet-50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-violet-500 text-white rounded-full flex items-center justify-center shadow-md shadow-violet-200"><Calendar size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">On Leave</p>
                    <p className="text-lg font-black text-slate-800">{dynamicStats.leave} <span className="text-xs text-slate-400">Day</span></p>
                  </div>
                </div>
                <div className="p-4 bg-teal-50/50 rounded-3xl border border-teal-50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center shadow-md shadow-teal-200"><Clock size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Half Day</p>
                    <p className="text-lg font-black text-slate-800">{dynamicStats.halfDay} <span className="text-xs text-slate-400">Day</span></p>
                  </div>
                </div>
                <div className="p-4 bg-orange-50/50 rounded-3xl border border-orange-50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-md shadow-orange-200"><AlertCircle size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Late</p>
                    <p className="text-lg font-black text-slate-800">{dynamicStats.late} <span className="text-xs text-slate-400">Day</span></p>
                  </div>
                </div>
                <div className="p-4 bg-indigo-50/50 rounded-3xl border border-indigo-50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-md shadow-indigo-200"><Calendar size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Holiday</p>
                    <p className="text-lg font-black text-slate-800">{dynamicStats.holidays} <span className="text-xs text-slate-400">Day</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[40px] border border-border shadow-sm p-10 flex flex-col">
              <h3 className="text-lg font-black text-slate-800 mb-6">Monthly Attendance Overview</h3>
              <div className="flex-1 flex items-center gap-6">
                {(() => {
                  const total = (dynamicStats.present + dynamicStats.absent + dynamicStats.halfDay + dynamicStats.leave + dynamicStats.late + dynamicStats.holidays + dynamicStats.weekend + dynamicStats.unpaidLeave) || 1;
                  const chartData = [
                    { name: 'Present',      value: dynamicStats.present,     color: '#10b981', pct: Math.round((dynamicStats.present      / total) * 100) },
                    { name: 'Absent',       value: dynamicStats.absent,      color: '#ef4444', pct: Math.round((dynamicStats.absent       / total) * 100) },
                    { name: 'Half Day',     value: dynamicStats.halfDay,     color: '#14b8a6', pct: Math.round((dynamicStats.halfDay      / total) * 100) },
                    { name: 'Late',         value: dynamicStats.late,        color: '#f97316', pct: Math.round((dynamicStats.late         / total) * 100) },
                    { name: 'Paid Leave',   value: dynamicStats.paidLeave,   color: '#8b5cf6', pct: Math.round((dynamicStats.paidLeave   / total) * 100) },
                    { name: 'Unpaid Leave', value: dynamicStats.unpaidLeave, color: '#d97706', pct: Math.round((dynamicStats.unpaidLeave / total) * 100) },
                    { name: 'Holiday',      value: dynamicStats.holidays,    color: '#3b82f6', pct: Math.round((dynamicStats.holidays    / total) * 100) },
                    { name: 'Weekend',      value: dynamicStats.weekend,     color: '#94a3b8', pct: Math.round((dynamicStats.weekend     / total) * 100) },
                  ].filter(d => d.value > 0);
                  const allZero = chartData.length === 0;
                  const displayData = allZero ? [{ name: 'No Data', value: 1, color: '#e2e8f0', pct: 100 }] : chartData;
                  return (
                    <>
                      <div className="w-1/2 h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={displayData}
                              innerRadius={50}
                              outerRadius={72}
                              paddingAngle={allZero ? 0 : 4}
                              dataKey="value"
                            >
                              {displayData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-1/2 space-y-2.5">
                        {(allZero ? [] : chartData).map((item) => (
                          <div key={item.name} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{item.name}</span>
                            </div>
                            <span className="text-xs font-black text-slate-800">{item.pct}%</span>
                          </div>
                        ))}
                        {allZero && <p className="text-xs text-slate-400 font-medium">No data this month</p>}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-[32px] border border-border shadow-sm p-8 flex items-center justify-between group hover:border-primary transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary transition-transform group-hover:scale-110"><Calendar size={24} /></div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">This Month Working Days</p>
                    <p className="text-xl font-black text-slate-800">{dynamicStats.workingDays} Days</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{monthNames[currentMonth].slice(0,3)} {currentYear}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-200 group-hover:text-primary transition-colors" />
              </div>

              <div className={`bg-white rounded-[32px] border border-border shadow-sm p-8 flex items-center justify-between group transition-all ${dynamicStats.rate >= 90 ? 'hover:border-emerald-500' : dynamicStats.rate >= 75 ? 'hover:border-blue-500' : dynamicStats.rate >= 50 ? 'hover:border-orange-500' : 'hover:border-rose-500'}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg ${dynamicStats.rate >= 90 ? 'bg-emerald-100 text-emerald-600 shadow-emerald-50' : dynamicStats.rate >= 75 ? 'bg-blue-100 text-blue-600 shadow-blue-50' : dynamicStats.rate >= 50 ? 'bg-orange-100 text-orange-600 shadow-orange-50' : 'bg-rose-100 text-rose-600 shadow-rose-50'}`}><TrendingUp size={28} /></div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Attendance Rate</p>
                    <p className={`text-2xl font-black ${dynamicStats.rate >= 90 ? 'text-emerald-600' : dynamicStats.rate >= 75 ? 'text-blue-600' : dynamicStats.rate >= 50 ? 'text-orange-600' : 'text-rose-600'}`}>{dynamicStats.rate}%</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`w-2 h-2 rounded-full animate-pulse ${dynamicStats.rate >= 90 ? 'bg-emerald-500' : dynamicStats.rate >= 75 ? 'bg-blue-500' : dynamicStats.rate >= 50 ? 'bg-orange-500' : 'bg-rose-500'}`}></span>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${dynamicStats.rate >= 90 ? 'text-emerald-500 bg-emerald-50' : dynamicStats.rate >= 75 ? 'text-blue-500 bg-blue-50' : dynamicStats.rate >= 50 ? 'text-orange-500 bg-orange-50' : 'text-rose-500 bg-rose-50'}`}>
                        Performance: {dynamicStats.rate >= 90 ? 'EXCELLENT' : dynamicStats.rate >= 75 ? 'GOOD' : dynamicStats.rate >= 50 ? 'AVERAGE' : 'NEEDS IMPROVEMENT'}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`text-slate-200 group-hover:transition-colors ${dynamicStats.rate >= 90 ? 'group-hover:text-emerald-500' : dynamicStats.rate >= 75 ? 'group-hover:text-blue-500' : dynamicStats.rate >= 50 ? 'group-hover:text-orange-500' : 'group-hover:text-rose-500'}`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Attendance' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm group hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Calendar size={22} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Present</p>
                  <p className="text-xl font-black text-slate-800">{dynamicStats.present} Days</p>
                  <p className="text-[10px] font-bold text-emerald-500">{dynamicStats.rate}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm group hover:border-rose-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Calendar size={22} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absent</p>
                  <p className="text-xl font-black text-slate-800">{dynamicStats.absent} Days</p>
                  <p className="text-[10px] font-bold text-rose-500">{Math.round((dynamicStats.absent / (dynamicStats.workingDays || 1)) * 100)}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm group hover:border-teal-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 text-teal-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Clock size={22} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Half Day</p>
                  <p className="text-xl font-black text-slate-800">{dynamicStats.halfDay} Days</p>
                  <p className="text-[10px] font-bold text-teal-500">{Math.round((dynamicStats.halfDay / (dynamicStats.workingDays || 1)) * 100)}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm group hover:border-orange-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><AlertCircle size={22} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Late</p>
                  <p className="text-xl font-black text-slate-800">{dynamicStats.late} Days</p>
                  <p className="text-[10px] font-bold text-orange-500">{Math.round((dynamicStats.late / (dynamicStats.workingDays || 1)) * 100)}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm group hover:border-violet-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-50 text-violet-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Plane size={22} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">On Leave</p>
                  <p className="text-xl font-black text-slate-800">{dynamicStats.leave} Days</p>
                  <p className="text-[10px] font-bold text-violet-500">{Math.round((dynamicStats.leave / (dynamicStats.workingDays || 1)) * 100)}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm group hover:border-primary/20 transition-all bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Briefcase size={22} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Working Days</p>
                  <p className="text-xl font-black text-slate-800">{dynamicStats.workingDays} Days</p>
                  <p className="text-[10px] font-bold text-slate-400">{monthNames[currentMonth].slice(0,3)} {currentYear}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-4 bg-white rounded-[40px] border border-border shadow-sm p-10">
              <div className="flex items-center justify-between mb-10">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronLeft size={20} /></button>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">{monthNames[currentMonth]} {currentYear}</h3>
                <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={20} /></button>
              </div>
              <div className="grid grid-cols-7 gap-y-6 text-center mb-10">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <span key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
                ))}
                {(() => {
                  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                  const paddingDays = Array(firstDayOfMonth).fill(null);
                  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                  
                  return (
                    <>
                      {paddingDays.map((_, i) => <div key={`pad-${i}`}></div>)}
                      {monthDays.map((day) => {
                        const currentDate = new Date(currentYear, currentMonth, day, 12, 0, 0);
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const holidayItem = holidays && holidays.find(h => h.holidayDate === dateStr);
                        const isWeekend = currentDate.getDay() === 0;

                        const record = attendanceRecords && attendanceRecords.find(r => {
                          const rDate = new Date(r.date);
                          return rDate.getDate() === day && rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
                        });
                        
                        let status = record?.status;
                        if (!status || status === 'Upcoming') {
                          if (holidayItem) status = 'Holiday';
                          else if (isWeekend) status = 'Weekend';
                        } else if (status === 'Absent' && holidayItem) {
                          status = 'Holiday';
                        }
                        
                        let colorClass = 'text-slate-300 font-medium';
                        let titleText = `${day} ${monthNames[currentMonth]} ${currentYear}`;

                        if (status === 'Present') {
                          colorClass = 'bg-emerald-50 text-emerald-600 font-black hover:scale-105';
                          titleText += ' • Present';
                        } else if (status === 'Late') {
                          colorClass = 'bg-orange-50 text-orange-600 font-black hover:scale-105';
                          titleText += ' • Late';
                        } else if (status === 'Leave' || status === 'On Leave' || status === 'Paid Leave' || status === 'Unpaid Leave') {
                          colorClass = 'bg-violet-50 text-violet-600 font-black hover:scale-105';
                          titleText += ' • On Leave';
                        } else if (status === 'Absent') {
                          colorClass = 'bg-rose-50 text-rose-600 font-black hover:scale-105';
                          titleText += ' • Absent';
                        } else if (status === 'Half Day') {
                          colorClass = 'bg-sky-50 text-sky-600 font-black hover:scale-105';
                          titleText += ' • Half Day';
                        } else if (status === 'Holiday') {
                          colorClass = 'bg-indigo-50 text-indigo-600 font-black border border-indigo-200/80 shadow-sm hover:scale-105';
                          titleText += ` • Holiday (${holidayItem?.holidayName || 'Holiday'})`;
                        } else if (status === 'Weekend') {
                          colorClass = 'bg-slate-50 text-slate-400 font-bold';
                          titleText += ' • Sunday / Weekend';
                        }

                        return (
                          <div key={day} className="flex flex-col items-center group relative cursor-pointer" title={titleText}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all ${colorClass}`}>
                              {day}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 pt-8 border-t border-slate-50">
                {[
                  { label: 'Present', color: 'bg-emerald-500' },
                  { label: 'Absent', color: 'bg-rose-500' },
                  { label: 'Late', color: 'bg-orange-500' },
                  { label: 'Leave', color: 'bg-violet-500' },
                  { label: 'Half Day', color: 'bg-sky-500' },
                  { label: 'Holiday', color: 'bg-indigo-500' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div> {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="xl:col-span-8 bg-white rounded-[40px] border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800">Attendance Records <span className="text-slate-400 font-bold">({monthNames[currentMonth]})</span></h3>
                <button 
                  onClick={handleExportAttendance}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-800 border border-slate-100 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Download size={16} /> Export
                </button>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      {['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Work Hours', 'Note'].map(head => (
                        <th key={head} className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{head}</th>
                      ))}
                    </tr>
                  </thead>
                   <tbody className="divide-y divide-slate-50">
                    {attendanceRecords.length > 0 ? (
                      attendanceRecords.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40 transition-colors group">
                          <td className="px-10 py-1.5 text-[11px] font-black text-slate-700 whitespace-nowrap leading-none">
                            {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-10 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date(row.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </td>
                          <td className="px-10 py-1.5">
                            <InlineAttendanceStatusEditor 
                              record={row}
                              employeeId={employee._id}
                              onUpdateSuccess={fetchRealStats}
                            />
                          </td>
                          <td className="px-10 py-1.5 text-[11px] font-black text-slate-700">
                            {editingCheckIn.date === row.date ? (
                              <div className="flex items-center gap-2">
                                <input 
                                  type="time" 
                                  value={editingCheckIn.time}
                                  onChange={(e) => setEditingCheckIn({ ...editingCheckIn, time: e.target.value })}
                                  className="border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-primary"
                                  autoFocus
                                />
                                <button onClick={() => handleSaveCheckIn(row.date)} className="text-emerald-500 hover:text-emerald-600 bg-emerald-50 p-1 rounded-md"><CheckCircle2 size={14}/></button>
                                <button onClick={() => setEditingCheckIn({ date: null, time: '' })} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1 rounded-md"><X size={14}/></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                  <button 
                                    onClick={() => setEditingCheckIn({ 
                                      date: row.date, 
                                      time: row.checkIn ? formatHHMM(row.checkIn) : '09:00' 
                                    })}
                                    className="text-slate-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Edit Check-In Time"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                              </div>
                            )}
                          </td>
                          <td className="px-10 py-1.5 text-[11px] font-black text-slate-700">
                            {editingCheckOut.date === row.date ? (
                              <div className="flex items-center gap-2">
                                <input 
                                  type="time" 
                                  value={editingCheckOut.time}
                                  onChange={(e) => setEditingCheckOut({ ...editingCheckOut, time: e.target.value })}
                                  className="border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-primary"
                                  autoFocus
                                />
                                <button onClick={() => handleSaveCheckOut(row.date)} className="text-emerald-500 hover:text-emerald-600 bg-emerald-50 p-1 rounded-md"><CheckCircle2 size={14}/></button>
                                <button onClick={() => setEditingCheckOut({ date: null, time: '' })} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1 rounded-md"><X size={14}/></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                  <button 
                                    onClick={() => setEditingCheckOut({ 
                                      date: row.date, 
                                      time: row.checkOut ? formatHHMM(row.checkOut) : '18:00' 
                                    })}
                                    className="text-slate-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Edit Check-Out Time"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                              </div>
                            )}
                          </td>
                          <td className="px-10 py-1.5 text-[11px] font-black text-primary">{getDynamicWorkHours(row)}</td>
                          <td className="px-10 py-1.5 text-[9px] font-bold text-slate-400 tracking-tight">{row.remarks || row.note || row.notes || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-10 py-10 text-center text-slate-400 text-xs font-bold italic">No attendance records for this month.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Leaves' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* High-Fidelity Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm group hover:border-violet-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-50 text-violet-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Calendar size={22} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Leaves</p>
                  <p className="text-xl font-black text-slate-800">{dynamicStats.leavesTotal} Days</p>
                  <p className="text-[10px] font-bold text-slate-300">Taken this year</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm group hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><CheckCircle2 size={22} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yearly Taken</p>
                  <p className="text-xl font-black text-slate-800">{dynamicStats.leavesTakenYearly} Days</p>
                  <p className="text-[10px] font-bold text-emerald-500">{Math.round((dynamicStats.leavesTakenYearly / (dynamicStats.leavesTotal || 1)) * 100)}% Used</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm group hover:border-orange-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Clock size={22} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                  <p className="text-xl font-black text-slate-800">{dynamicStats.leavesPending} Requests</p>
                  <p className="text-[10px] font-bold text-orange-500">Awaiting Approval</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm group hover:border-rose-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><XCircle size={22} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leave Rate</p>
                  <p className="text-xl font-black text-slate-800">{dynamicStats.leave} Days</p>
                  <p className="text-[10px] font-bold text-rose-500">This month</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm group hover:border-primary/20 transition-all bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Calendar size={22} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Leaves</p>
                  <p className="text-xl font-black text-slate-800">{dynamicStats.leavesBalance} Days</p>
                  <p className="text-[10px] font-bold text-slate-400">Available</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Leave Records Section */}
            <div className="xl:col-span-8 bg-white rounded-[40px] border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Leave Records</h3>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      {['Leave Type', 'From Date', 'To Date', 'Duration', 'Reason', 'Status', 'Applied On', 'Action'].map(head => (
                        <th key={head} className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leaveRecords.length > 0 ? (
                      leaveRecords.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40 transition-colors group">
                          <td className="px-6 py-1.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-7.5 h-7.5 ${row.type === 'Sick' || row.leaveType === 'Sick' ? 'bg-orange-400' : 'bg-violet-500'} rounded-lg flex items-center justify-center shadow-sm`}>
                                {row.type === 'Sick' || row.leaveType === 'Sick' ? <Briefcase size={13} className="text-white" /> : <Calendar size={13} className="text-white" />}
                              </div>
                              <span className="text-[11px] font-black text-slate-700">{row.leaveType || row.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-1.5 text-[10px] font-black text-slate-600">{new Date(row.fromDate).toLocaleDateString()}</td>
                          <td className="px-6 py-1.5 text-[10px] font-black text-slate-600">{new Date(row.toDate).toLocaleDateString()}</td>
                          <td className="px-6 py-1.5 text-[11px] font-black text-slate-800">
                            {row.days || (Math.ceil((new Date(row.toDate) - new Date(row.fromDate)) / (1000 * 60 * 60 * 24)) + 1)} Days
                          </td>
                          <td className="px-6 py-1.5 text-[10px] font-bold text-slate-400 max-w-[130px] truncate">{row.reason}</td>
                          <td className="px-6 py-1.5">
                            <span className={`px-2.5 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-widest border ${
                              row.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              row.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-1.5 text-[10px] font-black text-slate-400">{new Date(row.appliedOn).toLocaleDateString()}</td>
                          <td className="px-6 py-1.5">
                            <button className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg transition-all"><MoreVertical size={14} /></button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-10 py-10 text-center text-slate-400 text-xs font-bold italic">No leave records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-slate-50 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {leaveRecords.length > 0 ? 1 : 0} to {leaveRecords.length} of {leaveRecords.length} records</p>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-100 text-slate-400 rounded-lg hover:bg-slate-50 transition-all"><ChevronLeft size={16} /></button>
                  <button className="w-8 h-8 flex items-center justify-center bg-blue-50 border border-blue-100 text-blue-600 rounded-lg text-xs font-black">1</button>
                  <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-100 text-slate-400 rounded-lg hover:bg-slate-50 transition-all"><ChevronRight size={16} /></button>
                </div>
              </div>
            </div>

            {/* Leave Calendar Section */}
            <div className="xl:col-span-4 bg-white rounded-[40px] border border-border shadow-sm p-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Leave Calendar</h3>
                <div className="flex items-center gap-2">
                   <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
                   <span className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-700 uppercase tracking-widest">{monthNames[currentMonth]} {currentYear}</span>
                   <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors"><ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-y-6 text-center mb-12">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <span key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
                ))}
                {(() => {
                  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                  const paddingDays = Array(firstDayOfMonth).fill(null);
                  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

                  return (
                    <>
                      {paddingDays.map((_, i) => <div key={`pad-${i}`}></div>)}
                      {monthDays.map((day) => {
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const currentDayDate = new Date(currentYear, currentMonth, day, 12, 0, 0);
                        
                        const holidayItem = holidays && holidays.find(h => h.holidayDate === dateStr);
                        const isWeekend = currentDayDate.getDay() === 0;

                        // Find approved leave matching this date
                        const approvedLeave = leaveRecords.find(l => {
                          const status = (l.status || '').toUpperCase();
                          if (status !== 'APPROVED') return false;
                          const from = new Date(l.fromDate || l.startDate);
                          const to = new Date(l.toDate || l.endDate || l.fromDate || l.startDate);
                          from.setHours(0, 0, 0, 0);
                          to.setHours(23, 59, 59, 999);
                          return currentDayDate >= from && currentDayDate <= to;
                        });

                        const leaveType = approvedLeave?.leaveType || approvedLeave?.type || '';
                        const isCasual = leaveType.toLowerCase().includes('casual');
                        const isSick = leaveType.toLowerCase().includes('sick');
                        const isAnnual = leaveType.toLowerCase().includes('annual') || leaveType.toLowerCase().includes('earned') || leaveType.toLowerCase().includes('paid');

                        let colorClass = 'text-slate-700 font-medium hover:bg-slate-50';
                        let titleText = `${day} ${monthNames[currentMonth]} ${currentYear}`;

                        if (holidayItem) {
                          colorClass = 'bg-indigo-50 text-indigo-600 font-black border border-indigo-200/80 shadow-sm hover:scale-105';
                          titleText += ` • Holiday (${holidayItem.holidayName || 'Holiday'})`;
                        } else if (approvedLeave) {
                          if (isSick) {
                            colorClass = 'bg-amber-50 text-amber-600 font-black border border-amber-200 shadow-sm hover:scale-105';
                            titleText += ` • Approved Sick Leave (${approvedLeave.reason || 'Sick'})`;
                          } else if (isCasual) {
                            colorClass = 'bg-violet-50 text-violet-600 font-black border border-violet-200 shadow-sm hover:scale-105';
                            titleText += ` • Approved Casual Leave (${approvedLeave.reason || 'Casual'})`;
                          } else if (isAnnual) {
                            colorClass = 'bg-emerald-50 text-emerald-600 font-black border border-emerald-200 shadow-sm hover:scale-105';
                            titleText += ` • Approved Annual Leave (${approvedLeave.reason || 'Annual'})`;
                          } else {
                            colorClass = 'bg-violet-50 text-violet-600 font-black border border-violet-200 shadow-sm hover:scale-105';
                            titleText += ` • Approved Leave (${leaveType || 'Leave'})`;
                          }
                        } else if (isWeekend) {
                          colorClass = 'bg-slate-50 text-slate-400 font-bold';
                          titleText += ' • Sunday / Weekend';
                        }

                        return (
                          <div key={day} className="flex flex-col items-center group relative cursor-pointer" title={titleText}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs transition-all ${colorClass}`}>
                              {day}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-10 border-t border-slate-50">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Casual Leave</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sick Leave</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Annual / Paid</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Holiday</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Late Marks' && (
        <div className="bg-white rounded-[40px] border border-border shadow-sm overflow-hidden animate-in zoom-in-95 duration-300">
          {attendanceRecords && attendanceRecords.filter(r => r.status === 'Late').length > 0 ? (
            <>
              <div className="p-10 border-b border-slate-50">
                <h3 className="text-xl font-black text-slate-800">Late Marks Record</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">Days where check-in was after the expected time.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      {['Date', 'Day', 'Check In', 'Check Out', 'Work Hours'].map(head => (
                        <th key={head} className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {attendanceRecords.filter(r => r.status === 'Late').map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-10 py-4 text-[11px] font-black text-slate-700">
                          {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(row.date).toLocaleDateString('en-US', { weekday: 'long' })}
                        </td>
                        <td className="px-10 py-4 text-[11px] font-black text-orange-600">
                          {row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td className="px-10 py-4 text-[11px] font-black text-slate-700">
                          {row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td className="px-10 py-4 text-[11px] font-black text-slate-500">
                          {getDynamicWorkHours(row)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100"><Clock size={32} className="text-slate-300" /></div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Late Marks Record</h3>
              <p className="text-slate-500 text-sm font-medium max-w-md mx-auto">This employee has an excellent punctuality record. No significant late marks found for this period.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Document' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          <div className="bg-white rounded-[32px] border border-border shadow-sm overflow-hidden mb-8">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
               <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Document Upload</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">Upload all relevant employee documents. Supported formats: PDF, JPG, PNG (Max size: 10MB per file)</p>
               </div>
               <div className="flex gap-3">
                 <button 
                    onClick={() => setShowBankDetailsModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm"
                 >
                   <Save size={14} /> Add Bank Details
                 </button>
               </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                {[
                  { title: 'Aadhar Card', required: true, formats: 'PDF, JPG, PNG', size: '10MB', icon: <User size={20} />, color: 'rose' },
                  { title: 'PAN Card', required: true, formats: 'PDF, JPG, PNG', size: '10MB', icon: <Briefcase size={20} />, color: 'blue' },
                  { title: 'Offer Letter', required: true, formats: 'PDF', size: '10MB', icon: <Mail size={20} />, color: 'emerald' },
                  { title: 'Experience Certificate', required: false, formats: 'PDF', size: '10MB', icon: <BadgeCheck size={20} />, color: 'violet' },
                  { title: 'Degree Certificate', required: false, formats: 'PDF, JPG, PNG', size: '10MB', icon: <BadgeCheck size={20} />, color: 'orange' },
                  { title: 'Salary Slips (Latest)', required: false, formats: 'PDF', size: '10MB', icon: <TrendingUp size={20} />, color: 'emerald' },
                  { title: 'Bank Details / Passbook', required: false, formats: 'PDF, JPG, PNG', size: '10MB', icon: <Briefcase size={20} />, color: 'orange' },
                  { title: 'ID Proof (Other)', required: false, formats: 'PDF, JPG, PNG', size: '10MB', icon: <User size={20} />, color: 'sky' },
                  { title: 'Photo', required: false, formats: 'JPG, PNG', size: '5MB', icon: <User size={20} />, color: 'violet' },
                ].map((docType) => {
                  const uploaded = documents.find(d => d.title === docType.title);
                  return (
                    <div key={docType.title} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col items-center text-center group hover:border-primary/30 transition-all relative">
                      <button className="absolute top-4 right-4 text-slate-300 hover:text-slate-500"><AlertCircle size={14} /></button>
                      
                      <div className={`w-14 h-14 bg-${docType.color}-50 text-${docType.color}-500 rounded-2xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform`}>
                        {docType.icon}
                      </div>
                      
                      <h4 className="text-[11px] font-black text-slate-800 mb-1 leading-tight">
                        {docType.title} {docType.required && <span className="text-rose-500">*</span>}
                      </h4>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{docType.formats}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-6">Max {docType.size}</p>
                      
                      {uploaded ? (
                        <div className="w-full space-y-2">
                           <a 
                             href={uploaded.fileUrl} 
                             target="_blank" 
                             rel="noreferrer"
                             className="w-full py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
                           >
                             <BadgeCheck size={14} /> View Doc
                           </a>
                           <button 
                             onClick={() => handleDeleteDoc(uploaded._id)}
                             className="w-full py-2 bg-rose-50 text-rose-500 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                           >
                             Remove
                           </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setNewDoc({ title: docType.title, category: docType.title });
                            setShowDocModal(true);
                          }}
                          className="w-full py-2.5 bg-white border border-slate-200 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                        >
                          <TrendingUp size={14} className="rotate-0" /> Upload
                        </button>
                      )}
                    </div>
                  );
                })}

                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-all" onClick={() => setShowDocModal(true)}>
                   <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300 mb-4"><Plus size={24} /></div>
                   <h4 className="text-[11px] font-black text-slate-800 mb-1">Add More Document</h4>
                   <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed">Upload any additional<br/>documents</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-border shadow-sm p-10">
             <h3 className="text-sm font-black text-slate-800 mb-8 uppercase tracking-widest">Document Guidelines</h3>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-4">
                   {[
                     'Ensure all documents are clear and readable',
                     'File size should not exceed 10MB per document',
                     'Allowed formats: PDF, JPG, PNG',
                     'All required documents (*) must be uploaded'
                   ].map((item, idx) => (
                     <div key={idx} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><BadgeCheck size={12} /></div>
                        <span className="text-[11px] font-bold text-slate-500">{item}</span>
                     </div>
                   ))}
                </div>
                
                <div className="bg-blue-50/50 rounded-[32px] p-8 border border-blue-100 flex items-center gap-6">
                   <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100"><Lock size={28} /></div>
                   <div>
                      <h4 className="text-[13px] font-black text-slate-800 mb-1">Secure Upload</h4>
                      <p className="text-[10px] font-medium text-slate-500 leading-relaxed max-w-sm">All documents are encrypted and stored securely. Only authorized personnel can access these documents.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
           <div className="bg-white rounded-[40px] w-full max-w-md p-10 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black text-slate-800">New Document</h3>
                 <button onClick={() => setShowDocModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={24} className="text-slate-400" /></button>
              </div>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Document Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Aadhaar Card" 
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                    <select 
                      value={newDoc.category}
                      onChange={(e) => setNewDoc({...newDoc, category: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                    >
                       <option>Identity Proof</option>
                       <option>Education</option>
                       <option>Banking Details</option>
                       <option>Employment</option>
                       <option>Payroll</option>
                       <option>HR Documents</option>
                       <option>Other</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">File Selection</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer bg-slate-50 rounded-2xl border border-slate-100 p-2"
                      />
                    </div>
                    {selectedFile && <p className="text-[10px] font-black text-emerald-500 mt-2 uppercase">Selected: {selectedFile.name}</p>}
                 </div>
                 
                 <div className="pt-4">
                    <button 
                      onClick={handleUploadDoc}
                      disabled={docUploadLoading || !selectedFile || !newDoc.title}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                       {docUploadLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
                       {docUploadLoading ? 'Vaulting...' : 'Save to Vault'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Timesheet' && (
         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           {!showWeeklyDetail ? (
             <>
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                 <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Work Hours</p>
                    <h3 className="text-xl font-black text-slate-800">
                      {Math.floor(timesheets.reduce((acc, r) => {
                        const h = r.totalHours?.match(/(\d+)h/);
                        return acc + (h ? parseInt(h[1]) : 0);
                      }, 0))}h {timesheets.reduce((acc, r) => {
                        const m = r.totalHours?.match(/(\d+)m/);
                        return acc + (m ? parseInt(m[1]) : 0);
                      }, 0) % 60}m
                    </h3>
                    <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-widest">This Month</p>
                 </div>
                 <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Overtime</p>
                    <h3 className="text-xl font-black text-slate-800">
                      {Math.floor(timesheets.reduce((acc, r) => {
                        const h = r.overtime?.match(/(\d+)h/);
                        return acc + (h ? parseInt(h[1]) : 0);
                      }, 0))}h {timesheets.reduce((acc, r) => {
                        const m = r.overtime?.match(/(\d+)m/);
                        return acc + (m ? parseInt(m[1]) : 0);
                      }, 0) % 60}m
                    </h3>
                    <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-widest">Extra Hours</p>
                 </div>
                 <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Hours / Day</p>
                    <h3 className="text-xl font-black text-slate-800">
                      {timesheets.length > 0 ? (
                        Math.floor(timesheets.reduce((acc, r) => {
                          const h = r.totalHours?.match(/(\d+)h/);
                          const m = r.totalHours?.match(/(\d+)m/);
                          return acc + (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
                        }, 0) / timesheets.length / 60)
                      ) : 0}h {timesheets.length > 0 ? (
                        Math.floor(timesheets.reduce((acc, r) => {
                          const h = r.totalHours?.match(/(\d+)h/);
                          const m = r.totalHours?.match(/(\d+)m/);
                          return acc + (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
                        }, 0) / timesheets.length) % 60
                      ) : 0}m
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Efficiency Rate</p>
                 </div>
                 <div className="bg-white p-6 rounded-[32px] border border-border shadow-sm flex items-center justify-center">
                    <button 
                      onClick={() => setShowWeeklyDetail(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                      <Clock size={16} /> View Weekly Grid
                    </button>
                 </div>
               </div>

               <div className="bg-white rounded-[40px] border border-border shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                     <h3 className="text-xl font-black text-slate-800">Monthly Timesheet List</h3>
                     <div className="flex items-center gap-3">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronLeft size={16} /></button>
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{monthNames[currentMonth]} {currentYear}</span>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={16} /></button>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-50/50 border-b border-slate-100">
                              {['Date', 'Log Time', 'Work Hours', 'Overtime', 'Status', 'Action'].map(h => (
                                <th key={h} className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                              ))}
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {timesheets.length > 0 ? (
                             timesheets.map((report, idx) => (
                               <tr key={idx} className="hover:bg-slate-50/30 transition-all">
                                  <td className="px-10 py-5">
                                     <p className="text-sm font-black text-slate-700">{report.date}</p>
                                  </td>
                                  <td className="px-10 py-5">
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                        {report.loginTime || '--'} - 
                                        {report.logoutTime || '--'}
                                     </p>
                                  </td>
                                  <td className="px-10 py-5">
                                     <span className="text-sm font-black text-slate-700">{report.totalHours || '0h 0m'}</span>
                                  </td>
                                  <td className="px-10 py-5 text-sm font-bold text-slate-400">{report.overtime || '0h 0m'}</td>
                                  <td className="px-10 py-5">
                                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                       report.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                       report.status === 'Submitted' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                       'bg-orange-50 text-orange-600 border-orange-100'
                                     }`}>
                                        {report.status || 'Pending'}
                                     </span>
                                  </td>
                                  <td className="px-10 py-5">
                                     <button 
                                       onClick={() => {
                                         setSelectedTimesheet(report);
                                         setShowWeeklyDetail(true);
                                       }}
                                       className="p-2 text-slate-300 hover:text-primary transition-colors"
                                     >
                                       <Eye size={16} />
                                     </button>
                                  </td>
                               </tr>
                             ))
                           ) : (
                             <tr>
                               <td colSpan="6" className="px-10 py-20 text-center text-slate-400 text-xs font-bold italic">No timesheet records found for this month.</td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
             </>
           ) : (
             <AdminWeeklyTimesheet 
               employee={employee} 
               onBack={() => { setShowWeeklyDetail(false); setSelectedTimesheet(null); }}
               initialTimesheet={selectedTimesheet}
             />
           )}
        </div>
      )}

      {activeTab === 'Login History' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[40px] border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Login Activity Log</h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Recent authentication attempts and sessions</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Session</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {['Login Date & Time', 'IP Address', 'Device / Browser', 'Location', 'Status'].map(head => (
                      <th key={head} className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loginLogs.length > 0 ? (
                    loginLogs.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-10 py-5">
                          <div className="flex items-center gap-3">
                            <Clock size={16} className="text-slate-300" />
                            <span className="text-sm font-black text-slate-700">
                              {new Date(row.timestamp).toLocaleString('en-GB', { 
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', hour12: true 
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-5 text-sm font-bold text-slate-500">{row.ipAddress || '---'}</td>
                        <td className="px-10 py-5">
                          <div className="flex items-center gap-2">
                            <ExternalLink size={14} className="text-slate-300" />
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">
                              {row.browser} / {row.device}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">{row.location || '---'}</td>
                        <td className="px-10 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            row.status === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-10 py-20 text-center text-slate-400 text-xs font-bold italic">No login activity found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-8 border-t border-slate-50 text-center">
              <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All Login History</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Messages' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[40px] border border-border shadow-sm overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800">Employee Messages</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">Messages sent by {employee?.fullName?.split(' ')[0]} from the mobile app</p>
              </div>
              <button
                onClick={async () => {
                  setNotesLoading(true);
                  try {
                    const res = await api.get(`/admin/notes/${id}`);
                    if (res.data.success) setEmployeeNotes(res.data.notes);
                  } catch (e) { console.error(e); }
                  finally { setNotesLoading(false); }
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-50 text-violet-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-100 border border-violet-100 transition-all"
              >
                {notesLoading ? (
                  <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-500 rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                )}
                Refresh
              </button>
            </div>

            {notesLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : employeeNotes.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No messages yet</p>
                <p className="text-xs text-slate-300 mt-2">Messages sent by the employee from the mobile app will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {employeeNotes.map((note, idx) => (
                  <div key={note._id || idx} className="p-8 hover:bg-slate-50/40 transition-colors group">
                    <div className="flex items-start gap-5">
                      <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center flex-shrink-0 border border-violet-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-violet-500"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {new Date(note.createdAt).toLocaleString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', hour12: true
                              })}
                            </span>
                            {note.isRead && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                Seen
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">#{idx + 1}</span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100">
                          {note.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {employeeNotes.length > 0 && (
              <div className="p-8 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{employeeNotes.length} message{employeeNotes.length !== 1 ? 's' : ''} total</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{employeeNotes.filter(n => n.isRead).length} read • {employeeNotes.filter(n => !n.isRead).length} unread</span>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'Journey' && (
          <div className="bg-white rounded-[40px] border border-border shadow-sm p-8 mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-8">Employment Journey</h3>
            <div className="relative pl-8 border-l-2 border-slate-200 space-y-10 pb-4">
              {[...(employee.employmentHistory || [])]
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .map((hist, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow shadow-blue-500/50"></div>
                  <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl relative overflow-hidden max-w-2xl">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-blue-900 flex items-center gap-2">
                          {hist.employmentType}
                        </h4>
                        <p className="text-sm font-semibold text-blue-600 mt-1">{hist.empCode}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        COMPLETED
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm mt-4">
                      <p><span className="text-slate-500">Designation:</span> <span className="font-medium text-slate-800">{hist.designation}</span></p>
                      <p><span className="text-slate-500">Department:</span> <span className="font-medium text-slate-800">{hist.department}</span></p>
                      <p className="col-span-2 text-blue-700 mt-2 text-xs font-bold">
                        {new Date(hist.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} → {hist.endDate ? new Date(hist.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="relative">
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow shadow-blue-500/50"></div>
                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl relative overflow-hidden max-w-2xl">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-blue-900 flex items-center gap-2">
                        ⭐ {employee.employmentType || (employee.empCode?.includes('OD-IN') ? 'Intern' : 'Regular')} (Current)
                      </h4>
                      <p className="text-sm font-semibold text-blue-600 mt-1">{employee.empCode}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm mt-4">
                    <p><span className="text-slate-500">Designation:</span> <span className="font-medium text-slate-800">{employee.role}</span></p>
                    <p><span className="text-slate-500">Department:</span> <span className="font-medium text-slate-800">{employee.department}</span></p>
                    <p className="col-span-2 text-blue-700 mt-2 text-xs font-bold">
                      {new Date(employee.joinDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} → Present
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {(!employee.employmentHistory || employee.employmentHistory.length === 0) && (
              <p className="text-sm text-slate-500 mt-6">No historical promotions or upgrades recorded yet.</p>
            )}
          </div>
      )}
      
      {activeTab === 'Payroll' && (
        <PayrollTab employeeId={id} employee={employee} />
      )}

      {activeTab === 'Payslips' && (
        <PayslipsTab employeeId={id} employee={employee} />
      )}

      {/* Bank Details Modal */}
      {showBankDetailsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowBankDetailsModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Briefcase size={20} className="text-emerald-500" />
                Bank & Identity Details
              </h3>
              <button onClick={() => setShowBankDetailsModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Account Holder Name</label>
                  <input
                    type="text"
                    value={editForm.accountHolderName}
                    onChange={(e) => setEditForm({...editForm, accountHolderName: e.target.value})}
                    placeholder="E.g. John Doe"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={editForm.bankName}
                    onChange={(e) => setEditForm({...editForm, bankName: e.target.value})}
                    placeholder="E.g. HDFC Bank"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Account Number</label>
                  <input
                    type="text"
                    value={editForm.accountNumber}
                    onChange={(e) => setEditForm({...editForm, accountNumber: e.target.value})}
                    placeholder="E.g. 1234567890"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">IFSC Code</label>
                  <input
                    type="text"
                    value={editForm.ifscCode}
                    onChange={(e) => setEditForm({...editForm, ifscCode: e.target.value})}
                    placeholder="E.g. HDFC0001234"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Branch Name</label>
                  <input
                    type="text"
                    value={editForm.branchName}
                    onChange={(e) => setEditForm({...editForm, branchName: e.target.value})}
                    placeholder="E.g. Main Branch"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">UPI ID</label>
                  <input
                    type="text"
                    value={editForm.upiId}
                    onChange={(e) => setEditForm({...editForm, upiId: e.target.value})}
                    placeholder="E.g. user@okhdfcbank"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">PAN Number</label>
                  <input
                    type="text"
                    value={editForm.panNumber}
                    onChange={(e) => setEditForm({...editForm, panNumber: e.target.value})}
                    placeholder="E.g. ABCDE1234F"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Aadhaar Number</label>
                  <input
                    type="text"
                    value={editForm.aadharNumber}
                    onChange={(e) => setEditForm({...editForm, aadharNumber: e.target.value})}
                    placeholder="E.g. 1234 5678 9012"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">PF Account Number</label>
                  <input
                    type="text"
                    value={editForm.pfAccount || ''}
                    onChange={(e) => setEditForm({...editForm, pfAccount: e.target.value})}
                    placeholder="E.g. MH/12345/67890"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all uppercase"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 mt-auto">
              <button
                onClick={() => setShowBankDetailsModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Bank Details
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminEmployeeDetails;
