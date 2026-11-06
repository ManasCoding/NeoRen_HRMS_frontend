import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { 
  QrCode, Smartphone, Users, CheckCircle2, Clock, AlertTriangle, 
  ShieldCheck, ShieldAlert, ArrowUpRight, RefreshCw, Monitor, SmartphoneNfc, 
  ExternalLink, TrendingUp, Sparkles
} from 'lucide-react';
import { getQrStats } from '../services/qrAttendanceApi';

const AdminQrDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScansToday: 0,
    checkInsToday: 0,
    checkOutsToday: 0,
    onTimeToday: 0,
    lateToday: 0,
    totalDevices: 0,
    activeDevices: 0,
    blockedDevices: 0,
    osBreakdown: { android: 0, ios: 0, other: 0 }
  });
  const [recentScans, setRecentScans] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getQrStats();
      if (res.success) {
        setStats(res.stats);
        setRecentScans(res.recentScans || []);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch QR stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getActionBadge = (action) => {
    switch (action) {
      case 'CHECK_IN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Check-In</span>;
      case 'CHECK_OUT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Check-Out</span>;
      case 'ALREADY_COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Shift Done</span>;
      case 'BLOCKED_REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Blocked Device</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{action}</span>;
    }
  };

  return (
    <AdminLayout
      title="QR Attendance Dashboard"
      subtitle="Real-time monitoring of mobile device registrations and office QR attendance scans."
    >
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <SmartphoneNfc size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Smart QR Attendance System</h3>
              <p className="text-xs text-slate-500">
                Auto-refreshes every 30s • Last updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Stats"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <Link
              to="/admin/qr-management"
              className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <QrCode size={16} />
              <span>Office QR Display</span>
            </Link>
          </div>
        </div>

        {/* 6 Key Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-emerald-500">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Today's Total Scans</p>
            <h3 className="text-3xl font-black text-slate-900">{stats.totalScansToday}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> Today IST
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-teal-500">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">QR Check-Ins</p>
            <h3 className="text-3xl font-black text-slate-900">{stats.checkInsToday}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {stats.onTimeToday} on-time, {stats.lateToday} late
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-blue-500">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">QR Check-Outs</p>
            <h3 className="text-3xl font-black text-slate-900">{stats.checkOutsToday}</h3>
            <p className="text-[11px] text-blue-600 font-medium mt-1">Completed shifts</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-indigo-500">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Devices</p>
            <h3 className="text-3xl font-black text-slate-900">{stats.totalDevices}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Bound to employees</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-emerald-600">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Active Devices</p>
            <h3 className="text-3xl font-black text-emerald-600">{stats.activeDevices}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Permitted for scan</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-rose-500">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Blocked Devices</p>
            <h3 className="text-3xl font-black text-rose-600">{stats.blockedDevices}</h3>
            <p className="text-[11px] text-rose-500 font-medium mt-1">Access revoked</p>
          </div>
        </div>

        {/* Device Ecosystem & Fast Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* OS Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Smartphone size={18} className="text-emerald-600" />
              <span>Mobile OS Distribution</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Android Devices</span>
                  <span>{stats.osBreakdown?.android || 0}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalDevices > 0 ? ((stats.osBreakdown?.android || 0) / stats.totalDevices) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Apple iOS (iPhones)</span>
                  <span>{stats.osBreakdown?.ios || 0}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalDevices > 0 ? ((stats.osBreakdown?.ios || 0) / stats.totalDevices) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Other / Desktop</span>
                  <span>{stats.osBreakdown?.other || 0}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-400 rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalDevices > 0 ? ((stats.osBreakdown?.other || 0) / stats.totalDevices) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link 
                to="/admin/registered-devices" 
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-between"
              >
                <span>Manage all registered employee devices</span>
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

          {/* Office Terminal Standee Launch Banner */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/30">
                <Sparkles size={14} />
                <span>Live Office Reception Mode</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
                Dynamic Office QR Terminal
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm max-w-lg leading-relaxed">
                Display the dynamic signed QR code on your office reception tablet or wall display. 
                The token automatically refreshes every 60 seconds to prevent unauthorized off-site scanning.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Link
                to="/admin/qr-management"
                className="py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Monitor size={16} />
                <span>Open Terminal / Kiosk Mode</span>
              </Link>
              <Link
                to="/admin/registered-devices"
                className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all flex items-center gap-2 border border-white/10"
              >
                <Users size={16} />
                <span>View Registered Devices</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Live Recent Scans Feed */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Live Scans Feed</h3>
              <p className="text-xs text-slate-500">Real-time scan verification from registered employee devices</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
              Showing latest {recentScans.length} scans
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Employee</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Device & OS</th>
                  <th className="py-3.5 px-6">IP Address</th>
                  <th className="py-3.5 px-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentScans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400 text-xs">
                      No QR attendance scans recorded yet today.
                    </td>
                  </tr>
                ) : (
                  recentScans.map((scan, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 text-xs text-slate-500 whitespace-nowrap font-medium">
                        {new Date(scan.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs overflow-hidden">
                            {scan.profileImage ? (
                              <img src={scan.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              scan.employeeName?.charAt(0) || 'E'
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{scan.employeeName}</p>
                            <p className="text-[10px] text-slate-400">{scan.empCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        {getActionBadge(scan.action)}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-700 whitespace-nowrap">
                        <span className="font-medium">{scan.deviceModel}</span>
                        <span className="text-slate-400 text-[11px] block">{scan.operatingSystem} • {scan.browserName}</span>
                      </td>
                      <td className="py-3.5 px-6 text-xs font-mono text-slate-400 whitespace-nowrap">
                        {scan.ipAddress || '—'}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-600 truncate max-w-xs">
                        {scan.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminQrDashboard;
