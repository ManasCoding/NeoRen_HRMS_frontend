import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { 
  Smartphone, Search, Filter, ShieldCheck, ShieldAlert, MoreVertical, 
  RefreshCw, CheckCircle2, XCircle, RotateCcw, Trash2, X, Eye, Clock, 
  Calendar, User, AlertTriangle, ChevronRight, Activity, ArrowUpDown
} from 'lucide-react';
import { 
  getAdminDevices, getAdminDeviceById, blockDevice, 
  unblockDevice, resetDevice, removeDevice 
} from '../services/qrAttendanceApi';

const AdminRegisteredDevices = () => {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    totalRegistered: 0,
    activeDevices: 0,
    blockedDevices: 0,
    unregisteredEmployees: 0
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [osFilter, setOsFilter] = useState('All');

  // Side Drawer / Detail Modal
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [actionProcessing, setActionProcessing] = useState(false);

  // Action Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: '', // 'block' | 'unblock' | 'reset' | 'remove'
    item: null
  });

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await getAdminDevices({
        search,
        status: statusFilter,
        os: osFilter
      });
      if (res.success) {
        setDevices(res.devices);
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Failed to load devices:', err);
      showToast('Failed to load registered devices', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [search, statusFilter, osFilter]);

  const handleOpenManageDrawer = async (item) => {
    if (!item.deviceId) {
      // Unregistered employee
      setSelectedDevice({
        employee: {
          fullName: item.employeeName,
          empCode: item.empCode,
          department: item.department,
          profileImage: item.profileImage,
          email: item.email
        },
        deviceModel: 'No device bound',
        operatingSystem: 'N/A',
        browserName: 'N/A',
        status: 'Unregistered',
        registrationDate: null,
        lastUsedDate: null,
        scanHistory: []
      });
      return;
    }

    try {
      setDrawerLoading(true);
      const res = await getAdminDeviceById(item.deviceId);
      if (res.success) {
        setSelectedDevice(res.device);
      }
    } catch (err) {
      showToast('Could not fetch device details', 'error');
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    const { type, item } = confirmModal;
    if (!item) return;

    const deviceId = item.deviceId || item.id;
    if (!deviceId) return;

    try {
      setActionProcessing(true);
      let res;
      if (type === 'block') {
        res = await blockDevice(deviceId);
      } else if (type === 'unblock') {
        res = await unblockDevice(deviceId);
      } else if (type === 'reset') {
        res = await resetDevice(deviceId);
      } else if (type === 'remove') {
        res = await removeDevice(deviceId);
      }

      if (res?.success) {
        showToast(res.message);
        setConfirmModal({ open: false, type: '', item: null });
        setSelectedDevice(null);
        fetchDevices();
      }
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setActionProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Active
          </span>
        );
      case 'Blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Blocked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Unregistered
          </span>
        );
    }
  };

  return (
    <AdminLayout
      title="Registered Devices"
      subtitle="Manage employee mobile device bindings, security statuses, and access permissions for QR attendance."
    >
      <div className="space-y-6">
        {/* Toast Alert */}
        {notification.show && (
          <div className={`p-4 rounded-2xl text-xs font-bold shadow-md flex items-center justify-between animate-in fade-in ${
            notification.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification({ show: false, message: '', type: 'success' })}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-indigo-500">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Registered</p>
            <h3 className="text-3xl font-black text-slate-900">{metrics.totalRegistered}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Mobile devices registered</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-emerald-500">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Active Devices</p>
            <h3 className="text-3xl font-black text-emerald-600">{metrics.activeDevices}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Authorized for attendance</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-rose-500">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Blocked Devices</p>
            <h3 className="text-3xl font-black text-rose-600">{metrics.blockedDevices}</h3>
            <p className="text-[11px] text-rose-500 mt-1">Access revoked by Admin</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-amber-500">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Unregistered Employees</p>
            <h3 className="text-3xl font-black text-amber-600">{metrics.unregisteredEmployees}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Eligible to bind mobile on 1st scan</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee name, ID (e.g. DB251001), or device model..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Blocked">Blocked</option>
              <option value="Unregistered">Unregistered</option>
            </select>

            {/* OS Filter */}
            <select
              value={osFilter}
              onChange={(e) => setOsFilter(e.target.value)}
              className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Operating Systems</option>
              <option value="Android">Android</option>
              <option value="iOS">Apple iOS</option>
              <option value="Windows">Windows</option>
              <option value="macOS">macOS</option>
            </select>

            <button
              onClick={fetchDevices}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Devices Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-6">Employee ID</th>
                  <th className="py-4 px-6">Mobile Device Model</th>
                  <th className="py-4 px-6">Operating System</th>
                  <th className="py-4 px-6">Browser</th>
                  <th className="py-4 px-6">Registration Date</th>
                  <th className="py-4 px-6">Last Used</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400 text-xs">
                      No matching registered devices found.
                    </td>
                  </tr>
                ) : (
                  devices.map((item) => (
                    <tr key={item.employeeId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs overflow-hidden flex-shrink-0">
                            {item.profileImage ? (
                              <img src={item.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              item.employeeName?.charAt(0) || 'E'
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{item.employeeName}</p>
                            <p className="text-[11px] text-slate-400">{item.department || 'General'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.empCode}
                        </span>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Smartphone size={15} className={item.deviceId ? 'text-slate-600' : 'text-slate-300'} />
                          <span className={`text-xs font-semibold ${item.deviceId ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                            {item.deviceModel}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-600 font-medium">
                        {item.operatingSystem}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-600">
                        {item.browserName}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-500">
                        {item.registrationDate 
                          ? new Date(item.registrationDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-500">
                        {item.lastUsedDate 
                          ? new Date(item.lastUsedDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date(item.lastUsedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {getStatusBadge(item.deviceStatus)}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenManageDrawer(item)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors text-xs font-semibold flex items-center gap-1"
                            title="Manage Device Details"
                          >
                            <Eye size={14} />
                            <span>Manage</span>
                          </button>

                          {item.deviceStatus === 'Active' && (
                            <button
                              onClick={() => setConfirmModal({ open: true, type: 'block', item })}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold"
                              title="Block Device"
                            >
                              Block
                            </button>
                          )}

                          {item.deviceStatus === 'Blocked' && (
                            <button
                              onClick={() => setConfirmModal({ open: true, type: 'unblock', item })}
                              className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors text-xs font-semibold"
                              title="Unblock Device"
                            >
                              Unblock
                            </button>
                          )}

                          {item.deviceId && (
                            <button
                              onClick={() => setConfirmModal({ open: true, type: 'reset', item })}
                              className="p-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors text-xs font-semibold"
                              title="Reset Binding (Allows employee to register new mobile)"
                            >
                              <RotateCcw size={14} />
                            </button>
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
      </div>

      {/* Side Drawer: Detailed Device Management */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Manage Registered Device</h3>
                  <p className="text-xs text-slate-500">Device security & scan logs</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDevice(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Employee Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden">
                  {selectedDevice.employee?.profileImage ? (
                    <img src={selectedDevice.employee.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedDevice.employee?.fullName?.charAt(0) || 'E'
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900">{selectedDevice.employee?.fullName}</h4>
                  <p className="text-xs text-slate-500">{selectedDevice.employee?.email}</p>
                  <span className="inline-block mt-1 font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    ID: {selectedDevice.employee?.empCode}
                  </span>
                </div>
                <div>
                  {getStatusBadge(selectedDevice.status)}
                </div>
              </div>

              {/* Hardware & Browser Specs */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Device Technical Information</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Device Model</span>
                    <span className="font-bold text-slate-800">{selectedDevice.deviceModel || 'N/A'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Operating System</span>
                    <span className="font-bold text-slate-800">{selectedDevice.operatingSystem || 'N/A'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Browser Name</span>
                    <span className="font-bold text-slate-800">{selectedDevice.browserName || 'N/A'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Last IP Address</span>
                    <span className="font-mono font-bold text-slate-800">{selectedDevice.lastIpAddress || '—'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered On</span>
                    <span className="font-medium text-slate-700">
                      {selectedDevice.registrationDate ? new Date(selectedDevice.registrationDate).toLocaleString() : 'Not registered yet'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Used</span>
                    <span className="font-medium text-slate-700">
                      {selectedDevice.lastUsedDate ? new Date(selectedDevice.lastUsedDate).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Scan History for this Device */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Recent Device Scans</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(!selectedDevice.scanHistory || selectedDevice.scanHistory.length === 0) ? (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">No scan history for this device.</p>
                  ) : (
                    selectedDevice.scanHistory.map((sh, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{sh.action}</span>
                            <span className="text-[10px] font-semibold text-slate-400">{sh.ipAddress || ''}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{sh.notes || 'Scan verified'}</p>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">
                          {new Date(sh.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Actions Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-2">
              <div className="flex items-center gap-3">
                {selectedDevice.status === 'Active' ? (
                  <button
                    onClick={() => setConfirmModal({ open: true, type: 'block', item: selectedDevice })}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldAlert size={16} />
                    <span>Block Device</span>
                  </button>
                ) : selectedDevice.status === 'Blocked' ? (
                  <button
                    onClick={() => setConfirmModal({ open: true, type: 'unblock', item: selectedDevice })}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={16} />
                    <span>Unblock Device</span>
                  </button>
                ) : null}

                {selectedDevice.id && (
                  <button
                    onClick={() => setConfirmModal({ open: true, type: 'reset', item: selectedDevice })}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                    title="Clear device binding so employee can register a new phone"
                  >
                    <RotateCcw size={16} />
                    <span>Reset Binding</span>
                  </button>
                )}

                {selectedDevice.id && (
                  <button
                    onClick={() => setConfirmModal({ open: true, type: 'remove', item: selectedDevice })}
                    className="p-2.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 transition-colors"
                    title="Remove Registration"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Confirm {confirmModal.type.toUpperCase()} Action
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              {confirmModal.type === 'block' && `Are you sure you want to block the registered device for ${confirmModal.item?.employeeName || confirmModal.item?.employee?.fullName}? The employee will not be able to mark attendance until unblocked.`}
              {confirmModal.type === 'unblock' && `Restore active status for ${confirmModal.item?.employeeName || confirmModal.item?.employee?.fullName}'s mobile device?`}
              {confirmModal.type === 'reset' && `Reset device registration for ${confirmModal.item?.employeeName || confirmModal.item?.employee?.fullName}? The current binding will be cleared and the employee will be prompted to register their new phone on next QR scan.`}
              {confirmModal.type === 'remove' && `Permanently remove this device registration for ${confirmModal.item?.employeeName || confirmModal.item?.employee?.fullName}?`}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmModal({ open: false, type: '', item: null })}
                disabled={actionProcessing}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={actionProcessing}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs ${
                  confirmModal.type === 'block' || confirmModal.type === 'remove' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {actionProcessing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminRegisteredDevices;
