import React, { useState, useEffect, useRef, useCallback } from 'react';
import SalarySlipA4 from '../common/SalarySlipA4';
import {
  FileText, Download, Printer, Trash2, Eye, Loader2, CheckCircle2,
  Building2, User, Calendar, X
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';


// ─── PayslipsTab Component ────────────────────────────────────────────────────
const PayslipsTab = ({ employeeId, employee }) => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchPayslips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payroll/history/${employeeId}`);
      if (res.data.success) setPayslips(res.data.data);
    } catch (e) { toast.error('Failed to load payslips'); }
    finally { setLoading(false); }
  }, [employeeId]);

  useEffect(() => { if (employeeId) fetchPayslips(); }, [employeeId, fetchPayslips]);

  const openSlip = (slip) => { setSelectedSlip(slip); setShowSlipModal(true); };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = `@media print { @page { size: A4; margin: 0; } body * { visibility: hidden; } #salary-slip-hidden, #salary-slip-hidden * { visibility: visible !important; } #salary-slip-hidden { position: absolute; left: 0; top: 0; width: 794px; transform: scale(1) !important; transform-origin: top left; } }`;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const handleDownloadPDF = async (slip) => {
    try {
      setDownloadingId(slip._id);
      setSelectedSlip(slip);
      // Give the DOM a moment to render the off-screen element
      await new Promise(r => setTimeout(r, 600));

      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('salary-slip-hidden');
      if (!element) { toast.error('Slip not rendered yet, try again'); return; }

      const monthName = new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'long' });
      await html2pdf()
        .set({
          margin: 0,
          filename: `Salary_Slip_${slip.employeeName || employee?.fullName}_${monthName}_${slip.year}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: true, windowWidth: 794 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(element)
        .save();

      toast.success('PDF downloaded!');
    } catch (e) {
      console.error(e);
      toast.error('PDF generation failed. Try Print instead.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payslip?')) return;
    try {
      await api.delete(`/payroll/${id}`);
      toast.success('Payslip deleted');
      fetchPayslips();
      if (selectedSlip?._id === id) setShowSlipModal(false);
    } catch (e) { toast.error('Failed to delete'); }
  };

  const monthLabel = (m, y) => `${new Date(y, m - 1).toLocaleString('default', { month: 'long' })} ${y}`;
  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="space-y-6">
      {/* Hidden container for print/download */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -100 }}>
        {selectedSlip && <SalarySlipA4 data={selectedSlip} employee={employee} containerId="salary-slip-hidden" />}
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center">
            <FileText size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="font-black text-slate-800">Salary Payslips</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">All Generated Payslips</p>
          </div>
        </div>
        <span className="bg-indigo-50 text-indigo-700 font-black text-sm px-4 py-2 rounded-xl border border-indigo-100">
          {payslips.length} slip{payslips.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-primary w-7 h-7" /></div>
      ) : payslips.length === 0 ? (
        <div className="bg-white rounded-2xl p-14 shadow-sm border border-border text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-slate-400" />
          </div>
          <h3 className="font-black text-slate-700 mb-1">No Payslips Yet</h3>
          <p className="text-sm text-slate-400 font-medium">Generate payroll from the Payroll tab to create payslips.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-slate-100">
                <tr>
                  {['Month/Year', 'Basic Salary', 'Gross Salary', 'Total Deductions', 'Net Salary', 'Status', 'Generated On', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payslips.map((slip, idx) => (
                  <tr key={slip._id} className={`hover:bg-slate-50/70 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-800">{new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'long' })}</div>
                      <div className="text-xs font-semibold text-slate-400">{slip.year}</div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">{fmt(slip.basicSalary)}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{fmt(slip.grossSalary)}</td>
                    <td className="px-5 py-4 font-bold text-rose-600">-{fmt(slip.totalDeductions || slip.deduction || 0)}</td>
                    <td className="px-5 py-4 font-black text-emerald-600 text-base">{fmt(slip.netSalary)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${slip.status === 'Locked' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {slip.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {new Date(slip.generatedDate || slip.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openSlip(slip)} title="View"
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" >
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleDownloadPDF(slip)} disabled={downloadingId === slip._id} title="Download PDF"
                          className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50">
                          {downloadingId === slip._id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        </button>
                        <button onClick={() => { setSelectedSlip(slip); setTimeout(handlePrint, 400); }} title="Print"
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                          <Printer size={14} />
                        </button>
                        <button onClick={() => handleDelete(slip._id)} title="Delete"
                          className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slip Modal */}
      {showSlipModal && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <FileText size={16} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">Salary Slip — {monthLabel(selectedSlip.month, selectedSlip.year)}</h3>
                  <p className="text-xs font-semibold text-slate-400">{selectedSlip.employeeName || employee?.fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownloadPDF(selectedSlip)} disabled={downloadingId === selectedSlip._id}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50">
                  {downloadingId === selectedSlip._id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Download PDF
                </button>
                <button onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                  <Printer size={14} /> Print
                </button>
                <button onClick={() => setShowSlipModal(false)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Slip Content */}
            <div className="overflow-x-auto p-4 bg-slate-50">
              <div style={{ transformOrigin: 'top left' }}>
                <SalarySlipA4 data={selectedSlip} employee={employee} containerId="salary-slip-modal-view" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayslipsTab;
