import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { Eye, Check, X, Clock, MapPin, Calendar, User } from 'lucide-react';
import SiteVisitDetailModal from './SiteVisitDetailModal';

const RequestsView = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [processingId, setProcessingId] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const res = await api.get('/site-visits');
      setVisits(res.data.siteVisits || []);
    } catch (error) {
      toast.error('Failed to fetch visits');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, e) => {
    if (e) e.stopPropagation();
    try {
      setProcessingId(id);
      const endpoint = action === 'approve' ? `/site-visits/${id}/approve` : `/site-visits/${id}/reject`;
      const payload = action === 'reject' ? { rejectionReason: 'Admin decision' } : {};
      
      const user = JSON.parse(localStorage.getItem('user'));
      payload.adminId = user?.id;

      await api.post(endpoint, payload);
      toast.success(`Visit request ${action}d successfully`);
      fetchVisits();
    } catch (error) {
      toast.error(`Failed to ${action} visit`);
    } finally {
      setProcessingId(null);
    }
  };

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

  const filteredVisits = filterStatus === 'All'
    ? visits
    : visits.filter(v => v.status === filterStatus);

  if (loading) return <div className="py-10 text-center text-slate-400 font-bold text-sm">Loading requests...</div>;

  return (
    <div className="space-y-6">
      
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 tracking-tight">All Site Visits</h3>
        <div className="flex flex-wrap gap-2">
          {['All', 'Active', 'Completed', 'Rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                filterStatus === status
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status} {status === 'All' ? `(${visits.length})` : `(${visits.filter(v => v.status === status).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client & Site</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Time Taken</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVisits.map(visit => {
                const empName = visit.employeeId?.fullName || `${visit.employeeId?.firstName || ''} ${visit.employeeId?.lastName || ''}`.trim() || visit.employeeName || 'Employee';
                const empCode = visit.employeeId?.empCode || visit.employeeId?.employeeId || '—';
                const avatarImg = visit.employeeId?.profileImage || visit.employeeId?.profilePicture;

                return (
                  <tr 
                    key={visit._id} 
                    onClick={() => setSelectedVisit(visit)}
                    className="hover:bg-slate-50 transition-all cursor-pointer group"
                    title="Click to view full form details"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600 border border-slate-200 overflow-hidden shrink-0">
                          {avatarImg ? (
                            <img src={avatarImg} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                          ) : (
                            empName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{empName}</p>
                          <p className="text-[10px] font-bold text-slate-400">{empCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-900">{visit.clientName}</p>
                      <p className="text-xs font-bold text-slate-500">{visit.siteName}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{visit.siteAddress}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5 text-xs font-bold text-slate-600">
                        <p className="flex items-center gap-1"><Calendar size={12} className="text-blue-500" /> {visit.startDate}</p>
                        {visit.startTime && (
                          <p className="flex items-center gap-1"><Clock size={12} className="text-emerald-500" /> {visit.startTime}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700 max-w-xs truncate">
                      {visit.purpose}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-block px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${getStatusBadge(visit.status)}`}>
                          {visit.status === 'Active' ? 'Ongoing / Active' : visit.status}
                        </span>
                        {visit.status === 'Completed' && (
                          <p className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                            Time Taken: {visit.timeTaken || 'Completed'}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedVisit(visit)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Full Form Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredVisits.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                    No site visit requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedVisit && (
        <SiteVisitDetailModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />
      )}

    </div>
  );
};

export default RequestsView;
