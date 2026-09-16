import React from 'react';
import { X, Calendar, Clock, MapPin, Building2, User, Phone, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const SiteVisitDetailModal = ({ visit, onClose }) => {
  if (!visit) return null;

  const empName = visit.employeeId?.fullName || `${visit.employeeId?.firstName || ''} ${visit.employeeId?.lastName || ''}`.trim() || visit.employeeName || 'Employee';
  const empCode = visit.employeeId?.empCode || visit.employeeId?.employeeId || '—';
  const avatarImg = visit.employeeId?.profileImage || visit.employeeId?.profilePicture;
  const dept = visit.employeeId?.department || '—';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Completed': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const workSummary = visit.dailyRecords && visit.dailyRecords.length > 0 
    ? visit.dailyRecords[visit.dailyRecords.length - 1]?.workSummary
    : null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 my-6" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 md:p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest border ${getStatusBadge(visit.status)}`}>
                {visit.status === 'Active' ? 'Ongoing / Active' : visit.status}
              </span>
              <span className="text-xs text-slate-400 font-medium">Submitted Form Details</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black mt-2 text-white">{visit.clientName}</h3>
            <p className="text-blue-400 text-xs font-bold mt-0.5">{visit.siteName}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/10 text-slate-300 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          
          {/* Employee Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-black text-sm text-slate-700 border-2 border-white shadow-sm overflow-hidden shrink-0">
              {avatarImg ? (
                <img src={avatarImg} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
              ) : (
                empName.charAt(0)
              )}
            </div>
            <div>
              <h4 className="font-black text-base text-slate-900">{empName}</h4>
              <p className="text-xs font-bold text-slate-500">ID: {empCode} • Department: {dept}</p>
            </div>
          </div>

          {/* Form Fields Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Building2 size={14} className="text-blue-500" /> Client / Company Name
              </p>
              <p className="text-sm font-black text-slate-800">{visit.clientName}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-500" /> Site Name
              </p>
              <p className="text-sm font-black text-slate-800">{visit.siteName}</p>
            </div>

            <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin size={14} className="text-purple-500" /> Site Address
              </p>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">{visit.siteAddress}</p>
            </div>

            <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText size={14} className="text-amber-500" /> Purpose of Visit
              </p>
              <p className="text-sm font-bold text-slate-800">{visit.purpose}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-500" /> Start Date
              </p>
              <p className="text-sm font-black text-slate-800">{visit.startDate}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-500" /> Start Time
              </p>
              <p className="text-sm font-black text-slate-800">{visit.startTime || '—'}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <User size={14} className="text-violet-500" /> Contact Person
              </p>
              <p className="text-sm font-bold text-slate-800">{visit.contactPerson || 'Not provided'}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Phone size={14} className="text-rose-500" /> Contact Number
              </p>
              <p className="text-sm font-bold text-slate-800">{visit.contactNumber || 'Not provided'}</p>
            </div>

          </div>

          {/* Visit Completion & Time Details (If Active / Completed) */}
          {(visit.status === 'Completed' || visit.status === 'Active' || visit.approvedAt) && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100 space-y-3">
              <h4 className="text-xs font-black text-purple-900 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={16} className="text-purple-600" /> Visit Timing Breakdown
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Approval / Active Time</p>
                  <p className="text-xs font-black text-slate-800">
                    {visit.approvedAt ? new Date(visit.approvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">End Visit Time</p>
                  <p className="text-xs font-black text-slate-800">
                    {visit.completedAt ? new Date(visit.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Time Taken</p>
                  <p className="text-xs font-black text-purple-700">
                    {visit.timeTaken || 'In Progress'}
                  </p>
                </div>
              </div>

              {workSummary && (
                <div className="pt-2 border-t border-purple-100/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Work Summary Logged</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{workSummary}</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};

export default SiteVisitDetailModal;
