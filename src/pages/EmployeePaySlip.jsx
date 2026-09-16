import React, { useState, useEffect, useCallback } from 'react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import {
  FileText, Download, Printer, Eye, Loader2, X
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import SalarySlipA4 from '../components/common/SalarySlipA4';

const EmployeePaySlip = () => {
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || { id: '', name: 'Employee', slug: '' });
  const employeeId = user.id;

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchPayslips = useCallback(async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      const res = await api.get(`/payroll/history/${employeeId}`);
      if (res.data.success) {
        // filter out Drafts to only show locked/completed to employees
        setPayslips(res.data.data.filter(s => s.status !== 'Draft'));
      }
    } catch (e) { toast.error('Failed to load payslips'); }
    finally { setLoading(false); }
  }, [employeeId]);

  useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

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
          filename: `Salary_Slip_${monthName}_${slip.year}.pdf`,
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

  const monthLabel = (m, y) => `${new Date(y, m - 1).toLocaleString('default', { month: 'long' })} ${y}`;
  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <EmployeeLayout title="My Pay Slips" subtitle="View and download your monthly salary slips.">
      <div className="space-y-6 pb-20">
        
        {/* Hidden container for print/download */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -100 }}>
          {selectedSlip && <SalarySlipA4 data={selectedSlip} employee={user} containerId="salary-slip-hidden" />}
        </div>

        {/* Header Summary */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1976FF]/20 to-[#0B2347]/10 flex items-center justify-center">
              <FileText size={28} className="text-[#1976FF]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Salary Payslips</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Your official earning records</p>
            </div>
          </div>
          <div className="bg-[#f8fafc] text-slate-600 font-black text-sm px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#1976FF] animate-pulse"></span>
            {payslips.length} Available Slip{payslips.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-[#1976FF] w-8 h-8" />
          </div>
        ) : payslips.length === 0 ? (
          <div className="bg-white rounded-[32px] p-16 shadow-sm border border-slate-100 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-700 mb-2">No Payslips Generated Yet</h3>
            <p className="text-sm text-slate-400 font-medium max-w-md mx-auto">
              Your salary slips will appear here once payroll is processed by HR for the month.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-50 bg-slate-50/50">
                  <tr>
                    {['Month/Year', 'Net Salary', 'Earnings', 'Deductions', 'Generated On', 'Actions'].map(h => (
                      <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payslips.map((slip) => (
                    <tr key={slip._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                             {new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'short' })}
                           </div>
                           <div>
                              <div className="font-black text-[#1e293b]">{new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'long' })}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{slip.year}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black text-emerald-600 text-lg">{fmt(slip.netSalary)}</td>
                      <td className="px-8 py-6 font-bold text-slate-600">{fmt(slip.grossSalary)}</td>
                      <td className="px-8 py-6 font-bold text-rose-500">-{fmt(slip.totalDeductions || slip.deduction || 0)}</td>
                      <td className="px-8 py-6 text-xs font-bold text-slate-400 whitespace-nowrap">
                        {new Date(slip.generatedDate || slip.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openSlip(slip)} title="View"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f8fafc] text-slate-600 font-bold text-xs hover:bg-blue-50 hover:text-blue-600 transition-colors" >
                            <Eye size={14} /> View
                          </button>
                          <button onClick={() => handleDownloadPDF(slip)} disabled={downloadingId === slip._id} title="Download PDF"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1976FF] text-white font-bold text-xs hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {downloadingId === slip._id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            Download
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
          <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-8">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-4xl w-full mx-4 my-auto overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1976FF]/10 flex items-center justify-center">
                    <FileText size={20} className="text-[#1976FF]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Salary Slip</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{monthLabel(selectedSlip.month, selectedSlip.year)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleDownloadPDF(selectedSlip)} disabled={downloadingId === selectedSlip._id}
                    className="flex items-center gap-2 px-6 py-3 bg-[#1976FF] text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200 active:scale-95">
                    {downloadingId === selectedSlip._id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Save PDF
                  </button>
                  <button onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all active:scale-95">
                    <Printer size={16} /> Print
                  </button>
                  <div className="w-px h-8 bg-slate-100 mx-1"></div>
                  <button onClick={() => setShowSlipModal(false)}
                    className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Slip Content */}
              <div className="overflow-x-auto p-8 bg-slate-50/50 flex justify-center max-h-[70vh] overflow-y-auto">
                <div style={{ transformOrigin: 'top center', transform: 'scale(0.95)' }}>
                  <SalarySlipA4 data={selectedSlip} employee={user} containerId="salary-slip-modal-view" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeePaySlip;
