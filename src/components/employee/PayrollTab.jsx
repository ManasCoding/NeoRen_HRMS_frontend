import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, FileText, DollarSign, Loader2, CheckCircle2, Lock,
  TrendingUp, TrendingDown, ArrowRight, RefreshCw, AlertCircle, Clock, Plane, Briefcase
} from 'lucide-react';

import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAttendance } from '../../context/AttendanceContext';

// ─── Utilities ─────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

// Removed SOCKET_URL

/**
 * Client-side payroll period mirror (matches backend helper).
 * Used only for the period-badge display before data loads.
 */
const getPayrollPeriod = (month, year) => {
  let prevMonth = month - 1, prevYear = year;
  if (prevMonth === 0) { prevMonth = 12; prevYear = year - 1; }
  const pad = (n) => String(n).padStart(2, '0');
  return {
    periodStart: `${prevYear}-${pad(prevMonth)}-21`,
    periodEnd:   `${year}-${pad(month)}-20`,
  };
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Sub-components ────────────────────────────────────────────────────────────
const InputField = ({ label, value, onChange, disabled }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
      <input
        type="number" min="0" value={value}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="0"
      />
    </div>
  </div>
);

const AttCard = ({ label, value, color = 'slate', loading = false, icon: Icon, subtext }) => {
  const map = {
    slate:  { wrapper: 'hover:border-slate-200', iconBg: 'bg-slate-50 text-slate-500', valueText: 'text-slate-800', subText: 'text-slate-500' },
    green:  { wrapper: 'hover:border-emerald-200', iconBg: 'bg-emerald-50 text-emerald-500', valueText: 'text-slate-800', subText: 'text-emerald-500' },
    red:    { wrapper: 'hover:border-rose-200', iconBg: 'bg-rose-50 text-rose-500', valueText: 'text-slate-800', subText: 'text-rose-500' },
    amber:  { wrapper: 'hover:border-amber-200', iconBg: 'bg-amber-50 text-amber-500', valueText: 'text-slate-800', subText: 'text-amber-500' },
    orange: { wrapper: 'hover:border-orange-200', iconBg: 'bg-orange-50 text-orange-500', valueText: 'text-slate-800', subText: 'text-orange-500' },
    blue:   { wrapper: 'hover:border-blue-200', iconBg: 'bg-blue-50 text-blue-500', valueText: 'text-slate-800', subText: 'text-blue-500' },
    indigo: { wrapper: 'hover:border-indigo-200', iconBg: 'bg-indigo-50 text-indigo-500', valueText: 'text-slate-800', subText: 'text-indigo-500' },
    violet: { wrapper: 'hover:border-violet-200', iconBg: 'bg-violet-50 text-violet-500', valueText: 'text-slate-800', subText: 'text-violet-500' },
    teal:   { wrapper: 'hover:border-teal-200', iconBg: 'bg-teal-50 text-teal-500', valueText: 'text-slate-800', subText: 'text-teal-500' },
    primary:{ wrapper: 'hover:border-primary/20 bg-slate-50/30', iconBg: 'bg-primary/10 text-primary', valueText: 'text-slate-800', subText: 'text-primary' },
  };

  const style = map[color] || map.slate;
  const isDays = !label.toLowerCase().includes('mark');

  return (
    <div className={`bg-white p-6 rounded-[32px] border border-border shadow-sm group ${style.wrapper} transition-all min-w-[200px]`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${style.iconBg} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform flex-shrink-0`}>
          {Icon ? <Icon size={22} /> : <Calendar size={22} />}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1">{label}</p>
          {loading ? (
            <div className="h-7 flex items-center">
              <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin opacity-40" />
            </div>
          ) : (
            <>
              <p className="text-xl font-black text-slate-800 leading-none mb-1">{value ?? '0'} <span className="text-sm font-bold text-slate-500">{isDays ? 'Days' : ''}</span></p>
              {subtext && <p className={`text-[10px] font-bold ${style.subText}`}>{subtext}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const PayrollTab = ({ employeeId, employee }) => {
  const { refreshKey } = useAttendance();
  const [month, setMonth]               = useState(new Date().getMonth() + 1);
  const [year, setYear]                 = useState(new Date().getFullYear());
  const [loading, setLoading]           = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [payrollData, setPayrollData]   = useState(null);   // generated payroll OR live preview data
  const [isGenerated, setIsGenerated]   = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState(null); // always live
  const [history, setHistory]           = useState([]);

  // Salary inputs
  const [basicSalary, setBasicSalary]               = useState(30000);
  const [hra, setHra]                               = useState(0);
  const [medicalAllowance, setMedicalAllowance]     = useState(0);
  const [travelAllowance, setTravelAllowance]       = useState(0);
  const [foodAllowance, setFoodAllowance]           = useState(0);
  const [specialAllowance, setSpecialAllowance]     = useState(0);
  const [bonus, setBonus]                           = useState(0);
  const [overtime, setOvertime]                     = useState(0);
  const [otherEarnings, setOtherEarnings]           = useState(0);

  // Deductions
  const [professionalTax, setProfessionalTax] = useState(0);
  const [pf, setPf]                           = useState(0);
  const [esi, setEsi]                         = useState(0);
  const [tds, setTds]                         = useState(0);
  const [advance, setAdvance]                 = useState(0);
  const [loan, setLoan]                       = useState(0);
  const [penalty, setPenalty]                 = useState(0);
  const [lateFine, setLateFine]               = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);

  // Client-side period fallback (before API responds)
  const { periodStart: clientPeriodStart, periodEnd: clientPeriodEnd } = getPayrollPeriod(month, year);

  // The attendance data shown in the summary cards always comes from the live summary endpoint
  const att = attendanceSummary || {};
  const periodFrom = att.payrollPeriod?.from || clientPeriodStart;
  const periodTo   = att.payrollPeriod?.to   || clientPeriodEnd;

  // ── Fetch all payroll + attendance data ──────────────────────────────────
  const fetchAllData = useCallback(async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      setSummaryLoading(true);

      const [summaryRes, payrollRes, historyRes] = await Promise.all([
        api.get(`/payroll/attendance-summary/${employeeId}/${month}/${year}`),
        api.get(`/payroll/${employeeId}/${month}/${year}`),
        api.get(`/payroll/history/${employeeId}`),
      ]);

      if (summaryRes.data.success) {
        setAttendanceSummary(summaryRes.data.data);
      }
      if (payrollRes.data.success) {
        setPayrollData(payrollRes.data.data);
        setIsGenerated(payrollRes.data.isGenerated);
        if (payrollRes.data.isGenerated) {
          const d = payrollRes.data.data;
          setBasicSalary(d.basicSalary || 30000);
          setHra(d.hra || 0);
          setMedicalAllowance(d.medicalAllowance || 0);
          setTravelAllowance(d.travelAllowance || 0);
          setFoodAllowance(d.foodAllowance || 0);
          setSpecialAllowance(d.specialAllowance || 0);
          setBonus(d.bonus || 0);
          setOvertime(d.overtime || 0);
          setOtherEarnings(d.otherEarnings || 0);
          setProfessionalTax(d.professionalTax || 0);
          setPf(d.pf || 0);
          setEsi(d.esi || 0);
          setTds(d.tds || 0);
          setAdvance(d.advance || 0);
          setLoan(d.loan || 0);
          setPenalty(d.penalty || 0);
          setLateFine(d.lateFine || 0);
          setOtherDeductions(d.otherDeductions || 0);
        }
      }
      if (historyRes.data.success) setHistory(historyRes.data.data);
    } catch (err) {
      toast.error('Failed to load payroll data');
      console.error(err);
    } finally {
      setLoading(false);
      setSummaryLoading(false);
    }
  }, [employeeId, month, year]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, refreshKey]);

  // ── Live salary preview (before payroll is generated) ────────────────────
  // All values come from attendanceSummary — no hardcoded fallbacks
  const workDays = att.workingDays ?? 0;
  const pd = workDays > 0 ? basicSalary / workDays : 0;

  const totalAllowances = hra + medicalAllowance + travelAllowance + foodAllowance +
    specialAllowance + bonus + overtime + otherEarnings;
  const grossSalary = basicSalary + totalAllowances;

  const absentDeduction      = (att.absent      ?? 0) * pd;
  const unpaidLeaveDeduction = (att.unpaidLeave  ?? 0) * pd;
  const halfDayDeduction     = (att.halfDay      ?? 0) * (pd / 2);

  const totalDeductions = professionalTax + pf + esi + tds + advance + loan + penalty +
    lateFine + otherDeductions + absentDeduction + unpaidLeaveDeduction + halfDayDeduction;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  // When payroll is locked, use stored values; otherwise use live calculated values
  const displayGross      = isGenerated ? (payrollData?.grossSalary      ?? 0) : grossSalary;
  const displayDeductions = isGenerated ? (payrollData?.totalDeductions   ?? 0) : totalDeductions;
  const displayNet        = isGenerated ? (payrollData?.netSalary         ?? 0) : netSalary;

  const hasAttendanceData = (att.present ?? 0) > 0 || (att.halfDay ?? 0) > 0 || (att.absent ?? 0) > 0;

  const handleGenerate = async () => {
    if (!basicSalary || basicSalary <= 0) return toast.error('Enter a valid basic salary');
    if (!window.confirm(
      `Generate payroll for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}?\n` +
      `Cycle: ${formatDateLabel(periodFrom)} → ${formatDateLabel(periodTo)}\n\nThis will lock it until deleted.`
    )) return;
    try {
      setGenerating(true);
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await api.post('/payroll/generate', {
        employeeId, month, year,
        basicSalary,
        // attendance stats — backend re-fetches live, these are informational for validation
        workingDays:  att.workingDays  ?? 0,
        presentDays:  att.present      ?? 0,
        absentDays:   att.absent       ?? 0,
        halfDays:     att.halfDay      ?? 0,
        paidLeaves:   att.paidLeave    ?? 0,
        unpaidLeaves: att.unpaidLeave  ?? 0,
        weeklyOffs:   att.weeklyOff    ?? 0,
        holidays:     att.holidays     ?? 0,
        lateMarks:    att.lateMarks    ?? 0,
        payableDays:  att.payableDays  ?? 0,
        hra, medicalAllowance, travelAllowance, foodAllowance,
        specialAllowance, bonus, overtime, otherEarnings,
        professionalTax, pf, esi, tds, advance, loan, penalty, lateFine, otherDeductions,
        adminId: adminInfo._id,
      });
      if (res.data.success) {
        toast.success('Payroll generated!');
        fetchAllData();
      }
    } catch (e) { toast.error(e.response?.data?.message || 'Error generating payroll'); }
    finally { setGenerating(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payroll record?')) return;
    try {
      setLoading(true);
      await api.delete(`/payroll/${id}`);
      toast.success('Payroll deleted');
      if (isGenerated && payrollData?._id === id) {
        setPayrollData(null);
        setIsGenerated(false);
      }
      fetchAllData();
    } catch { toast.error('Failed to delete'); }
    finally { setLoading(false); }
  };

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  if (loading && !payrollData && !attendanceSummary) return (
    <div className="flex justify-center items-center h-48">
      <Loader2 className="animate-spin text-primary w-8 h-8" />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header Controls ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex flex-wrap gap-4 items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
              <DollarSign size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-black text-slate-800">Payroll Calculator</h2>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                Payroll Month: <span className="text-slate-800">{monthName} {year}</span>
              </p>
              <div className="mt-2 inline-flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-xl px-3 py-1.5">
                <Calendar size={13} className="text-primary shrink-0" />
                <span className="text-[11px] font-black text-primary">{formatDateLabel(periodFrom)}</span>
                <ArrowRight size={12} className="text-primary/60" />
                <span className="text-[11px] font-black text-primary">{formatDateLabel(periodTo)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-border">
              <select value={month} onChange={e => setMonth(Number(e.target.value))} disabled={loading}
                className="bg-white rounded-lg text-sm font-semibold text-slate-700 px-3 py-2 border-none shadow-sm focus:ring-0 cursor-pointer">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading}
                className="bg-white rounded-lg text-sm font-semibold text-slate-700 px-3 py-2 border-none shadow-sm focus:ring-0 cursor-pointer">
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                Payroll Cycle: 21st → 20th
              </span>
              <button
                onClick={() => fetchAllData()}
                disabled={summaryLoading}
                title="Refresh attendance data"
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={summaryLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Attendance Summary — always live from backend ──────────────────── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Calendar size={14} /> Attendance — Auto-fetched for Payroll Period
          </h3>
          <div className="flex items-center gap-2">
            {summaryLoading && (
              <Loader2 size={13} className="animate-spin text-primary" />
            )}
            <span className="text-[10px] font-black text-primary bg-primary/8 border border-primary/15 rounded-lg px-2.5 py-1">
              {formatDateLabel(periodFrom)} → {formatDateLabel(periodTo)}
            </span>
          </div>
        </div>

        {/* No data warning */}
        {!summaryLoading && !hasAttendanceData && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={16} className="text-amber-500 shrink-0" />
            <p className="text-amber-700 text-sm font-medium">
              No attendance records found for this payroll period. Missing working days are counted as Absent.
            </p>
          </div>
        )}

        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
          <AttCard label="Working Days" value={att.workingDays} color="primary" icon={Briefcase} loading={summaryLoading} />
          <AttCard label="Present"      value={att.present}     color="green"   icon={Calendar} loading={summaryLoading} subtext={att.workingDays ? `${Math.round(((att.present ?? 0) / att.workingDays) * 100)}%` : '0%'} />
          <AttCard label="Absent"       value={att.absent}      color="red"     icon={Calendar} loading={summaryLoading} subtext={att.workingDays ? `${Math.round(((att.absent ?? 0) / att.workingDays) * 100)}%` : '0%'} />
          <AttCard label="Half Day"     value={att.halfDay}     color="teal"    icon={Clock}    loading={summaryLoading} subtext={att.workingDays ? `${Math.round(((att.halfDay ?? 0) / att.workingDays) * 100)}%` : '0%'} />
          <AttCard label="Paid Leave"   value={att.paidLeave}   color="blue"    icon={Plane}    loading={summaryLoading} />
          <AttCard label="Unpaid Leave" value={att.unpaidLeave} color="orange"  icon={Plane}    loading={summaryLoading} />
          <AttCard label="Weekly Off"   value={att.weeklyOff}   color="slate"   icon={Calendar} loading={summaryLoading} />
          <AttCard label="Holidays"     value={att.holidays}    color="indigo"  icon={Calendar} loading={summaryLoading} />
          <AttCard label="Late Marks"   value={att.lateMarks}   color="amber"   icon={AlertCircle} loading={summaryLoading} />
          <AttCard label="Payable Days" value={att.payableDays} color="green"   icon={CheckCircle2} loading={summaryLoading} subtext="Total Payable" />
        </div>

        {/* Payable days formula note */}
        {!summaryLoading && attendanceSummary && (
          <p className="mt-3 text-[10px] text-slate-400 font-medium">
            Payable Days = Present ({att.present ?? 0}) + Paid Leave ({att.paidLeave ?? 0}) +
            Holidays ({att.holidays ?? 0}) + Weekly Off ({att.weeklyOff ?? 0}) +
            Half Day × 0.5 ({att.halfDay ?? 0} × 0.5 = {((att.halfDay ?? 0) * 0.5).toFixed(1)})
            = <strong className="text-slate-600">{att.payableDays}</strong>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: Inputs ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Basic Salary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
              <DollarSign size={14} /> Basic Salary (Admin Editable)
            </h3>
            <div className="max-w-xs">
              <InputField label="Basic Salary" value={basicSalary} onChange={setBasicSalary} disabled={isGenerated} />
            </div>
            {isGenerated && (
              <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-emerald-700">
                <Lock size={14} />
                <p className="text-xs font-bold">Payroll is locked. Delete from history to regenerate.</p>
              </div>
            )}
          </div>

          {/* Earnings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-5 flex items-center gap-2">
              <TrendingUp size={14} /> Earnings &amp; Allowances
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InputField label="HRA"               value={hra}              onChange={setHra}              disabled={isGenerated} />
              <InputField label="Medical Allowance" value={medicalAllowance} onChange={setMedicalAllowance} disabled={isGenerated} />
              <InputField label="Travel Allowance"  value={travelAllowance}  onChange={setTravelAllowance}  disabled={isGenerated} />
              <InputField label="Food Allowance"    value={foodAllowance}    onChange={setFoodAllowance}    disabled={isGenerated} />
              <InputField label="Special Allowance" value={specialAllowance} onChange={setSpecialAllowance} disabled={isGenerated} />
              <InputField label="Bonus"             value={bonus}            onChange={setBonus}            disabled={isGenerated} />
              <InputField label="Overtime"          value={overtime}         onChange={setOvertime}          disabled={isGenerated} />
              <InputField label="Other Earnings"    value={otherEarnings}    onChange={setOtherEarnings}    disabled={isGenerated} />
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
              <span className="text-sm font-black text-slate-600">Total Allowances</span>
              <span className="font-black text-emerald-600 text-lg">{fmt(totalAllowances)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-5 flex items-center gap-2">
              <TrendingDown size={14} /> Deductions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InputField label="Professional Tax" value={professionalTax} onChange={setProfessionalTax} disabled={isGenerated} />
              <InputField label="PF"               value={pf}             onChange={setPf}             disabled={isGenerated} />
              <InputField label="ESI"              value={esi}            onChange={setEsi}            disabled={isGenerated} />
              <InputField label="TDS"              value={tds}            onChange={setTds}            disabled={isGenerated} />
              <InputField label="Advance"          value={advance}        onChange={setAdvance}        disabled={isGenerated} />
              <InputField label="Loan"             value={loan}           onChange={setLoan}           disabled={isGenerated} />
              <InputField label="Penalty"          value={penalty}        onChange={setPenalty}        disabled={isGenerated} />
              <InputField label="Late Fine"        value={lateFine}       onChange={setLateFine}       disabled={isGenerated} />
              <InputField label="Notice Period Recovery" value={otherDeductions} onChange={setOtherDeductions} disabled={isGenerated} />
            </div>

            {/* Auto-calculated attendance deductions */}
            {((att.absent ?? 0) > 0 || (att.unpaidLeave ?? 0) > 0 || (att.halfDay ?? 0) > 0) && (
              <div className="mt-4 bg-rose-50 border border-rose-100 rounded-xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">
                  Auto-Calculated from Attendance
                </p>
                {(att.absent ?? 0) > 0 && (
                  <div className="flex justify-between text-sm font-medium text-rose-700 py-0.5">
                    <span>Absent ({att.absent} days)</span><span>-{fmt(absentDeduction)}</span>
                  </div>
                )}
                {(att.unpaidLeave ?? 0) > 0 && (
                  <div className="flex justify-between text-sm font-medium text-rose-700 py-0.5">
                    <span>Unpaid Leave ({att.unpaidLeave} days)</span><span>-{fmt(unpaidLeaveDeduction)}</span>
                  </div>
                )}
                {(att.halfDay ?? 0) > 0 && (
                  <div className="flex justify-between text-sm font-medium text-rose-700 py-0.5">
                    <span>Half Day ({att.halfDay} days)</span><span>-{fmt(halfDayDeduction)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
              <span className="text-sm font-black text-slate-600">Total Deductions</span>
              <span className="font-black text-rose-600 text-lg">-{fmt(displayDeductions)}</span>
            </div>
          </div>
        </div>

        {/* ── Right: Summary Card ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 shadow-xl text-white sticky top-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Payroll Month</p>
            <p className="text-base font-black text-white mb-1">{monthName} {year}</p>

            <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-2 mb-6 w-fit">
              <Calendar size={12} className="text-slate-400 shrink-0" />
              <span className="text-[10px] font-black text-slate-300">{formatDateLabel(periodFrom)}</span>
              <ArrowRight size={10} className="text-slate-500" />
              <span className="text-[10px] font-black text-slate-300">{formatDateLabel(periodTo)}</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-slate-300 text-sm">Gross Salary</span>
                <span className="font-black">{fmt(displayGross)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-slate-300 text-sm">Total Deductions</span>
                <span className="font-black text-rose-400">-{fmt(displayDeductions)}</span>
              </div>
              <div className="pt-2">
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Net Payable</p>
                <p className="text-3xl font-black text-emerald-400">{fmt(displayNet)}</p>
              </div>
            </div>

            <div className="mt-6">
              {!isGenerated ? (
                <button
                  onClick={handleGenerate}
                  disabled={generating || loading || summaryLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-black rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {generating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Generate Payroll
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 justify-center bg-emerald-500/20 text-emerald-400 font-black text-sm py-2.5 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 size={15} /> Payroll Generated
                  </div>
                  <p className="text-center text-[10px] text-slate-500 font-medium">
                    View the full slip in the <span className="text-slate-300 font-black">Payslips</span> tab
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── History Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Payroll History</h3>
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  {['Payroll Month', 'Payroll Period', 'Basic', 'Gross', 'Deductions', 'Net Salary', 'Status', 'Action']
                    .map(h => <th key={h} className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4 whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map(r => {
                  const rStart = r.periodStart || getPayrollPeriod(r.month, r.year).periodStart;
                  const rEnd   = r.periodEnd   || getPayrollPeriod(r.month, r.year).periodEnd;
                  return (
                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4">
                        <span className="font-black text-slate-800 block">
                          {new Date(r.year, r.month - 1).toLocaleString('default', { month: 'long' })}
                        </span>
                        <span className="text-xs text-slate-500">{r.year}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 border border-border rounded-lg px-2 py-1 whitespace-nowrap">
                          <Calendar size={10} className="text-primary" />
                          {formatDateLabel(rStart)}
                          <ArrowRight size={9} className="text-slate-400" />
                          {formatDateLabel(rEnd)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-slate-600">{fmt(r.basicSalary)}</td>
                      <td className="py-3 pr-4 font-bold text-slate-800">{fmt(r.grossSalary)}</td>
                      <td className="py-3 pr-4 font-bold text-rose-600">-{fmt(r.totalDeductions || r.deduction || 0)}</td>
                      <td className="py-3 pr-4 font-black text-emerald-600 text-base">{fmt(r.netSalary)}</td>
                      <td className="py-3 pr-4">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase">{r.status}</span>
                      </td>
                      <td className="py-3">
                        <button onClick={() => handleDelete(r._id)}
                          className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 font-medium text-sm">No payroll history found.</div>
        )}
      </div>
    </div>
  );
};

export default PayrollTab;
