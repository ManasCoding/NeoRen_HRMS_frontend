import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { MapPin, Clock, CheckCircle2, User, Calendar, AlertCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import SiteVisitDetailModal from './SiteVisitDetailModal';

const ActiveView = () => {
  const [allVisits, setAllVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const res = await api.get('/site-visits');
      setAllVisits(res.data.siteVisits || []);
    } catch (error) {
      console.error('Failed to fetch visits', error);
      toast.error('Failed to fetch visits');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-10 text-center text-slate-400 font-bold text-sm">Loading ongoing and completed visits...</div>;

  const ongoingVisits = allVisits.filter(v => v.status === 'Active' || v.status === 'Approved');
  const completedVisits = allVisits.filter(v => v.status === 'Completed');

  return (
    <div className="space-y-8">
      
      {/* Ongoing / Active Site Visits Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <h3 className="text-xl font-black text-slate-800">Ongoing & Active Site Visits ({ongoingVisits.length})</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {ongoingVisits.map(visit => {
            const empName = visit.employeeId?.fullName || `${visit.employeeId?.firstName || ''} ${visit.employeeId?.lastName || ''}`.trim() || visit.employeeName || 'Employee';
            const empCode = visit.employeeId?.empCode || visit.employeeId?.employeeId || '—';
            const avatarImg = visit.employeeId?.profileImage || visit.employeeId?.profilePicture;

            return (
              <div 
                key={visit._id} 
                onClick={() => setSelectedVisit(visit)}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden space-y-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600 border border-slate-200 overflow-hidden shrink-0">
                      {avatarImg ? (
                        <img src={avatarImg} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                      ) : (
                        empName.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{empName}</h4>
                      <p className="text-[10px] font-bold text-slate-400">{empCode}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-[9px] font-black bg-emerald-100 text-emerald-700 rounded-full uppercase tracking-widest border border-emerald-200">
                    {visit.status === 'Active' ? 'ONGOING' : 'APPROVED'}
                  </span>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-black text-sm text-slate-800">{visit.clientName}</p>
                      <p className="text-slate-500 text-xs font-bold">{visit.siteName}</p>
                      <p className="text-slate-400 text-[10px]">{visit.siteAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="flex items-center gap-1.5 font-bold"><Calendar size={14} className="text-blue-500" /> Start Date: {visit.startDate}</span>
                    {visit.startTime && (
                      <span className="flex items-center gap-1.5 font-bold"><Clock size={14} className="text-emerald-500" /> Time: {visit.startTime}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {ongoingVisits.length === 0 && (
            <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-bold text-sm">
              No employees currently on active site visits.
            </div>
          )}
        </div>
      </div>

      {/* Completed Site Visits Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 size={20} className="text-purple-600" />
          <h3 className="text-xl font-black text-slate-800">Completed Site Visits ({completedVisits.length})</h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-100">
                {completedVisits.map(visit => {
                  const empName = visit.employeeId?.fullName || `${visit.employeeId?.firstName || ''} ${visit.employeeId?.lastName || ''}`.trim() || visit.employeeName || 'Employee';
                  const empCode = visit.employeeId?.empCode || visit.employeeId?.employeeId || '—';
                  const avatarImg = visit.employeeId?.profileImage || visit.employeeId?.profilePicture;
                  const completedTimeStr = visit.completedAt ? new Date(visit.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

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
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">
                        <p>{visit.startDate}</p>
                        {visit.startTime && <p className="text-emerald-600">{visit.startTime}</p>}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">
                        {completedTimeStr}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 text-xs font-black text-purple-700 bg-purple-50 rounded-xl border border-purple-100">
                          {visit.timeTaken || 'Completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                          COMPLETED
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedVisit(visit); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" 
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {completedVisits.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-slate-400 font-bold text-sm">
                      No completed site visits yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedVisit && (
        <SiteVisitDetailModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />
      )}

    </div>
  );
};

export default ActiveView;
