import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import {
  ArrowLeft, Calendar, Clock, FileText, Building, Hash, Check, X,
  CalendarDays, Briefcase, Award, Loader2, User, CheckCircle2, Circle,
  AlertCircle, ChevronRight, Mail
} from "lucide-react";

const AdminResignationDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchResignation = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/resignations/${id}`);
      if (res.data.success) setData(res.data.resignation);
      else setError("Could not load resignation details.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResignation(); }, [id]);

  const handleStatusUpdate = async (status, type = '60_DAYS') => {
    if (!window.confirm(`${status === "APPROVED" ? "Approve" : "Reject"} this resignation?`)) return;
    try {
      setActionLoading(status + type);
      
      let finalLastWorkingDay = null;
      if (status === 'APPROVED') {
         if (type === 'REQUESTED' && data.lastWorkingDay) {
            finalLastWorkingDay = data.lastWorkingDay;
         } else {
            const resDate = new Date(data.resignationDate);
            resDate.setDate(resDate.getDate() + 60);
            finalLastWorkingDay = resDate.toISOString();
         }
      }

      const res = await api.patch(`/admin/resignations/${id}`, { status, finalLastWorkingDay });
      if (res.data.success) setData(res.data.resignation);
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleChecklistUpdate = async (taskIndex, currentStatus) => {
    if (data.status !== "APPROVED") {
      alert("Checklist can only be updated after the resignation is approved.");
      return;
    }
    const newStatus = currentStatus === "Pending" ? "Completed" : "Pending";
    try {
      const res = await api.patch(`/admin/resignations/${id}/checklist`, { taskIndex, status: newStatus });
      if (res.data.success) setData(res.data.resignation);
    } catch (err) {
      alert("Failed to update checklist: " + (err.response?.data?.message || err.message));
    }
  };

  const fmtDate = (val) => val ? new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtDateTime = (val) => val ? new Date(val).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const getNoticeDays = () => {
    if (!data?.resignationDate) return { total: 0, elapsed: 0, remaining: 0 };
    const start = new Date(data.resignationDate);
    
    let end;
    if ((data.status === 'APPROVED' || data.status === 'COMPLETED')) {
       end = new Date(data.lastWorkingDay);
    } else {
       end = new Date(start.getTime() + 60 * 86400000);
    }
    
    const now = new Date();
    const total = Math.max(1, Math.round((end - start) / 86400000));
    const elapsed = Math.max(0, Math.min(total, Math.round((now - start) / 86400000)));
    return { total, elapsed, remaining: Math.max(0, total - elapsed), end };
  };

  if (loading) return (
    <AdminLayout hideHeader={true}>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-blue-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    </AdminLayout>
  );

  if (error || !data) return (
    <AdminLayout hideHeader={true}>
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle size={32} className="text-rose-400" />
        <p className="text-sm font-bold text-slate-600">{error || "Resignation not found."}</p>
        <button onClick={() => navigate("/admin/resignations")} className="text-xs font-bold text-blue-600 hover:underline">← Back to list</button>
      </div>
    </AdminLayout>
  );

  const emp = data.employeeId || {};
  const { total, elapsed, remaining, end } = getNoticeDays();
  const percentage = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  const avatar = emp.profileImage
    ? emp.profileImage
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName || "E")}&background=6366f1&color=fff&size=200`;

  const statusCfg = {
    PENDING:  { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200",  dot: "bg-amber-400"  },
    APPROVED: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", dot: "bg-emerald-500" },
    COMPLETED: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200", dot: "bg-indigo-500" },
    REJECTED: { bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-200",   dot: "bg-rose-500"   },
  };
  const sc = statusCfg[data.status] || statusCfg.PENDING;

  const exitChecklist = data.exitChecklist?.length > 0 ? data.exitChecklist : [
    { task: "Handover Documents", status: "Pending" },
    { task: "Return Company Assets", status: "Pending" },
    { task: "Clear Dues", status: "Pending" },
    { task: "Exit Interview", status: "Pending" },
    { task: "Final Settlement", status: "Pending" }
  ];
  const completedTasksCount = exitChecklist.filter(t => t.status === "Completed").length;

  return (
    <AdminLayout hideHeader={true}>
      <div className="max-w-[1500px] mx-auto space-y-4 pb-12">

        {/* ── Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/resignations")}
              className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors uppercase tracking-wider"
            >
              <ArrowLeft size={13} /> Back
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <h1 className="text-[13px] font-black text-slate-800 tracking-tight">Resignation Request</h1>
              <span className="text-[10px] font-bold text-slate-400">#{(id || "").slice(-6).toUpperCase()}</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${sc.bg} ${sc.text} ${sc.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
              {data.status}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5"><Clock size={12} />Submitted {fmtDate(data.createdAt || data.resignationDate)}</span>
            {data.status === "PENDING" && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button onClick={() => handleStatusUpdate("APPROVED", "60_DAYS")} disabled={!!actionLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-black transition-all disabled:opacity-50 shadow-sm shadow-emerald-200">
                  {actionLoading === "APPROVED60_DAYS" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve (60 Days)
                </button>
                {data.lastWorkingDay && (
                  <button onClick={() => handleStatusUpdate("APPROVED", "REQUESTED")} disabled={!!actionLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-black transition-all disabled:opacity-50 shadow-sm shadow-indigo-200">
                    {actionLoading === "APPROVEDREQUESTED" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve (As Requested)
                  </button>
                )}
                <button onClick={() => handleStatusUpdate("REJECTED")} disabled={!!actionLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[11px] font-black transition-all disabled:opacity-50 shadow-sm shadow-rose-200">
                  {actionLoading?.startsWith("REJECTED") ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Reject
                </button>
              </div>
            )}
            {data.status === "APPROVED" && completedTasksCount === exitChecklist.length && remaining === 0 && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button onClick={() => handleStatusUpdate("COMPLETED", "NOW")} disabled={!!actionLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-black transition-all disabled:opacity-50 shadow-sm shadow-indigo-200">
                  {actionLoading === "COMPLETEDNOW" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Mark as Completed
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* ── Col 1: Employee + Details ── */}
          <div className="space-y-4">

            {/* Employee Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-[#0B1426] via-[#1e3a5f] to-[#2563eb] relative flex items-center px-5 gap-3">
                <div className="absolute inset-0 opacity-20" style={{backgroundImage: "radial-gradient(circle at 80% 50%, #60a5fa 0%, transparent 60%)"}} />
                <div className="relative z-10">
                  <h2 className="text-[14px] font-black text-white leading-tight">{emp.fullName || "—"}</h2>
                  <p className="text-[11px] font-bold text-white/60">{emp.designation || "—"}</p>
                </div>
              </div>
              <div className="px-5 pb-5 pt-3 relative flex items-center gap-4">
                <img
                  src={avatar}
                  alt={emp.fullName}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-lg shrink-0"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName || "E")}&background=6366f1&color=fff&size=200`; }}
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><Hash size={11} className="text-slate-400 shrink-0" />{emp.empCode || "—"}</div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><Building size={11} className="text-slate-400 shrink-0" />{emp.department || "—"}</div>
                  {emp.email && <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-500 truncate"><Mail size={11} className="text-blue-400 shrink-0" />{emp.email}</div>}
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Resignation Details</h3>
              {[
                { icon: Calendar,     label: "Resignation Date", value: fmtDate(data.resignationDate) },
                { icon: CalendarDays, label: (data.status === 'APPROVED' || data.status === 'COMPLETED') ? "Approved Last Day" : "Requested Last Day",  value: fmtDate(data.lastWorkingDay) || "Not Requested" },
                { icon: FileText,     label: "Reason",            value: data.reason || "—"            },
                { icon: Clock,        label: "Submitted",         value: fmtDateTime(data.createdAt)   },
                ...(data.reviewedOn ? [{ icon: Check, label: "Reviewed On", value: fmtDateTime(data.reviewedOn) }] : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center shrink-0 mt-0.5"><Icon size={12} className="text-slate-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">{label}</p>
                    <p className="text-[12px] font-bold text-slate-700 leading-tight truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comments */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Comments</h3>
              <p className="text-[12px] font-medium text-slate-600 leading-relaxed">{data.comments || "No comments provided."}</p>
            </div>
          </div>

          {/* ── Col 2: Notice Period ── */}
          <div className="space-y-4">
            {/* Hero notice card */}
            <div className="bg-gradient-to-br from-[#0B1426] to-[#1e3a5f] rounded-2xl p-5 text-white relative overflow-hidden shadow-lg">
              <div className="absolute inset-0 opacity-30" style={{backgroundImage: "radial-gradient(circle at 80% 20%, #3b82f6 0%, transparent 60%)"}} />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3">Notice Period</p>
                <div className="flex items-end gap-6 mb-4">
                  <div>
                    <span className="text-5xl font-black text-white">{remaining}</span>
                    <span className="text-sm font-bold text-white/60 ml-1">days left</span>
                  </div>
                  <div className="pb-1.5 text-right">
                    <p className="text-[10px] font-bold text-white/40 uppercase">of {total} total</p>
                    <p className="text-[10px] font-bold text-white/40 uppercase">{elapsed} elapsed</p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-blue-400 rounded-full" style={{width: `${percentage}%`}} />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-white/40">
                  <span>{fmtDate(data.resignationDate)}</span>
                  <span>{percentage}% elapsed</span>
                  <span>{fmtDate(end)}</span>
                </div>
              </div>
            </div>

            {/* Progress ring */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Progress</h3>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-blue-500" strokeWidth="3.5" strokeDasharray={`${percentage}, 100`} stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-slate-800">{percentage}%</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">done</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5">
                  {[
                    { label: "Total Days",     value: total,     color: "text-slate-700" },
                    { label: "Days Elapsed",   value: elapsed,   color: "text-blue-600"  },
                    { label: "Days Remaining", value: remaining, color: "text-orange-500" },
                  ].map(({label, value, color}) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">{label}</span>
                      <span className={`text-[13px] font-black ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Dates */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Key Dates</h3>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0"><Check size={14} className="text-white" /></div>
                <div><p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Resignation Date</p><p className="text-[12px] font-black text-emerald-800">{fmtDate(data.resignationDate)}</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                <div className="w-8 h-8 rounded-lg bg-rose-400 flex items-center justify-center shrink-0"><CalendarDays size={14} className="text-white" /></div>
                <div><p className="text-[9px] font-black text-rose-600 uppercase tracking-wider">{(data.status === 'APPROVED' || data.status === 'COMPLETED') ? "Approved Notice End" : "60-Day Notice End"}</p><p className="text-[12px] font-black text-rose-800">{fmtDate(end)}</p></div>
              </div>
            </div>
          </div>

          {/* ── Col 3: Checklist + Docs ── */}
          <div className="space-y-4">
            {/* Exit Checklist */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Exit Checklist</h3>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">{completedTasksCount}/{exitChecklist.length} Done</span>
              </div>
              <div className="space-y-2">
                {exitChecklist.map((task, i) => {
                  const isCompleted = task.status === "Completed";
                  return (
                    <div 
                      key={i} 
                      onClick={() => handleChecklistUpdate(i, task.status)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors border border-transparent ${(data.status === "APPROVED" || data.status === "COMPLETED") ? 'cursor-pointer hover:bg-slate-50 hover:border-slate-200' : 'opacity-75 cursor-not-allowed'}`}
                      title={(data.status === "APPROVED" || data.status === "COMPLETED") ? "Click to toggle status" : "Approve resignation first to update checklist"}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                        {isCompleted && <Check size={10} className="text-white" />}
                      </div>
                      <span className={`text-[12px] font-semibold flex-1 transition-colors ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{task.task}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide ${isCompleted ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                        {task.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Documents After Exit</h3>
              <div className="space-y-2">
                {[
                  { icon: Award,    label: "Experience Letter",  color: "text-violet-500 bg-violet-50" },
                  { icon: FileText, label: "Relieving Letter",   color: "text-blue-500 bg-blue-50"    },
                  { icon: Briefcase,label: "Final Settlement",   color: "text-emerald-500 bg-emerald-50" },
                ].map(({icon: Icon, label, color}) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}><Icon size={15} /></div>
                    <span className="text-[12px] font-bold text-slate-700 flex-1">{label}</span>
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                ))}
              </div>
            </div>

            {/* Goodbye card */}
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-5 text-center text-white shadow-lg shadow-blue-200">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3"><Briefcase size={22} className="text-white" /></div>
              <p className="text-[12px] font-bold leading-relaxed opacity-90 italic">"We wish you the best for your future endeavors! ✨"</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminResignationDetails;


