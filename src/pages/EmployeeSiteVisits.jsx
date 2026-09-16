import React, { useEffect, useState } from 'react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, MapPin, Clock, CheckCircle2, AlertCircle, StopCircle, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeSiteVisits = () => {
  const { employeeSlug } = useParams();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVisit, setActiveVisit] = useState(null);
  const [processing, setProcessing] = useState(false);
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const res = await api.get(`/site-visits/employee/${user.id}`);
      const data = res.data.siteVisits || [];
      setVisits(data);
      
      const active = data.find(v => v.status === 'Active' || v.status === 'Approved');
      setActiveVisit(active || null);
    } catch (error) {
      console.error('Error fetching site visits', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVisit = async (visitId) => {
    try {
      setProcessing(true);
      await api.post(`/site-visits/${visitId}/check-in`);
      toast.success('Site visit started');
      fetchVisits();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start visit');
    } finally {
      setProcessing(false);
    }
  };

  const handleEndVisit = async (visitId) => {
    try {
      setProcessing(true);
      await api.post(`/site-visits/${visitId}/check-out`, { workSummary: 'Completed site visit work' });
      toast.success('Site visit ended and marked as Completed');
      fetchVisits();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end visit');
    } finally {
      setProcessing(false);
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

  return (
    <EmployeeLayout title="Site Visits" subtitle="Manage your field work and track site visits">
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">My Site Visits</h2>
            <p className="text-slate-500 text-xs font-bold mt-1">Submit requests and manage ongoing visits</p>
          </div>
          <Link 
            to={`/employee/${employeeSlug}/site-visits/request`}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={16} />
            New Visit Request
          </Link>
        </div>

        {/* Active / Approved Visit Hero Banner */}
        {activeVisit && (
          <div className="bg-gradient-to-br from-[#0B1426] to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <MapPin size={160} />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border ${getStatusBadge(activeVisit.status)}`}>
                    Visit Ongoing / Active
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white">{activeVisit.clientName}</h3>
                <p className="text-blue-400 font-bold text-sm">{activeVisit.siteName} — {activeVisit.siteAddress}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-2 font-medium">
                  <span className="flex items-center gap-1.5"><Clock size={14} className="text-amber-400" /> Start Date: {activeVisit.startDate}</span>
                  {activeVisit.startTime && (
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-emerald-400" /> Start Time: {activeVisit.startTime}</span>
                  )}
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-purple-400" /> Purpose: {activeVisit.purpose}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 shrink-0 min-w-[200px]">
                <button 
                  disabled={processing}
                  onClick={() => handleEndVisit(activeVisit._id)}
                  className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <StopCircle size={18} />
                  End Visit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-800">Visit History & Requests</h3>
            <p className="text-slate-400 text-xs font-bold mt-0.5">All submitted site visits and completed work logs</p>
          </div>

          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-10 text-center text-slate-400 font-bold text-sm">Loading visits...</div>
            ) : visits.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-bold text-sm">
                No site visit requests found. Click "New Visit Request" above to submit one.
              </div>
            ) : (
              visits.map(visit => (
                <div key={visit._id} className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-slate-50/50 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-base text-slate-800">{visit.clientName}</h4>
                      <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest border ${getStatusBadge(visit.status)}`}>
                        {visit.status === 'Active' || visit.status === 'Approved' ? 'Active / Ongoing' : visit.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500">
                      {visit.siteName} • {visit.siteAddress}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 font-medium">
                      <span><span className="font-bold text-slate-600">Date:</span> {visit.startDate}</span>
                      {visit.startTime && <span><span className="font-bold text-slate-600">Time:</span> {visit.startTime}</span>}
                      <span><span className="font-bold text-slate-600">Purpose:</span> {visit.purpose}</span>
                      {visit.status === 'Completed' && (
                        <span className="text-emerald-600 font-black bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                          Time Taken: {visit.timeTaken || 'Completed'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {(visit.status === 'Active' || visit.status === 'Approved') && (
                      <button
                        disabled={processing}
                        onClick={() => handleEndVisit(visit._id)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        End Visit
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </EmployeeLayout>
  );
};

export default EmployeeSiteVisits;
