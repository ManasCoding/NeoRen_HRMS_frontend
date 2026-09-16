import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { TrendingUp, Users, RefreshCw, PlusCircle, MinusCircle, History, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import api from '../services/api';
import SearchHeader from '../components/SearchHeader';

const AdminLeaveAccrual = () => {
  const admin = JSON.parse(localStorage.getItem('user')) || {};
  const adminId = admin.id || admin._id;

  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustModal, setAdjustModal] = useState(null); // { employeeId, fullName, currentBalance }
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [rowTransactions, setRowTransactions] = useState({});
  const [txLoading, setTxLoading] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/leaves/accrual/overview');
      if (res.data.success) setOverview(res.data.overview);
    } catch (err) {
      console.error('Error fetching accrual overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOverview(); }, []);

  const handleProcessAccrual = async () => {
    if (!window.confirm('Process earned leave accrual for the PREVIOUS completed month for ALL active employees?')) return;
    setProcessing(true);
    try {
      const res = await api.post('/admin/leaves/accrual/process', { adminId });
      if (res.data.success) {
        setActionMsg(`✅ Accrual for ${res.data.accrualMonth}: ${res.data.results.processed} processed, ${res.data.results.skipped} skipped.`);
        fetchOverview();
      }
    } catch (err) {
      setActionMsg('❌ Accrual processing failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
      setTimeout(() => setActionMsg(''), 6000);
    }
  };

  const handleBackfill = async () => {
    if (!window.confirm('Run backfill? This will process all MISSING monthly accruals from each employee\'s join date. Already-processed months will be skipped.')) return;
    setBackfilling(true);
    try {
      const res = await api.post('/admin/leaves/accrual/backfill', { adminId });
      if (res.data.success) {
        setActionMsg(`✅ Backfill complete: ${res.data.results.processed} accruals created, ${res.data.results.skipped} skipped.`);
        fetchOverview();
      }
    } catch (err) {
      setActionMsg('❌ Backfill failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setBackfilling(false);
      setTimeout(() => setActionMsg(''), 6000);
    }
  };

  const openAdjust = (emp) => {
    setAdjustModal({ employeeId: emp._id, fullName: emp.fullName, currentBalance: emp.available });
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustError('');
  };

  const handleAdjust = async () => {
    if (!adjustAmount || !adjustReason) {
      setAdjustError('Both amount and reason are required.');
      return;
    }
    setAdjustLoading(true);
    try {
      const res = await api.post('/admin/leaves/adjustment', {
        employeeId: adjustModal.employeeId,
        amount: Number(adjustAmount),
        reason: adjustReason,
        adminId
      });
      if (res.data.success) {
        setActionMsg(`✅ Balance adjusted for ${adjustModal.fullName}. New balance: ${res.data.newBalance}`);
        setAdjustModal(null);
        fetchOverview();
        setTimeout(() => setActionMsg(''), 5000);
      }
    } catch (err) {
      setAdjustError(err.response?.data?.message || 'Adjustment failed.');
    } finally {
      setAdjustLoading(false);
    }
  };

  const toggleRow = async (empId) => {
    if (expandedRow === empId) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(empId);
    if (!rowTransactions[empId]) {
      setTxLoading(empId);
      try {
        const res = await api.get(`/admin/leaves/accrual/balance/${empId}`);
        if (res.data.success) {
          // Also fetch transactions via employee route
          const txRes = await api.get(`/employee/leaves/transactions/${empId}`);
          setRowTransactions(prev => ({ ...prev, [empId]: txRes.data.transactions || [] }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTxLoading(null);
      }
    }
  };

  const filteredOverview = overview.filter(emp =>
    emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <AdminLayout title="Leave Accrual" subtitle="Manage earned leave balances and monthly accruals.">
      <SearchHeader
        title="Earned Leave Accrual"
        subtitle="Monthly accrual tracking for all employees."
        count={overview.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search by name, code, or department..."
      />

      {/* Action Banner */}
      {actionMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm font-bold text-emerald-700">
          {actionMsg}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={handleProcessAccrual}
          disabled={processing}
          className="flex items-center gap-2 px-5 py-3 bg-[#1e293b] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg disabled:opacity-50"
        >
          <RefreshCw size={14} className={processing ? 'animate-spin' : ''} />
          {processing ? 'Processing...' : 'Process Last Month\'s Accrual'}
        </button>
        <button
          onClick={handleBackfill}
          disabled={backfilling}
          className="flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-50"
        >
          <TrendingUp size={14} />
          {backfilling ? 'Backfilling...' : 'Backfill All Missing Accruals'}
        </button>
      </div>

      {/* Overview Table */}
      <div className="bg-surface rounded-[32px] border-t-4 border-violet-500 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-border">
                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Employee</th>
                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">Available</th>
                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">Total Earned</th>
                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">Used</th>
                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">This Month</th>
                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Join Date</th>
                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest">Last Accrual</th>
                <th className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="8" className="px-6 py-8 h-20 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : filteredOverview.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle size={36} className="text-slate-200" />
                      <p className="text-slate-400 font-bold text-sm">No employees found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOverview.map((emp) => (
                  <React.Fragment key={emp._id}>
                    <tr
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => toggleRow(emp._id)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-text-main">{emp.fullName}</span>
                          <span className="text-[10px] font-bold text-text-muted uppercase">{emp.empCode} · {emp.department || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-lg font-black text-violet-700">{emp.available}</span>
                        <span className="text-[9px] font-bold text-violet-400 block">days</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-sm font-black text-emerald-700">{emp.totalEarned}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-sm font-black text-rose-600">{emp.totalUsed}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {emp.earnedThisMonth > 0 ? (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100">+1 ✓</span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-300 uppercase italic">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-500">{formatDate(emp.joinDate)}</td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-500">{formatDate(emp.lastAccrualDate)}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openAdjust(emp); }}
                            className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all"
                            title="Adjust balance"
                          >
                            <PlusCircle size={14} />
                          </button>
                          {expandedRow === emp._id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-300" />}
                        </div>
                      </td>
                    </tr>
                    {/* Expandable Transaction History Row */}
                    {expandedRow === emp._id && (
                      <tr>
                        <td colSpan="8" className="px-8 pb-6 bg-slate-50/50">
                          <div className="mt-2 rounded-2xl border border-slate-100 bg-white overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-50 flex items-center gap-2">
                              <History size={13} className="text-slate-400" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Leave Transaction History — {emp.fullName}</span>
                            </div>
                            {txLoading === emp._id ? (
                              <div className="p-4 text-center text-xs text-slate-400 animate-pulse">Loading...</div>
                            ) : !rowTransactions[emp._id]?.length ? (
                              <div className="p-4 text-center text-xs text-slate-400 italic font-bold">No transactions recorded yet.</div>
                            ) : (
                              <div className="divide-y divide-slate-50 max-h-52 overflow-y-auto">
                                {rowTransactions[emp._id].map((tx, i) => {
                                  const isCredit = tx.amount > 0;
                                  return (
                                    <div key={i} className="flex items-center gap-4 px-5 py-2.5 hover:bg-slate-50">
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {isCredit ? '+' : '−'}
                                      </span>
                                      <div className="flex-1">
                                        <p className="text-xs font-black text-slate-700">{tx.transactionType.replace(/_/g, ' ')} — {Math.abs(tx.amount)} Day{Math.abs(tx.amount) !== 1 ? 's' : ''}</p>
                                        <p className="text-[9px] text-slate-400 font-bold">{tx.reason}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-600">Bal: {tx.balanceAfterTransaction}</p>
                                        <p className="text-[9px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-7 rounded-[28px] border border-border shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-violet-50 text-violet-500 rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Employees</p>
            <h4 className="text-3xl font-black text-slate-800">{overview.length}</h4>
          </div>
        </div>
        <div className="bg-white p-7 rounded-[28px] border border-border shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Earned Leaves</p>
            <h4 className="text-3xl font-black text-slate-800">{overview.reduce((a, e) => a + (e.totalEarned || 0), 0)}</h4>
          </div>
        </div>
        <div className="bg-white p-7 rounded-[28px] border border-border shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
            <RefreshCw size={24} />
          </div>
          <div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Available</p>
            <h4 className="text-3xl font-black text-slate-800">{overview.reduce((a, e) => a + (e.available || 0), 0)}</h4>
          </div>
        </div>
      </div>

      {/* Adjustment Modal */}
      {adjustModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-300">
            <h3 className="text-lg font-black text-[#1e293b] mb-1">Adjust Leave Balance</h3>
            <p className="text-sm text-slate-400 font-bold mb-6">{adjustModal.fullName} · Current Balance: <span className="text-violet-700">{adjustModal.currentBalance} days</span></p>

            {adjustError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm font-bold text-rose-600">
                {adjustError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Amount (use + to add, − to deduct)
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAdjustAmount(v => v.startsWith('-') ? v.slice(1) : (v ? '+' + v.replace('+','') : '+1'))}
                    className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${!adjustAmount.startsWith('-') ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >
                    <PlusCircle size={14} className="inline mr-1" />Add
                  </button>
                  <button
                    onClick={() => setAdjustAmount(v => !v.startsWith('-') ? '-' + v.replace('+','') : v)}
                    className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${adjustAmount.startsWith('-') ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >
                    <MinusCircle size={14} className="inline mr-1" />Deduct
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 1 or -2"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  className="mt-3 w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Reason (required)</label>
                <textarea
                  placeholder="e.g. HR correction for missed accrual"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  rows={3}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setAdjustModal(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                disabled={adjustLoading}
                className="flex-1 py-3 bg-[#1e293b] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                {adjustLoading ? 'Saving...' : 'Save Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLeaveAccrual;
