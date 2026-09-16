import React, { useState } from 'react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, MapPin, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

const EMPTY_CLIENT = () => ({
  clientName: '',
  siteName: '',
  siteAddress: '',
  purpose: '',
  startDate: new Date().toISOString().split('T')[0],
  startTime: '09:30',
  contactPerson: '',
  contactNumber: '',
  _collapsed: false,
  _id: Date.now() + Math.random(),
});

const EmployeeSiteVisitRequest = () => {
  const { employeeSlug } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([EMPTY_CLIENT()]);

  // ── per-client field change ──────────────────────────────
  const handleChange = (index, e) => {
    setClients(prev => prev.map((c, i) =>
      i === index ? { ...c, [e.target.name]: e.target.value } : c
    ));
  };

  // ── add / remove client ──────────────────────────────────
  const addClient = () => {
    setClients(prev => [...prev, EMPTY_CLIENT()]);
  };

  const removeClient = (index) => {
    if (clients.length === 1) return;
    setClients(prev => prev.filter((_, i) => i !== index));
  };

  // ── collapse / expand card ───────────────────────────────
  const toggleCollapse = (index) => {
    setClients(prev => prev.map((c, i) =>
      i === index ? { ...c, _collapsed: !c._collapsed } : c
    ));
  };

  // ── submit all ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const requests = clients.map(c =>
        api.post('/site-visits', {
          clientName: c.clientName,
          siteName: c.siteName,
          siteAddress: c.siteAddress,
          purpose: c.purpose,
          startDate: c.startDate,
          startTime: c.startTime,
          contactPerson: c.contactPerson,
          contactNumber: c.contactNumber,
          employeeId: user.id,
        })
      );
      await Promise.all(requests);
      toast.success(`${clients.length} site visit request${clients.length > 1 ? 's' : ''} submitted successfully!`);
      navigate(`/employee/${employeeSlug}/site-visits`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request(s)');
    } finally {
      setLoading(false);
    }
  };

  const isComplete = (c) =>
    c.clientName && c.siteName && c.siteAddress && c.purpose && c.startDate && c.startTime;

  return (
    <EmployeeLayout title="New Site Visit Request" subtitle="Submit requests for field visits — add multiple clients at once">
      <form onSubmit={handleSubmit}>
        <div className="max-w-3xl mx-auto px-4 md:px-6 pb-10 space-y-4">

          {/* ── Client Cards ── */}
          {clients.map((client, index) => (
            <div
              key={client._id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* Card Header */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer select-none border-b border-slate-100"
                onClick={() => toggleCollapse(index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                    isComplete(client) ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {isComplete(client) ? <CheckCircle2 size={16} /> : index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      {client.clientName || `Client ${index + 1}`}
                    </p>
                    {client.siteName && (
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <MapPin size={10} /> {client.siteName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {clients.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeClient(index); }}
                      className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors"
                      title="Remove client"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <div className="text-slate-400">
                    {client._collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              {!client._collapsed && (
                <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Client / Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      name="clientName"
                      value={client.clientName}
                      onChange={(e) => handleChange(index, e)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-800"
                      placeholder="Enter client or company name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Site Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      name="siteName"
                      value={client.siteName}
                      onChange={(e) => handleChange(index, e)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-800"
                      placeholder="Enter site name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Site Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      name="siteAddress"
                      value={client.siteAddress}
                      onChange={(e) => handleChange(index, e)}
                      rows="2"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-800 resize-none"
                      placeholder="Enter complete site address"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Purpose of Visit <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      name="purpose"
                      value={client.purpose}
                      onChange={(e) => handleChange(index, e)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-800"
                      placeholder="Enter purpose of visit"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Start Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      name="startDate"
                      value={client.startDate}
                      onChange={(e) => handleChange(index, e)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-800 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Start Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="time"
                      name="startTime"
                      value={client.startTime}
                      onChange={(e) => handleChange(index, e)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-800 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Contact Person <span className="text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={client.contactPerson}
                      onChange={(e) => handleChange(index, e)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-800"
                      placeholder="Enter contact person name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Contact Number <span className="text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="contactNumber"
                      value={client.contactNumber}
                      onChange={(e) => handleChange(index, e)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-800"
                      placeholder="Enter contact phone number"
                    />
                  </div>

                </div>
              )}
            </div>
          ))}

          {/* ── Add Client Button ── */}
          <button
            type="button"
            onClick={addClient}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 text-blue-500 font-bold text-sm flex items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <Plus size={16} /> Add Another Client
          </button>

          {/* ── Summary Bar ── */}
          <div className="bg-gradient-to-r from-[#0B1426] to-[#1e3a5f] rounded-2xl px-5 py-4 flex items-center justify-between">
            <div className="text-white">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Clients</p>
              <p className="text-2xl font-black">{clients.length}</p>
            </div>
            <div className="text-white text-right">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ready</p>
              <p className="text-2xl font-black text-emerald-400">
                {clients.filter(isComplete).length}
                <span className="text-white/40 text-base font-bold"> / {clients.length}</span>
              </p>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-wider disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              {loading
                ? 'Submitting...'
                : `Submit ${clients.length > 1 ? `${clients.length} Requests` : 'Request'}`}
            </button>
          </div>

        </div>
      </form>
    </EmployeeLayout>
  );
};

export default EmployeeSiteVisitRequest;
