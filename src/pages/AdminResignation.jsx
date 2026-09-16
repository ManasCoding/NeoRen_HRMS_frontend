import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { 
  FileText, 
  Clock, 
  CheckSquare, 
  XCircle, 
  CalendarCheck, 
  Search, 
  Download, 
  Filter,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ITEMS_PER_PAGE = 8;

const AdminResignation = () => {
  const [resignations, setResignations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id of row being actioned
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const [dateFilter, setDateFilter] = useState('');

  const fetchResignations = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All Status') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (dateFilter) params.date = dateFilter;

      const res = await api.get('/admin/resignations', { params });
      if (res.data.success) {
        setResignations(res.data.resignations || []);
        setStats(res.data.stats || { total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 });
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Failed to fetch resignations:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, dateFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchResignations();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchResignations]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setActionLoading(id + newStatus);
      await api.patch(`/admin/resignations/${id}`, { status: newStatus });
      await fetchResignations();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Pagination
  const totalPages = Math.ceil(resignations.length / ITEMS_PER_PAGE);
  const paginated = resignations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <AdminLayout 
      title="Resignation Management" 
      subtitle="Review and manage resignation requests"
    >
      <div className="space-y-6">
        
        {/* Top Controls: Filters, Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm cursor-pointer"
            >
              <option>All Status</option>
              <option>PENDING</option>
              <option>APPROVED</option>
              <option>REJECTED</option>
              <option>COMPLETED</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search employee..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 shadow-sm w-[240px]"
              />
            </div>
            
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm"
              title="Filter by Resignation Date"
            />
            
            <button className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50/50 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-blue-600 flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-800">{stats.total}</h4>
              <p className="text-[10px] font-bold text-slate-500">Total Requests</p>
            </div>
          </div>
          
          <div className="bg-orange-50/50 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-orange-500 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-800">{stats.pending}</h4>
              <p className="text-[10px] font-bold text-slate-500">Pending</p>
            </div>
          </div>
          
          <div className="bg-emerald-50/50 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-emerald-500 flex items-center justify-center">
              <CheckSquare size={24} />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-800">{stats.approved}</h4>
              <p className="text-[10px] font-bold text-slate-500">Approved</p>
            </div>
          </div>
          
          <div className="bg-rose-50/50 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-rose-500 flex items-center justify-center">
              <XCircle size={24} />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-800">{stats.rejected}</h4>
              <p className="text-[10px] font-bold text-slate-500">Rejected</p>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-indigo-500 flex items-center justify-center">
              <CalendarCheck size={24} />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-800">{stats.completed}</h4>
              <p className="text-[10px] font-bold text-slate-500">Completed</p>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-5 text-xs font-black text-slate-800 bg-white">Employee</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-800 bg-white">Department</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-800 bg-white">Resignation Date</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-800 bg-white">Last Working Day</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-800 bg-white">Status</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-800 bg-white text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                        <span className="text-sm font-bold">Loading resignations...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <CalendarCheck size={40} className="opacity-30" />
                        <span className="text-sm font-bold">No resignation requests found</span>
                        {(searchTerm || statusFilter !== 'All Status') && (
                          <span className="text-xs">Try clearing your filters</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((req) => {
                    const emp = req.employeeId;
                    const avatar = emp?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp?.fullName || 'E')}&background=6366f1&color=fff`;
                    const isApproving = actionLoading === req._id + 'APPROVED';
                    const isRejecting = actionLoading === req._id + 'REJECTED';

                    return (
                      <tr key={req._id} onClick={(e) => { e.stopPropagation(); navigate(`/admin/resignations/${req._id}`); }} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={avatar} 
                              alt={emp?.fullName} 
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp?.fullName || 'E')}&background=6366f1&color=fff`; }}
                            />
                            <div>
                              <p className="text-sm font-black text-slate-800">{emp?.fullName || '—'}</p>
                              <p className="text-[11px] font-bold text-slate-500">{emp?.designation || emp?.empCode || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-700">{emp?.department || '—'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-800">{formatDate(req.resignationDate)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-800">{formatDate(req.lastWorkingDay)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            req.status === 'PENDING' ? 'text-orange-500 bg-orange-50' : 
                            req.status === 'APPROVED' ? 'text-emerald-500 bg-emerald-50' : 
                            req.status === 'COMPLETED' ? 'text-indigo-500 bg-indigo-50' : 
                            'text-rose-500 bg-rose-50'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/admin/resignations/${req._id}`); }}
                              className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            {req.status === 'PENDING' ? (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req._id, 'APPROVED'); }}
                                  disabled={isApproving || isRejecting}
                                  className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                  title="Approve"
                                >
                                  {isApproving ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req._id, 'REJECTED'); }}
                                  disabled={isApproving || isRejecting}
                                  className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors disabled:opacity-50"
                                  title="Reject"
                                >
                                  {isRejecting ? <Loader2 size={14} className="animate-spin" /> : <X size={16} />}
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={(e) => { e.stopPropagation(); navigate(`/admin/resignations/${req._id}`); }}
                                className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors"
                                title="View"
                              >
                                <Eye size={16} className="opacity-50" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {!loading && resignations.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-sm font-medium text-slate-500">
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, resignations.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, resignations.length)} of {resignations.length} entries
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center transition-colors ${
                      page === currentPage 
                        ? 'bg-white border border-blue-500 text-blue-600' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminResignation;

