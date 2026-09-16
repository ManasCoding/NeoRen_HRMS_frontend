import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { 
  Users, Clock, Filter, Download, Search, 
  Eye, Calendar,
  Briefcase, FileText, PieChart, TrendingUp, Star, Info, Send
} from 'lucide-react';
import { 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import * as XLSX from 'xlsx';
import api from '../services/api';
import CustomDropdown from '../components/CustomDropdown';

const COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f43f5e', '#f59e0b', '#64748b'];

const StatCard = ({ icon, label, value, subValue, colorClass }) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
    <div className={`w-14 h-14 ${colorClass} rounded-2xl flex items-center justify-center shadow-sm`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-[#1e293b]">{value}</h3>
      <p className="text-[10px] font-bold text-slate-400">{subValue}</p>
    </div>
  </div>
);

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [allReports, setAllReports] = useState([]);
  const sentinelRef = useRef(null);
  const PAGE_SIZE = 10;
  const [data, setData] = useState({
    stats: { totalEmployees: 0, totalHoursToday: '0h 0m', averageHours: '0h 0m', totalOvertimeToday: '0h 0m' },
    reports: [],
    totalEntries: 0,
    summary: [],
    statusCounts: { Completed: 0, Pending: 0, NotSubmitted: 0 }
  });

  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    department: 'All Departments',
    employeeId: 'All Employees',
    status: 'Completed',
  });

  const [search, setSearch] = useState('');
  const [selectedTasks, setSelectedTasks] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  const [currentReportStatus, setCurrentReportStatus] = useState(null);
  const [currentWorkDate, setCurrentWorkDate] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [departments, setDepartments] = useState(['All Departments', 'Digital Marketing', 'Web Development', 'SEO', 'HR', 'Others']);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Payroll Excel Export Modal
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payrollExporting, setPayrollExporting] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const currentDate = new Date();
  const [payrollExportMonth, setPayrollExportMonth] = useState(currentDate.getMonth() + 1);
  const [payrollExportYear, setPayrollExportYear] = useState(currentDate.getFullYear());
  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/employees');
      if (res.data.success) {
        const uniqueDepts = [...new Set(res.data.employees.map(e => e.department).filter(Boolean))];
        setDepartments(['All Departments', ...uniqueDepts]);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setCurrentPage(1);
    setHasMore(true);
    try {
      const params = new URLSearchParams(filters);
      if (search) params.append('search', search);
      const res = await api.get(`/admin/reports/hourly?${params.toString()}`);
      if (res.data.success) {
        const validReports = res.data.reports.filter(r => r.employeeId && r.employeeId.fullName);
        setAllReports(validReports);
        const firstSlice = validReports.slice(0, PAGE_SIZE);
        setHasMore(validReports.length > PAGE_SIZE);
        setData({
          ...res.data,
          reports: firstSlice,
          totalEntries: validReports.length
        });
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreReports = useCallback(() => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const nextSlice = allReports.slice(0, nextPage * PAGE_SIZE);
      const stillHasMore = nextSlice.length < allReports.length;
      setCurrentPage(nextPage);
      setHasMore(stillHasMore);
      setData(prev => ({ ...prev, reports: nextSlice }));
      setIsFetchingMore(false);
    }, 400);
  }, [isFetchingMore, hasMore, currentPage, allReports]);

  const fetchEmployeeTasks = async (employeeId, date, workStatus) => {
    setModalLoading(true);
    setIsModalOpen(true);
    setCurrentEmployeeId(employeeId);
    setCurrentReportStatus(workStatus);
    setCurrentWorkDate(date);
    setRating(0);
    setHoverRating(0);
    setFeedback('');
    try {
      const res = await api.get(`/employee/tasks/${employeeId}/${date}`);
      if (res.data.success) {
        setSelectedTasks(res.data.tasks);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating first');
      return;
    }
    setRatingLoading(true);
    try {
      const res = await api.post(`/performance/ratings`, {
        employeeId: currentEmployeeId,
        workDate: currentWorkDate,
        rating,
        feedback,
        adminId: null // Handled backend or null for now
      });
      alert('Rating submitted successfully!');
      setIsModalOpen(false);
      
      // Remove the rated item from the table
      setData(prev => ({
        ...prev,
        reports: prev.reports.filter(r => !(r.employeeId?._id === currentEmployeeId && r.date === currentWorkDate))
      }));
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Failed to submit rating');
    } finally {
      setRatingLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filters.date, filters.department, filters.employeeId, filters.status, search]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreReports(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreReports]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({
      date: new Date().toISOString().split('T')[0],
      department: 'All Departments',
      employeeId: 'All Employees',
      status: 'Completed',
      page: 1
    });
    setSearch('');
  };


  const handleDownloadExcel = () => {
    if (data.reports.length === 0) {
      alert('No data available to download');
      return;
    }

    const headers = ['#', 'Employee Name', 'Employee ID', 'Department', 'Date', 'Total Hours', 'Overtime', 'Status'];
    const rows = data.reports.map((r, i) => [
      i + 1,
      r.employeeId?.fullName,
      r.employeeId?.empCode,
      r.employeeId?.department,
      r.date,
      r.workHours,
      r.overtime,
      r.workStatus
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Hourly_Report_${filters.date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmailExcel = async () => {
    setEmailSending(true);
    try {
      const params = new URLSearchParams(filters);
      if (search) params.append('search', search);
      
      const res = await api.get(`/admin/reports/hourly/email/excel?${params.toString()}`);
      if (res.data.success) {
        alert('Excel report sent to email successfully!');
      } else {
        alert(res.data.message || 'Failed to send email.');
      }
    } catch (err) {
      console.error('Email excel error:', err);
      alert('Error sending email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  const MONTH_NAMES = [
    '', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const handlePayrollExcelExport = async () => {
    setPayrollExporting(true);
    try {
      const res = await api.get(`/payroll/attendance-summary-all/${payrollExportMonth}/${payrollExportYear}`);
      if (!res.data.success) { alert('Failed to fetch payroll data.'); return; }

      const { periodStart, periodEnd, data: summaries } = res.data;
      // periodStart: "YYYY-MM-21", periodEnd: "YYYY-MM-20"
      const startLabel = periodStart; // e.g. 2026-06-21
      const endLabel   = periodEnd;   // e.g. 2026-07-20

      const prevMonthNum = payrollExportMonth === 1 ? 12 : payrollExportMonth - 1;
      const prevYear = payrollExportMonth === 1 ? payrollExportYear - 1 : payrollExportYear;
      const titleStr = `SALARY CALCULATION – 21 ${MONTH_NAMES[prevMonthNum]} ${prevYear} TO 20 ${MONTH_NAMES[payrollExportMonth]} ${payrollExportYear}`;

      const wb = XLSX.utils.book_new();
      const ws = {};

      // ── Helper to set a cell ─────────────────────────────────────────────────
      const setCell = (addr, v, bold = false, bg = null, border = false, wrapText = false, sz = 10, italic = false, hAlign = 'center') => {
        const font = { bold, italic, sz };
        const fill = bg ? { fgColor: { rgb: bg }, patternType: 'solid' } : { patternType: 'none' };
        const bStyle = border
          ? { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
          : {};
        ws[addr] = { v, t: typeof v === 'number' ? 'n' : 's', s: { font, fill, alignment: { horizontal: hAlign, vertical: 'center', wrapText }, border: bStyle } };
      };

      // Columns: A=Employee, B=Basic Salary, C=Working Days, D=Present/Full, E=Absent/Leave,
      //          F=Half-Day, G=Paid Holiday, H=Weekend/Sunday, I=Payable Days,
      //          J=Per-Day Salary, K=Calculation, L=Final Amount to Release,
      //          M=Absent Deduction, N=Half-Day Deduction
      const COLS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'];
      const totalCols = COLS.length;
      const lastCol = COLS[totalCols - 1];

      // ── Row 1: Title ─────────────────────────────────────────────────────────
      setCell('A1', titleStr, true, 'FFFFFF', false, false, 13, false, 'center');
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];

      // ── Row 2: Payroll Period ────────────────────────────────────────────────
      const firstSummary = summaries[0]?.summary;
      const totalWorkingDays = firstSummary?.workingDays ?? 0;

      setCell('A2', 'Payroll Period', true, null, false, false, 9, false, 'left');
      setCell('B2', `${startLabel} to ${endLabel}`, false, null, false, false, 9, false, 'left');
      setCell('C2', 'Formula', true, null, false, false, 9, false, 'left');
      setCell('D2', `Basic Salary ÷ ${totalWorkingDays || 26} × Payable Working Days`, false, null, false, false, 9, false, 'left');
      ws['!merges'].push({ s: { r: 1, c: 1 }, e: { r: 1, c: 1 } });
      ws['!merges'].push({ s: { r: 1, c: 3 }, e: { r: 1, c: totalCols - 1 } });

      // ── Row 3: Total Calendar Days ───────────────────────────────────────────
      const calStart = new Date(periodStart + 'T00:00:00');
      const calEnd   = new Date(periodEnd   + 'T00:00:00');
      const totalCalDays = Math.round((calEnd - calStart) / 86400000) + 1;
      setCell('A3', 'Total Calendar Days', true, null, false, false, 9, false, 'left');
      setCell('B3', totalCalDays, false, null, false, false, 9, false, 'left');
      ws['!merges'].push({ s: { r: 2, c: 1 }, e: { r: 2, c: totalCols - 1 } });

      // ── Row 4: Total Working Days ────────────────────────────────────────────
      // ── Row 4: Total Working Days ────────────────────────────────────────────
      setCell('A4', 'Total Working Days', true, null, false, false, 9, false, 'left');
      setCell('B4', totalWorkingDays, false, null, false, false, 9, false, 'left');
      ws['!merges'].push({ s: { r: 3, c: 1 }, e: { r: 3, c: totalCols - 1 } });

      // ── Row 5: Blank spacer ──────────────────────────────────────────────────
      // (empty)

      // ── Row 6: Column Headers ────────────────────────────────────────────────
      const HEADERS = [
        'Employee', 'Basic Salary (₹)', 'Working Days', 'Present / Full Days',
        'Absent / Leave', 'Half-Day', 'Paid Holiday', 'Weekend / Sunday',
        'Payable Days', 'Per-Day Salary (₹)', 'Calculation',
        'Final Amount to Release (₹)', 'Absent Deduction (₹)', 'Half-Day Deduction (₹)'
      ];
      COLS.forEach((col, i) => {
        setCell(`${col}6`, HEADERS[i], true, 'D9EAD3', true, true, 9, false, 'center');
      });

      // ── Data Rows (starting row 7) ───────────────────────────────────────────
      let totalWorkingSum = 0, totalPresentSum = 0, totalAbsentSum = 0;
      let totalHalfDaySum = 0, totalPaidLeaveSum = 0, totalWeeklyOffSum = 0;
      let totalPayableSum = 0;

      summaries.forEach((item, idx) => {
        const rowNum = 7 + idx;
        const s = item.summary;
        const emp = item.employee;

        // Payable days from calcAttendanceSummary
        const payDays = s.payableDays ?? 0;

        totalWorkingSum   += s.workingDays ?? 0;
        totalPresentSum   += s.present     ?? 0;
        totalAbsentSum    += s.absent      ?? 0;
        totalHalfDaySum   += s.halfDay     ?? 0;
        totalPaidLeaveSum += s.holidays    ?? 0;  // paid holidays
        totalWeeklyOffSum += s.weeklyOff   ?? 0;
        totalPayableSum   += payDays;

        const rowBg = idx % 2 === 0 ? null : 'F8F9FA';

        setCell(`A${rowNum}`, emp.fullName,        false, rowBg, true, false, 9, false, 'left');
        setCell(`B${rowNum}`, '',                   false, rowBg, true, false, 9, false, 'right');  // left blank for manual entry
        setCell(`C${rowNum}`, s.workingDays ?? 0,  false, rowBg, true, false, 9, false, 'center');
        setCell(`D${rowNum}`, s.present     ?? 0,  false, rowBg, true, false, 9, false, 'center');
        setCell(`E${rowNum}`, s.absent      ?? 0,  false, rowBg, true, false, 9, false, 'center');
        setCell(`F${rowNum}`, s.halfDay     ?? 0,  false, rowBg, true, false, 9, false, 'center');
        setCell(`G${rowNum}`, s.holidays    ?? 0,  false, rowBg, true, false, 9, false, 'center');
        setCell(`H${rowNum}`, s.weeklyOff   ?? 0,  false, rowBg, true, false, 9, false, 'center');
        setCell(`I${rowNum}`, payDays,              false, rowBg, true, false, 9, false, 'center');
        setCell(`J${rowNum}`, '',                   false, rowBg, true, false, 9, false, 'right');  // blank: needs basic salary
        setCell(`K${rowNum}`, '',                   false, rowBg, true, false, 9, false, 'left');   // calculation blank
        setCell(`L${rowNum}`, '₹0.00',             false, 'FFF2CC', true, false, 9, false, 'right'); // final amount
        setCell(`M${rowNum}`, '₹0.00',             false, rowBg, true, false, 9, false, 'right');
        setCell(`N${rowNum}`, '₹0.00',             false, rowBg, true, false, 9, false, 'right');
      });

      // ── TOTAL Row ────────────────────────────────────────────────────────────
      const totalRow = 7 + summaries.length;
      const totalBg  = 'CFE2F3';
      setCell(`A${totalRow}`, 'TOTAL',           true, totalBg, true, false, 9, false, 'center');
      setCell(`B${totalRow}`, '₹0.00',           true, totalBg, true, false, 9, false, 'right');
      setCell(`C${totalRow}`, totalWorkingSum,   true, totalBg, true, false, 9, false, 'center');
      setCell(`D${totalRow}`, totalPresentSum,   true, totalBg, true, false, 9, false, 'center');
      setCell(`E${totalRow}`, totalAbsentSum,    true, totalBg, true, false, 9, false, 'center');
      setCell(`F${totalRow}`, totalHalfDaySum,   true, totalBg, true, false, 9, false, 'center');
      setCell(`G${totalRow}`, totalPaidLeaveSum, true, totalBg, true, false, 9, false, 'center');
      setCell(`H${totalRow}`, totalWeeklyOffSum, true, totalBg, true, false, 9, false, 'center');
      setCell(`I${totalRow}`, totalPayableSum,   true, totalBg, true, false, 9, false, 'center');
      setCell(`J${totalRow}`, '',                true, totalBg, true, false, 9, false, 'center');
      setCell(`K${totalRow}`, 'TOTAL AMOUNT TO BE RELEASED', true, totalBg, true, false, 9, false, 'center');
      setCell(`L${totalRow}`, '₹0.00',           true, totalBg, true, false, 9, false, 'right');
      setCell(`M${totalRow}`, '₹0.00',           true, totalBg, true, false, 9, false, 'right');
      setCell(`N${totalRow}`, '₹0.00',           true, totalBg, true, false, 9, false, 'right');

      // ── Blank row ────────────────────────────────────────────────────────────
      const notesRow = totalRow + 2;
      setCell(`A${notesRow}`, 'PAYROLL SUMMARY', true, null, false, false, 10, false, 'left');
      setCell(`D${notesRow}`, 'CALCULATION METHOD FOR REVIEW', true, null, false, false, 10, false, 'left');

      const n1 = notesRow + 1;
      setCell(`A${n1}`, 'Total Basic Salary Entered', false, null, false, false, 9, false, 'left');
      setCell(`B${n1}`, '₹0.00', false, null, false, false, 9, false, 'left');
      setCell(`D${n1}`, `1. Working D: ${totalWorkingDays} days (${totalCalDays} calendar days – Sundays)`, false, null, false, false, 9, false, 'left');
      ws['!merges'].push({ s: { r: n1 - 1, c: 3 }, e: { r: n1 - 1, c: totalCols - 1 } });

      const n2 = notesRow + 2;
      setCell(`A${n2}`, 'Working Days Per Employee', false, null, false, false, 9, false, 'left');
      setCell(`B${n2}`, totalWorkingDays, false, null, false, false, 9, false, 'left');
      setCell(`D${n2}`, '2. Payable D: Present + (Half-Day × 0.5) + Paid Holiday', false, null, false, false, 9, false, 'left');
      ws['!merges'].push({ s: { r: n2 - 1, c: 3 }, e: { r: n2 - 1, c: totalCols - 1 } });

      // ── Column Widths ─────────────────────────────────────────────────────────
      ws['!cols'] = [
        { wch: 24 }, // A Employee
        { wch: 16 }, // B Basic Salary
        { wch: 13 }, // C Working Days
        { wch: 18 }, // D Present
        { wch: 14 }, // E Absent
        { wch: 10 }, // F Half-Day
        { wch: 13 }, // G Paid Holiday
        { wch: 16 }, // H Weekend/Sunday
        { wch: 13 }, // I Payable Days
        { wch: 16 }, // J Per-Day Salary
        { wch: 32 }, // K Calculation
        { wch: 22 }, // L Final Amount
        { wch: 18 }, // M Absent Deduction
        { wch: 20 }, // N Half-Day Deduction
      ];

      // ── Row Heights ───────────────────────────────────────────────────────────
      ws['!rows'] = [{ hpt: 28 }, { hpt: 16 }, { hpt: 16 }, { hpt: 16 }, { hpt: 8 }, { hpt: 36 }];

      // Set sheet range
      ws['!ref'] = `A1:${lastCol}${n2}`;

      XLSX.utils.book_append_sheet(wb, ws, 'Salary Calculation');
      const fileName = `Salary_Calculation_${MONTH_NAMES[prevMonthNum]}_${prevYear}_to_${MONTH_NAMES[payrollExportMonth]}_${payrollExportYear}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setIsPayrollModalOpen(false);
    } catch (err) {
      console.error('Payroll export error:', err);
      alert('Error exporting payroll data. Please try again.');
    } finally {
      setPayrollExporting(false);
    }
  };

  return (
    <AdminLayout title="Hourly Reports" subtitle="View and download hourly work reports.">
      <div className="space-y-8 pb-20">
        


        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={<Users size={24} className="text-blue-600" />} 
            label="Total Employees" 
            value={data.stats.totalEmployees} 
            subValue="Active Employees" 
            colorClass="bg-blue-50"
          />
          <StatCard 
            icon={<Clock size={24} className="text-emerald-600" />} 
            label="Total Hours Today" 
            value={data.stats.totalHoursToday} 
            subValue="Logged Hours" 
            colorClass="bg-emerald-50"
          />
          <StatCard 
            icon={<TrendingUp size={24} className="text-violet-600" />} 
            label="Average Hours" 
            value={data.stats.averageHours} 
            subValue="Per Employee" 
            colorClass="bg-violet-50"
          />
          <StatCard 
            icon={<Clock size={24} className="text-orange-500" />} 
            label="Overtime Hours" 
            value={data.stats.totalOvertimeToday} 
            subValue="Total Overtime" 
            colorClass="bg-orange-50"
          />
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="date" 
                    name="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-blue-500/10" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                <div className="w-full">
                  <CustomDropdown 
                    name="department"
                    value={filters.department}
                    options={departments}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee</label>
                <div className="w-full">
                  <CustomDropdown 
                    name="employeeId"
                    value={filters.employeeId}
                    options={['All Employees']}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                <div className="w-full">
                  <CustomDropdown 
                    name="status"
                    value={filters.status}
                    options={['Completed']}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              {/* <div className="flex items-end gap-3">
                 <button onClick={fetchReports} className="flex-1 py-3 bg-[#3b82f6] text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                   <Search size={14} /> Apply Filters
                 </button>
                 <button onClick={resetFilters} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all">
                   <TrendingUp size={16} />
                 </button>
              </div> */}
           </div>
        </div>

        {/* Main Content Area */}
        {/* Today's Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Today's Summary (Donut) */}
           <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 flex items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <PieChart size={20} />
                  </div>
                  <h3 className="text-lg font-black text-[#1e293b]">Today's Summary</h3>
                </div>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                   {data.summary.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <span className="text-xs font-bold text-slate-500">{item.name}</span>
                         </div>
                         <span className="text-xs font-black text-[#1e293b]">{item.hours}</span>
                      </div>
                   ))}
                </div>
              </div>

              <div className="w-48 h-48 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                       <Pie
                          data={data.summary.length > 0 ? data.summary : [{ name: 'No Data', minutes: 1 }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="minutes"
                       >
                          {data.summary.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Pie>
                    </RePieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-black text-[#1e293b] leading-tight">{data.stats.totalHoursToday}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Hours</p>
                 </div>
              </div>
           </div>

           {/* Report Status */}
           <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
              <h3 className="text-lg font-black text-[#1e293b] mb-8">Submission Status</h3>
              <div className="grid grid-cols-1 gap-4">
                 {[
                   { label: 'Completed', count: data.statusCounts.Completed, color: 'bg-emerald-500', total: data.stats.totalEmployees },
                   { label: 'Pending', count: data.statusCounts.Pending, color: 'bg-orange-500', total: data.stats.totalEmployees },
                   { label: 'Not Submitted', count: data.statusCounts.NotSubmitted, color: 'bg-rose-500', total: data.stats.totalEmployees }
                 ].map(status => {
                   const percentage = status.total > 0 ? (status.count / status.total) * 100 : 0;
                   return (
                     <div key={status.label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{status.label}</p>
                           <p className="text-[10px] font-black text-[#1e293b] uppercase tracking-widest">{status.count} ({percentage.toFixed(1)}%)</p>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                           <div className={`h-full ${status.color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>

           {/* Download & Actions */}
           <div className="bg-[#0f172a] rounded-[40px] p-8 text-white shadow-xl shadow-slate-200 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
              <h3 className="text-lg font-black mb-6 relative z-10">Export Center</h3>
              <div className="space-y-3 relative z-10">
                 <button onClick={handleDownloadExcel} className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all">
                    <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                       <Download size={16} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Download Full Excel</span>
                 </button>
                 <button onClick={handleEmailExcel} disabled={emailSending} className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all disabled:opacity-50">
                    <div className="w-8 h-8 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center">
                       <Send size={16} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">{emailSending ? 'Sending...' : 'Send Excel to Mail'}</span>
                 </button>
                    {/* Debounced search effect */}
                    {(() => {
                      const timer = setTimeout(() => {
                        // fetchReports is invoked via effect below
                      }, 0);
                      return null;
                    })()}
                 <button onClick={() => setIsPayrollModalOpen(true)} className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all">
                    <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
                       <FileText size={16} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Custom Range</span>
                 </button>
              </div>
           </div>
        </div>

        {/* Full Width Report List */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-black text-[#1e293b]">Hourly Report List</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Detailed breakdown of employee work logs</p>
              </div>
              <div className="flex items-center gap-4">
                 {/* <div className="relative">
                   <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search employee name or ID..." 
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none w-72 focus:ring-4 focus:ring-blue-500/5 transition-all" 
                   />
                 </div> */}
                  <div className="relative">
                    <input 
                      type="date" 
                      value={filters.date || ''}
                      onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                      className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer hover:bg-slate-100" 
                    />
                  </div>
                  <div className="relative">
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 border border-slate-100 transition-all" onClick={() => setShowFilterPanel(prev => !prev)}>
                      <Filter size={18} />
                    </button>
                    {showFilterPanel && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-10">
                        {departments.map(dept => (
                          <button key={dept} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" onClick={() => { setFilters({ ...filters, department: dept }); setShowFilterPanel(false); }}>{dept}</button>
                        ))}
                      </div>
                    )}
                  </div>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Name</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Overtime</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted At</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td colSpan="9" className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading records...</p>
                          </div>
                        </td>
                      </tr>
                    ) : data.reports.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-20">
                            <FileText size={64} />
                            <p className="text-sm font-bold uppercase tracking-widest">No reports available</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      data.reports.map((report, idx) => (
                        <tr key={report._id} className="hover:bg-slate-50/50 transition-all group">
                           <td className="px-8 py-5 text-xs font-bold text-slate-400">{idx + 1}</td>
                           <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-[11px] text-slate-600 border-2 border-white shadow-sm overflow-hidden group-hover:scale-110 transition-transform">
                                    {report.employeeId?.profileImage ? (
                                      <img src={report.employeeId.profileImage} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                                    ) : report.employeeId?.fullName?.charAt(0)}
                                 </div>
                                 <span className="text-sm font-black text-[#1e293b]">{report.employeeId?.fullName}</span>
                              </div>
                           </td>
                           <td className="px-8 py-5 text-xs font-bold text-slate-500">{report.employeeId?.empCode}</td>
                           <td className="px-8 py-5">
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                {report.employeeId?.department}
                              </span>
                           </td>
                           <td className="px-8 py-5 text-xs font-bold text-slate-500">{report.date}</td>
                           <td className="px-8 py-5 text-sm font-black text-[#1e293b]">{report.workHours}</td>
                           <td className="px-8 py-5 text-xs font-bold text-slate-400">{report.overtime}</td>
                           <td className="px-8 py-5 text-xs font-bold text-slate-400">
                             {report.updatedAt ? new Date(report.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                           </td>
                           <td className="px-8 py-5">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                report.workStatus === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                              }`}>
                                {report.workStatus}
                              </span>
                           </td>
                           <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                 <button 
                                   onClick={() => fetchEmployeeTasks(report.employeeId._id, report.date, report.workStatus)}
                                   className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                 >
                                    <Eye size={18} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>

               {/* Infinite scroll sentinel */}
               {!loading && (
                 <div ref={sentinelRef} className="flex items-center justify-center py-6">
                   {isFetchingMore && (
                     <div className="flex items-center gap-3 text-slate-400">
                       <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-400 rounded-full animate-spin" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Loading more...</span>
                     </div>
                   )}
                   {!hasMore && data.reports.length > 0 && (
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">All {data.totalEntries} entries loaded</p>
                   )}
                 </div>
               )}
           </div>

            {/* Entry count footer */}
            <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-50">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 Showing {data.reports.length} of {data.totalEntries} entries
               </p>
            </div>
        </div>

        {/* Task Details Modal */}
        {isModalOpen && (() => {
          const hasTasks = !modalLoading && selectedTasks && selectedTasks.length > 0;
          const showRating = true; // Always show rating section, just disable it when there are no tasks
          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 my-10">
              <div className="relative flex flex-col items-center gap-4 w-full max-w-2xl">
                <div className="bg-white rounded-[40px] w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                  
                  {/* Header */}
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-xl font-black text-[#1e293b]">Hourly Work Details</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed task logs for the selected date</p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Task List — scrollable */}
                  <div className="p-8 overflow-y-auto shrink-0" style={{ maxHeight: '240px' }}>
                    {modalLoading ? (
                      <div className="py-12 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Fetching tasks...</p>
                      </div>
                    ) : hasTasks ? (
                      <div className="space-y-4">
                        {selectedTasks.map((task, idx) => (
                          <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 text-blue-500 font-black text-xs shadow-sm flex-shrink-0">
                              {task.slotKey.split(' - ')[0]}
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{task.slotKey}</p>
                              <h4 className="text-sm font-bold text-[#1e293b] leading-relaxed">{task.title}</h4>
                            </div>
                            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                              DONE
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center opacity-20">
                        <Clock size={48} className="mx-auto mb-3" />
                        <p className="text-sm font-bold uppercase tracking-widest">No tasks logged for this day</p>
                      </div>
                    )}
                  </div>

                  {/* Rating Section — always visible for Completed reports */}
                  {!modalLoading && showRating && (
                    <div className="px-8 pb-6 shrink-0">
                      <div className={`border rounded-[24px] p-4 relative transition-all ${hasTasks ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-xs font-black text-[#1e293b]">Rate Employee Performance</h4>
                          {!hasTasks && (
                            <span className="px-2.5 py-1 bg-orange-50 text-orange-500 border border-orange-100 rounded-lg text-[5px] font-black uppercase tracking-widest">
                              No Tasks Submitted
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mb-2">
                          {hasTasks
                            ? 'Please provide your rating for this work session'
                            : 'Rating is only available when the employee has submitted task logs for the day'}
                        </p>

                        {/* Stars */}
                        <div className={`flex items-center gap-5 mb-2 ${!hasTasks ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onMouseEnter={() => hasTasks && setHoverRating(star)}
                                onMouseLeave={() => hasTasks && setHoverRating(0)}
                                onClick={() => hasTasks && setRating(star)}
                                disabled={!hasTasks}
                                className="focus:outline-none transition-transform hover:scale-110 active:scale-95 disabled:cursor-not-allowed"
                              >
                                <Star
                                  size={28}
                                  className={`${(hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'} transition-colors`}
                                />
                              </button>
                            ))}
                          </div>
                          {rating > 0 && (
                            <div className="flex flex-col">
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 font-black text-[10px] rounded-lg border border-emerald-100">
                                {rating.toFixed(1)} / 5
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold mt-1">
                                {rating === 5 ? 'Excellent' : rating >= 4 ? 'Good' : rating >= 3 ? 'Average' : 'Needs Improvement'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Feedback */}
                        <div className={`mb-2 relative ${!hasTasks ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                          <label className="block text-[10px] font-bold text-slate-500 mb-2">Your Feedback (Optional)</label>
                          <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value.substring(0, 300))}
                            placeholder="Share your feedback about this work..."
                            disabled={!hasTasks}
                            className="w-full h-16 p-3 bg-white border border-slate-200 rounded-2xl text-sm text-[#1e293b] focus:outline-none focus:ring-4 focus:ring-blue-500/10 resize-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                          ></textarea>
                          <div className="absolute bottom-3 right-4 text-[10px] font-bold text-slate-400">
                            {feedback.length} / 300
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleRatingSubmit}
                            disabled={!hasTasks || ratingLoading || rating === 0}
                            className="flex-1 py-3 bg-[#1e293b] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            {ratingLoading ? 'Submitting...' : 'Submit '}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-8 pb-8 bg-slate-50/50 border-t border-slate-100 flex justify-end shrink-0 pt-5">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-8 py-3 bg-[#1e293b] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95 transition-all"
                    >
                      Close Details
                    </button>
                  </div>
                </div>

                {/* Info Alert below modal */}
                {showRating && (
                  <div className="w-full bg-blue-50/95 backdrop-blur-md border border-blue-100 rounded-2xl p-4 flex gap-4 shadow-xl">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-blue-100 text-blue-500 shadow-sm">
                      <Info size={20} />
                    </div>
                    <p className="text-sm font-bold text-blue-900 leading-relaxed">
                      Once you submit the rating, it will be added to the employee's performance data and reflected in the Performance page.
                    </p>
                  </div>
                )}

              </div>
            </div>
          );
        })()}
        {/* ── Payroll Excel Export Modal ─────────────────────────────────── */}
        {isPayrollModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-[#1e293b]">Payroll Excel Export</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Download salary calculation sheet for all employees</p>
                </div>
                <button
                  onClick={() => setIsPayrollModalOpen(false)}
                  className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6">
                {/* Period label */}
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Payroll Period</p>
                  <p className="text-sm font-black text-[#1e293b]">
                    21 {['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][payrollExportMonth === 1 ? 12 : payrollExportMonth - 1]}&nbsp;
                    {payrollExportMonth === 1 ? payrollExportYear - 1 : payrollExportYear} &nbsp;→&nbsp; 20 {['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][payrollExportMonth]}&nbsp;
                    {payrollExportYear}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Month picker */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Month</label>
                    <select
                      value={payrollExportMonth}
                      onChange={(e) => setPayrollExportMonth(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                        <option key={i+1} value={i+1}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year picker */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Year</label>
                    <select
                      value={payrollExportYear}
                      onChange={(e) => setPayrollExportYear(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-700 font-bold leading-relaxed">
                  <span className="font-black">Note:</span> Basic Salary and Per-Day Salary columns will be left blank for manual entry. All attendance data (Present, Absent, Half-Day, etc.) is pulled live from the payroll calculator.
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setIsPayrollModalOpen(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayrollExcelExport}
                  disabled={payrollExporting}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {payrollExporting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                  ) : (
                    <><Download size={16} /> Download Excel</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

const X = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default AdminReports;
