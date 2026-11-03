import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, Calendar, Clock, ClipboardCheck,
  Wallet, FileText, Download, Mail, Phone, MapPin,
  AlertCircle, Briefcase, FileSignature, CircleDashed, User,
  CalendarDays, Check, ChevronRight, Loader2
} from "lucide-react";
import api from "../services/api";
import EmployeeLayout from "../layouts/EmployeeLayout";

const EmployeeResignationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resignation, setResignation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResignationDetails = async () => {
      try {
        if (id === "test") {
          setResignation({
            _id: "mock12345678901234567890",
            resignationDate: new Date().toISOString(),
            lastWorkingDay: new Date(Date.now() + 60 * 86400000).toISOString(),
            reason: "Better Career Opportunity",
            comments: "Testing the details page layout.",
            attachment: "https://example.com/mock.pdf",
            status: "APPROVED",
            submittedOn: new Date().toISOString(),
            reviewedOn: new Date().toISOString(),
            exitChecklist: [
              { task: "Handover Documents", status: "Completed" },
              { task: "Return Company Assets", status: "Pending" },
              { task: "Clear Dues", status: "Pending" },
              { task: "Exit Interview", status: "Pending" },
              { task: "Final Settlement", status: "Pending" }
            ]
          });
          setLoading(false);
          return;
        }
        const res = await api.get(`/employee/resignations/detail/${id}`);
        if (res.data.success) setResignation(res.data.resignation);
        else setError(res.data.message || "Failed to fetch details");
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResignationDetails();
  }, [id]);

  if (loading) return (
    <EmployeeLayout title="" subtitle="" hideHeader={true}>
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={28} className="animate-spin text-blue-600" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading...</p>
      </div>
    </EmployeeLayout>
  );

  if (error || !resignation) return (
    <EmployeeLayout title="" subtitle="" hideHeader={true}>
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle size={32} className="text-rose-400" />
        <p className="text-[13px] font-bold text-slate-600">{error || "Not found"}</p>
        <button onClick={() => navigate(-1)} className="text-[11px] font-bold text-blue-600 hover:underline">Go back</button>
      </div>
    </EmployeeLayout>
  );

  const resDate = new Date(resignation.resignationDate);
  
  let lwd;
  if ((resignation.status === 'APPROVED' || resignation.status === 'COMPLETED')) {
    lwd = new Date(resignation.lastWorkingDay);
  } else {
    lwd = new Date(resDate.getTime() + 60 * 86400000);
  }

  const today = new Date();
  const noticePeriodTotal = Math.max(1, Math.round((lwd - resDate) / 86400000));
  const daysCompleted = Math.max(0, Math.min(noticePeriodTotal, Math.round((today - resDate) / 86400000)));
  const daysRemaining = Math.max(0, noticePeriodTotal - daysCompleted);
  const progressPercent = Math.round((daysCompleted / noticePeriodTotal) * 100);

  const fmtDate = (d) => !d ? "—" : new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const fmtDateTime = (d) => !d ? "—" : new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const statusCfg = {
    APPROVED: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle2 },
    COMPLETED: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200", dot: "bg-indigo-500", icon: CheckCircle2 },
    PENDING:  { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200",   dot: "bg-amber-400",  icon: Clock },
    REJECTED: { bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-200",    dot: "bg-rose-500",   icon: AlertCircle },
  };
  const sc = statusCfg[resignation.status] || statusCfg.PENDING;
  const StatusIcon = sc.icon;

  const timelineSteps = [
    { title: "Resignation Submitted",   desc: "Your request was submitted to HR",                 date: fmtDate(resignation.submittedOn),  done: true,  active: false },
    { title: "Under Admin Review",      desc: "Admin is reviewing your request",                  date: resignation.status !== "PENDING" ? fmtDate(resignation.reviewedOn) : "Pending", done: resignation.status !== "PENDING", active: resignation.status === "PENDING" },
    { title: resignation.status === "REJECTED" ? "Resignation Rejected" : "Resignation Approved", desc: resignation.status === "REJECTED" ? "Your resignation was rejected" : "Resignation approved by admin", date: resignation.reviewedOn ? fmtDate(resignation.reviewedOn) : "—", done: (resignation.status === "APPROVED" || resignation.status === "COMPLETED") || resignation.status === "REJECTED", active: false },
    { title: "Notice Period Running",   desc: `${fmtDate(resDate)} ? ${fmtDate(lwd)}`,           date: `${daysCompleted}/${noticePeriodTotal} days`, done: daysRemaining === 0 && (resignation.status === "APPROVED" || resignation.status === "COMPLETED"), active: daysRemaining > 0 && (resignation.status === "APPROVED" || resignation.status === "COMPLETED") },
    { title: "Exit Formalities",        desc: "Complete handover & exit process",                 date: "—", done: false, active: daysRemaining === 0 && (resignation.status === "APPROVED" || resignation.status === "COMPLETED") },
    { title: "Separation Complete",     desc: "All formalities completed",                        date: "—", done: false, active: false },
  ];

  const exitChecklist = resignation.exitChecklist?.length > 0 ? resignation.exitChecklist : [
    { task: "Handover Documents", status: "Pending" },
    { task: "Return Company Assets", status: "Pending" },
    { task: "Clear Dues", status: "Pending" },
    { task: "Exit Interview", status: "Pending" },
    { task: "Final Settlement", status: "Pending" }
  ];
  
  const completedTasksCount = exitChecklist.filter(t => t.status === "Completed").length;
  const allTasksCompleted = exitChecklist.length > 0 && completedTasksCount === exitChecklist.length;

  return (
    <EmployeeLayout title="" subtitle="" hideHeader={true}>
      <div className="max-w-6xl mx-auto pb-10 space-y-4">

        {/* -- Page Header -- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors uppercase tracking-wider">
              <ArrowLeft size={13} /> Back
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <div>
              <h1 className="text-[14px] font-black text-slate-800 leading-tight">Resignation Details</h1>
              <p className="text-[10px] font-medium text-slate-400">RES-{(resignation._id || "").toString().slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${sc.bg} ${sc.text} ${sc.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
            {resignation.status}
          </span>
        </div>

        {/* -- Stat Cards Row -- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Status",         val: resignation.status.charAt(0) + resignation.status.slice(1).toLowerCase(), sub: "Current",              color: "text-emerald-600 bg-emerald-50",  icon: StatusIcon },
            { label: "Days Remaining", val: `${daysRemaining}`,   sub: "Till last working day",   color: "text-blue-600 bg-blue-50",     icon: Calendar },
            { label: "Notice Period",  val: `${daysCompleted}/${noticePeriodTotal}`, sub: "Days completed",   color: "text-indigo-600 bg-indigo-50", icon: CircleDashed },
            { label: "Settlement",     val: allTasksCompleted ? "In Progress" : "Pending", sub: "After exit", color: allTasksCompleted ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50",    icon: Wallet },
          ].map(({ label, val, sub, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}><Icon size={16} /></div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-[13px] font-black text-slate-800 leading-tight truncate">{val}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* -- Main Grid -- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* -- Left: Info + Checklist -- */}
          <div className="lg:col-span-2 space-y-4">

            {/* Resignation Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Resignation Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-50">
                {[
                  { label: "Request ID",       val: `RES-${(resignation._id || "").toString().slice(-6).toUpperCase()}`, color: "text-blue-600" },
                  { label: "Resignation Date", val: fmtDate(resignation.resignationDate) },
                  { label: (resignation.status === 'APPROVED' || resignation.status === 'COMPLETED') ? "Approved Last Day" : "Requested Last Day", val: fmtDate(resignation.lastWorkingDay) || "Not Requested" },
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className={`text-[12px] font-black ${color || "text-slate-800"}`}>{val}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Reason</p>
                  <p className="text-[12px] font-bold text-slate-700">{resignation.reason || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Submitted On</p>
                  <p className="text-[12px] font-bold text-slate-700">{fmtDateTime(resignation.submittedOn || resignation.createdAt)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Comments</p>
                  <p className="text-[12px] font-medium text-slate-600 leading-relaxed">{resignation.comments || "No comments provided."}</p>
                </div>
              </div>
              {resignation.attachment && (
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Attachment</p>
                  <a href={resignation.attachment} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-500 flex items-center justify-center shrink-0"><FileText size={15} /></div>
                    <div><p className="text-[12px] font-bold text-slate-700">resignation_letter.pdf</p><p className="text-[10px] text-slate-400">Document</p></div>
                    <Download size={14} className="text-blue-500 ml-4" />
                  </a>
                </div>
              )}
              {(resignation.status === "APPROVED" || resignation.status === "COMPLETED") && resignation.reviewedOn && (
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><Check size={15} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Approved On</p>
                    <p className="text-[12px] font-bold text-slate-700">{fmtDateTime(resignation.reviewedOn)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Exit Checklist + HR Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Exit Checklist */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Exit Checklist</h3>
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">{completedTasksCount}/{exitChecklist.length} Done</span>
                </div>
                <div className="space-y-2">
                  {exitChecklist.map((task, i) => {
                    const isCompleted = task.status === "Completed";
                    return (
                      <div key={i} className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                          {isCompleted && <Check size={8} className="text-white" />}
                        </div>
                        <span className={`text-[12px] font-semibold flex-1 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{task.task}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {task.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* HR Contact */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">HR Contact</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-black shrink-0">PN</div>
                  <div>
                    <p className="text-[12px] font-black text-slate-800">Priyanka Nayak</p>
                    <p className="text-[10px] font-medium text-slate-400">HR Manager</p>
                  </div>
                </div>
                <div className="space-y-2 text-[11px] font-medium flex-1">
                  <div className="flex items-center gap-2 text-blue-600"><Mail size={12} />official@neoren.com</div>
                  <div className="flex items-center gap-2 text-slate-600"><Phone size={12} />+91 9124670012</div>
                  <div className="flex items-center gap-2 text-slate-600"><MapPin size={12} />HR Department</div>
                </div>
                <a href="mailto:official@neoren.com" className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-blue-100 text-blue-600 text-[11px] font-bold hover:bg-blue-50 transition-colors">
                  <Mail size={12} /> Send Email
                </a>
              </div>
            </div>

            {/* After Exit Docs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Documents After Exit</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { icon: "??", label: "Experience Letter", color: "bg-violet-50 border-violet-100" },
                  { icon: "??", label: "Relieving Letter",  color: "bg-blue-50 border-blue-100"   },
                  { icon: "??", label: "Final Settlement",  color: "bg-emerald-50 border-emerald-100" },
                ].map(({ icon, label, color }) => (
                  <div key={label} className={`flex items-center gap-2.5 p-3 rounded-xl border ${color}`}>
                    <span className="text-lg">{icon}</span>
                    <span className="text-[11px] font-bold text-slate-700">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* -- Right: Progress + Timeline -- */}
          <div className="space-y-4">

            {/* Notice Period Hero */}
            <div className="bg-gradient-to-br from-[#0B1426] to-[#1e3a5f] rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{backgroundImage: "radial-gradient(circle at 80% 20%, #3b82f6 0%, transparent 60%)"}} />
              <div className="relative z-10">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-3">Notice Period</p>
                <div className="flex items-end gap-3 mb-3">
                  <span className="text-4xl font-black">{daysRemaining}</span>
                  <span className="text-[11px] font-bold text-white/60 mb-1">days left</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-blue-400 rounded-full" style={{width: `${progressPercent}%`}} />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-white/30">
                  <span>{fmtDate(resDate)}</span>
                  <span>{progressPercent}%</span>
                  <span>{fmtDate(lwd)}</span>
                </div>
              </div>
            </div>

            {/* Progress Ring */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Progress</h3>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-blue-500" strokeWidth="3.5" strokeDasharray={`${progressPercent}, 100`} stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[15px] font-black text-slate-800">{progressPercent}%</span>
                    <span className="text-[7px] font-bold text-slate-400 uppercase">done</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    { label: "Total",     val: noticePeriodTotal, color: "text-slate-700"  },
                    { label: "Elapsed",   val: daysCompleted,     color: "text-blue-600"   },
                    { label: "Remaining", val: daysRemaining,     color: "text-orange-500" },
                  ].map(({label, val, color}) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400">{label}</span>
                      <span className={`text-[12px] font-black ${color}`}>{val}d</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Timeline</h3>
              <div className="relative">
                <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-100" />
                <div className="space-y-4">
                  {timelineSteps.map((step, i) => (
                    <div key={i} className="flex gap-3 relative">
                      <div className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shrink-0 z-10 mt-0.5 ${
                        step.done ? "bg-emerald-500 shadow-sm shadow-emerald-200" :
                        step.active ? "bg-blue-500 shadow-sm shadow-blue-200" :
                        "bg-slate-200"
                      }`}>
                        {step.done && <Check size={9} className="text-white" />}
                        {step.active && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <p className={`text-[11px] font-black leading-tight ${step.done || step.active ? "text-slate-800" : "text-slate-400"}`}>{step.title}</p>
                        <p className="text-[10px] font-medium text-slate-400 leading-snug mt-0.5">{step.desc}</p>
                        {step.date && step.date !== "—" && (
                          <p className="text-[9px] font-bold text-slate-300 mt-0.5">{step.date}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeResignationDetails;


