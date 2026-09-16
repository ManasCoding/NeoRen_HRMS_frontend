import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { CheckCircle2, XCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import api from '../services/api';
import SearchHeader from '../components/SearchHeader';

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const admin = JSON.parse(localStorage.getItem('user')) || {};

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/admin/leaves');
      if (res.data.success) {
        setLeaves(res.data.leaves);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);


  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id);
    try {
      const payload = { status };
      if (admin.id || admin._id) {
        payload.approvedBy = admin.id || admin._id;
      }
      
      const res = await api.patch(`/admin/leaves/${id}`, payload);
      if (res.data.success) {
        fetchLeaves();
      } else {
        throw new Error(res.data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    pending: leaves.filter(l => l.status === 'PENDING').length,
    approved: leaves.filter(l => l.status === 'APPROVED').length,
    rejected: leaves.filter(l => l.status === 'REJECTED').length,
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = leave.employeeId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.employeeId?.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.leaveType?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || leave.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout title="Leave Management" subtitle="Review and process employee leave applications.">
      <SearchHeader 
        title="Leave Requests"
        subtitle="Manage and review employee leave applications."
        count={leaves.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search by employee or leave type..."
        filterOptions={['All', 'PENDING', 'APPROVED', 'REJECTED']}
        filterValue={filterStatus}
        onFilterChange={setFilterStatus}
      />

      <div className="bg-surface rounded-[32px] border-t-4 border-emerald-500 shadow-sm overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-border">
                <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Applicant</th>
                <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Leave Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Date Range</th>
                <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Days</th>
                <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Reason</th>
                <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Applied On</th>
                <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="8" className="px-8 py-10 h-24 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle size={40} className="text-slate-200" />
                      <p className="text-slate-400 font-bold">No leave requests found matching your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((request) => (
                  <tr key={request._id} className="hover:bg-slate-50 transition-colors group ">
                    <td className="px-2 py-6 ">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-text-main">{request.employeeId?.fullName}</span>
                        <span className="text-[10px] font-bold text-text-muted uppercase">{request.employeeId?.empCode}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-tight">
                        {request.leaveType}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs font-black text-text-main uppercase tracking-tighter">
                      {new Date(request.fromDate).toLocaleDateString()} — {new Date(request.toDate).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-text-main">{request.days}</td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-text-muted font-medium max-w-[200px] truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all duration-300">
                        {request.reason}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        request.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        request.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-100'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-bold text-text-muted uppercase">
                      {new Date(request.appliedOn).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        {request.status === 'PENDING' ? (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(request._id, 'APPROVED')}
                              disabled={actionLoading === request._id}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(request._id, 'REJECTED')}
                              disabled={actionLoading === request._id}
                              className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-95 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Processed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="bg-white p-8 rounded-[32px] border border-border shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-all">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">Pending Requests</p>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight">{stats.pending}</h4>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-border shadow-sm flex items-center gap-6 group hover:border-emerald-200 transition-all">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">Approved Total</p>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight">{stats.approved}</h4>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-border shadow-sm flex items-center gap-6 group hover:border-rose-200 transition-all">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <XCircle size={28} />
          </div>
          <div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">Rejected Total</p>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight">{stats.rejected}</h4>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLeaves;
