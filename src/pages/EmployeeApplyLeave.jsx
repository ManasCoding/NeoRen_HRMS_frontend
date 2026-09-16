import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  ChevronRight,
  TrendingUp,
  History
} from 'lucide-react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import api from '../services/api';

const txIcon = (type) => {
  if (type === 'MONTHLY_ACCRUAL') return { symbol: '+', color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Earned' };
  if (type === 'LEAVE_USED') return { symbol: '−', color: 'text-rose-600', bg: 'bg-rose-50', label: 'Used' };
  if (type === 'LEAVE_REVERSAL') return { symbol: '+', color: 'text-sky-600', bg: 'bg-sky-50', label: 'Restored' };
  if (type === 'ADMIN_ADJUSTMENT') return { symbol: '±', color: 'text-amber-600', bg: 'bg-amber-50', label: 'Adjusted' };
  return { symbol: '•', color: 'text-slate-500', bg: 'bg-slate-50', label: type };
};

const EmployeeApplyLeave = () => {
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [stats, setStats] = useState(null);
  const [earnedBalance, setEarnedBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    leaveType: 'Casual Leave',
    fromDate: '',
    toDate: '',
    reason: ''
  });

  const employeeId = user.id;

  const fetchData = async () => {
    try {
      const [statsRes, leavesRes, balanceRes] = await Promise.all([
        api.get(`/employee/stats/${employeeId}`),
        api.get(`/employee/leaves/${employeeId}`),
        api.get(`/employee/leaves/balance/${employeeId}`)
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (leavesRes.data.success) setLeaves(leavesRes.data.leaves);
      if (balanceRes.data.success) {
        setEarnedBalance(balanceRes.data.balance);
        setTransactions(balanceRes.data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) fetchData();
  }, [employeeId]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!formData.fromDate || !formData.toDate || !formData.reason) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const available = earnedBalance?.available ?? 0;
      if (diffDays > available) {
        setError(`Insufficient leave balance. Available: ${available} day${available === 1 ? '' : 's'}.`);
        setSubmitting(false);
        return;
      }

      const payload = {
        employeeId,
        ...formData,
        days: diffDays,
        status: 'PENDING',
        appliedOn: new Date().toISOString()
      };

      const res = await api.post('/employee/leaves', payload);
      if (res.data.success) {
        setSuccess('Leave application submitted successfully!');
        setFormData({ leaveType: 'Casual Leave', fromDate: '', toDate: '', reason: '' });
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const available = earnedBalance?.available ?? 0;
  const earned = earnedBalance?.earned ?? 0;
  const used = earnedBalance?.used ?? 0;
  const pendingDays = earnedBalance?.pendingDays ?? 0;
  const earnedThisMonth = earnedBalance?.earnedThisMonth ?? 0;

  return (
    <EmployeeLayout title="Apply Leave" subtitle="Request time off and track your leave status.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT — Leave Stats & Balances */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-violet-500"></div>
            <h3 className="text-xl font-black text-[#1e293b] mb-6">Leave Balance</h3>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-24 bg-slate-50 rounded-2xl"></div>
                <div className="h-20 bg-slate-50 rounded-2xl"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Available */}
                <div className="p-5 bg-violet-50 rounded-3xl border border-violet-100">
                  <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1">Available Leave</p>
                  <p className="text-3xl font-black text-violet-700">{available} <span className="text-sm font-bold opacity-60 uppercase">Days</span></p>
                  {earnedThisMonth > 0 && (
                    <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                      <TrendingUp size={10} /> +1 earned this month
                    </p>
                  )}
                  <div className="mt-3 w-full bg-violet-200 rounded-full h-1.5">
                    <div
                      className="bg-violet-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (available / Math.max(earned, 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Earned</p>
                    <p className="text-xl font-black text-emerald-700">{earned}</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                    <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Used</p>
                    <p className="text-xl font-black text-rose-700">{used}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Pending</p>
                    <p className="text-xl font-black text-amber-700">{pendingDays}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Leave Transaction History */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-3">
              <History size={16} className="text-slate-400" />
              <h4 className="font-black text-[#1e293b] text-sm">Leave History</h4>
            </div>
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 animate-pulse space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-50 rounded-xl" />)}
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-slate-400 text-xs font-bold italic p-6">No leave transactions yet.</p>
              ) : (
                transactions.map((tx, idx) => {
                  const { symbol, color, bg, label } = txIcon(tx.transactionType);
                  const monthLabel = tx.accrualMonth
                    ? new Date(tx.accrualMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                    : new Date(tx.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric' });
                  return (
                    <div key={idx} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${bg} shrink-0`}>
                        <span className={`text-xs font-black ${color}`}>{symbol}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-black ${color}`}>{label} {Math.abs(tx.amount)} Day{Math.abs(tx.amount) !== 1 ? 's' : ''}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">{monthLabel}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-600">Bal: {tx.balanceAfterTransaction}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Policy Tip */}
          <div className="bg-[#0f172a] rounded-[32px] p-8 text-white">
            <h4 className="text-base font-bold mb-4">Leave Policy</h4>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              You earn <span className="text-white font-black">1 day</span> every completed month. Unused leaves carry forward — your balance keeps growing.
            </p>
            <button className="mt-6 flex items-center gap-2 text-sky-400 text-xs font-black uppercase tracking-widest hover:text-sky-300 transition-colors">
              Read Policy <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* RIGHT — Apply Form + Recent History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Apply Form */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1e293b]">New Leave Application</h3>
                <p className="text-xs text-slate-400 font-medium">Fill in the details to submit your request.</p>
              </div>
            </div>

            {success && (
              <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 animate-in fade-in zoom-in duration-300">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <p className="text-sm font-bold text-emerald-700">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 animate-in fade-in zoom-in duration-300">
                <AlertCircle size={20} className="text-rose-500 shrink-0" />
                <p className="text-sm font-bold text-rose-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleApply} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Leave Type</label>
                <div className="grid grid-cols-2 gap-4">
                  {['Casual Leave', 'Sick Leave'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, leaveType: type })}
                      className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                        formData.leaveType === type 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">From Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input 
                      type="date" 
                      value={formData.fromDate}
                      onChange={e => setFormData({ ...formData, fromDate: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">To Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input 
                      type="date" 
                      value={formData.toDate}
                      onChange={e => setFormData({ ...formData, toDate: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Reason for Leave</label>
                <textarea 
                  placeholder="Explain why you are taking this leave..."
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  rows="4"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#1e293b] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send size={18} />
                )}
                {submitting ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </form>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-[#1e293b]">Recent Applications</h3>
              <Clock size={20} className="text-slate-300" />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Leave Details</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Days</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Applied On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="4" className="px-8 py-6 h-20 bg-slate-50/20"></td>
                      </tr>
                    ))
                  ) : leaves.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-8 py-12 text-center text-slate-400 font-bold text-sm italic">
                        No leave applications found.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-[#1e293b]">{leave.leaveType}</span>
                            <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                              {new Date(leave.fromDate).toLocaleDateString()} — {new Date(leave.toDate).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-sm font-black text-slate-700">{leave.days}d</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              leave.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {leave.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="text-[10px] font-black text-slate-500 uppercase">
                            {new Date(leave.appliedOn).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeApplyLeave;
