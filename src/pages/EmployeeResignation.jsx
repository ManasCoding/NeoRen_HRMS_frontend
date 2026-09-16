import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Upload,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronLeft,
  ClipboardList,
  UserCheck,
  ShieldCheck,
  Clock,
  LogOut,
  X,
  Paperclip
} from 'lucide-react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import api from '../services/api';

const EmployeeResignation = () => {
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    resignationDate: new Date().toISOString().split('T')[0],
    lastWorkingDay: '',
    reason: '',
    comments: ''
  });

  const employeeId = user.id;

  const reasonOptions = [
    'Better Opportunity',
    'Personal Reasons',
    'Higher Studies',
    'Health Issues',
    'Relocation',
    'Career Change',
    'Work-Life Balance',
    'Compensation',
    'Other'
  ];

  const processSteps = [
    {
      number: '1',
      title: 'Submit Request',
      description: 'Fill in the resignation form and submit your request.',
      icon: <ClipboardList size={18} />,
      color: 'bg-blue-500'
    },
    {
      number: '2',
      title: 'Admin Review',
      description: 'Your request will be reviewed by administration.',
      icon: <UserCheck size={18} />,
      color: 'bg-violet-500'
    },
    {
      number: '3',
      title: 'Approval',
      description: 'Request will be approved or rejected.',
      icon: <ShieldCheck size={18} />,
      color: 'bg-emerald-500'
    },
    {
      number: '4',
      title: 'Notice Period',
      description: 'Complete your notice period as per company policy.',
      icon: <Clock size={18} />,
      color: 'bg-amber-500'
    },
    {
      number: '5',
      title: 'Exit Process',
      description: 'Complete exit formalities and handover.',
      icon: <FileText size={18} />,
      color: 'bg-orange-500'
    },
    {
      number: '6',
      title: 'Resigned',
      description: 'Employee marked as resigned after completion.',
      icon: <LogOut size={18} />,
      color: 'bg-rose-500'
    }
  ];

  const fetchResignations = async () => {
    try {
      const res = await api.get(`/employee/resignations/${employeeId}`);
      if (res.data.success) {
        setResignations(res.data.resignations || []);
      }
    } catch (err) {
      console.error('Error fetching resignations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchResignations();
    }
  }, [employeeId]);


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (file.size > maxSize) {
        setError('File size must be less than 5MB.');
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, DOC, and DOCX files are allowed.');
        return;
      }
      setAttachment(file);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (file.size > maxSize) {
        setError('File size must be less than 5MB.');
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, DOC, and DOCX files are allowed.');
        return;
      }
      setAttachment(file);
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.resignationDate || !formData.reason) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('employeeId', employeeId);
      payload.append('resignationDate', formData.resignationDate);
      payload.append('lastWorkingDay', formData.lastWorkingDay);
      payload.append('reason', formData.reason);
      payload.append('comments', formData.comments);
      payload.append('status', 'PENDING');
      payload.append('submittedOn', new Date().toISOString());
      if (attachment) {
        payload.append('attachment', attachment);
      }

      const res = await api.post('/employee/resignations', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setSuccess('Resignation request submitted successfully!');
        setFormData({
          resignationDate: new Date().toISOString().split('T')[0],
          lastWorkingDay: '',
          reason: '',
          comments: ''
        });
        setAttachment(null);
        fetchResignations();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit resignation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasActiveResignation = resignations.some(r => r.status === 'PENDING' || r.status === 'APPROVED');

  return (
    <EmployeeLayout title="Submit Resignation Request" subtitle="Fill in the details below to submit your resignation request.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT — Resignation Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">

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

            {hasActiveResignation ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={28} className="text-amber-500" />
                </div>
                <h3 className="text-lg font-black text-[#1e293b] mb-2">Active Resignation Request</h3>
                <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">
                  You already have an active resignation request. Please wait for it to be processed before submitting a new one.
                </p>
                {/* Add a View Details button if there's an active resignation */}
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => navigate(`/employee/${user.empCode}/resignation/${resignations[0]._id}`)}
                    className="px-8 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Resignation Date & Last Working Day */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Resignation Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={formData.resignationDate}
                        onChange={e => setFormData({ ...formData, resignationDate: e.target.value })}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Last Working Day <span className="text-slate-300">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={formData.lastWorkingDay}
                        onChange={e => setFormData({ ...formData, lastWorkingDay: e.target.value })}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Reason & Attachment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Reason for Resignation <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.reason}
                      onChange={e => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select a reason</option>
                      {reasonOptions.map(reason => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Attachment <span className="text-slate-300">(Optional)</span>
                    </label>
                    <div
                      className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {attachment ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Paperclip size={16} className="text-primary shrink-0" />
                            <span className="text-sm font-bold text-[#1e293b] truncate">{attachment.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeAttachment(); }}
                            className="p-1 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                          >
                            <X size={14} className="text-rose-500" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-2">
                          <Upload size={20} className="mx-auto text-slate-300 group-hover:text-primary/50 transition-colors mb-2" />
                          <p className="text-xs font-bold text-slate-400">
                            Drag & drop file here
                          </p>
                          <p className="text-[10px] text-slate-300 font-medium mt-1">
                            or <span className="text-primary font-bold">click to browse</span>
                          </p>
                          <p className="text-[9px] text-slate-300 font-medium mt-1 uppercase tracking-wider">
                            PDF, DOC, DOCX (Max: 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Comments <span className="text-slate-300">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Share any additional details about your resignation..."
                    value={formData.comments}
                    onChange={e => setFormData({ ...formData, comments: e.target.value })}
                    rows="4"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none"
                  ></textarea>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ resignationDate: new Date().toISOString().split('T')[0], lastWorkingDay: '', reason: '', comments: '' })}
                    className="px-8 py-3.5 border border-slate-200 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-gradient-to-r from-[#2563eb] to-[#3730a3] text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Previous Resignations */}
          {resignations.length > 0 && (
            <div id="resignation-history" className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xl font-black text-[#1e293b]">Resignation History</h3>
                <Clock size={20} className="text-slate-300" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Submitted On</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Last Working Day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {resignations.map((item, idx) => (
                      <tr 
                        key={idx} 
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/employee/${user.empCode}/resignation/${item._id}`)}
                      >
                        <td className="px-8 py-5">
                          <span className="text-sm font-black text-[#1e293b]">
                            {new Date(item.submittedOn || item.resignationDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-sm font-bold text-slate-500">{item.reason}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              item.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="text-[10px] font-black text-slate-500 uppercase">
                            {item.lastWorkingDay ? new Date(item.lastWorkingDay).toLocaleDateString() : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — About Resignation Process */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#2563eb] to-[#3730a3]"></div>
            <h3 className="text-lg font-black text-[#1e293b] mb-6">About Resignation Process</h3>

            <div className="space-y-5">
              {processSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="relative flex flex-col items-center">
                    <div className={`w-9 h-9 ${step.color} rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                      {step.icon}
                    </div>
                    {idx < processSteps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-100 mt-2 min-h-[16px]"></div>
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      {step.number}. {step.title}
                    </p>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-[#0f172a] rounded-[32px] p-8 text-white">
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-400" />
              Important Notice
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Once submitted, resignation requests cannot be withdrawn. Please ensure all details are correct before submitting. The standard notice period is 30 days from the resignation date.
            </p>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeResignation;
