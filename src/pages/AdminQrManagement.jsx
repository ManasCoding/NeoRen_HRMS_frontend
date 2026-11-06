import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { 
  QrCode, RefreshCw, Download, Printer, Maximize2, Minimize2, 
  ShieldCheck, Clock, Settings, Sparkles, Check, AlertCircle, ExternalLink
} from 'lucide-react';
import { getOfficeQr, getQrSettings, updateQrSettings } from '../services/qrAttendanceApi';

const AdminQrManagement = () => {
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [expirySetting, setExpirySetting] = useState(60);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const timerRef = useRef(null);

  // Fetch live QR token & data
  const fetchQrCode = async () => {
    try {
      setLoading(true);
      const res = await getOfficeQr();
      if (res.success) {
        setQrData(res);
        setCountdown(res.expirySeconds || 60);
        setExpirySetting(res.expirySeconds || 60);
      }
    } catch (err) {
      console.error('Failed to generate live office QR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQrCode();
  }, []);

  // Live countdown clock & auto-refresh
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchQrCode();
          return expirySetting;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(clockInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [expirySetting]);

  const handleUpdateExpiry = async (newVal) => {
    try {
      setSavingSettings(true);
      await updateQrSettings({ qr_token_expiry_seconds: newVal });
      setExpirySetting(newVal);
      fetchQrCode();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDownload = () => {
    if (!qrData?.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrData.qrDataUrl;
    a.download = `Oditech_Office_QR_${Date.now()}.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout
      title="QR Code Management"
      subtitle="Dynamic, cryptographically signed office QR code terminal for Google Lens and mobile attendance."
    >
      {/* Full-Screen Kiosk Mode (for Office Reception / Wall Display) */}
      {isKioskMode ? (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-8 sm:p-12 overflow-hidden selection:bg-emerald-500">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-lg shadow-emerald-500/10 flex items-center justify-center">
                <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">NEOREN ENTERPRISE</h1>
                <p className="text-xs font-bold text-emerald-400 tracking-[0.2em] uppercase">Smart QR Attendance Terminal</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-2xl font-mono font-bold text-white tracking-wider">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <button
                onClick={() => setIsKioskMode(false)}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2 text-xs font-bold"
              >
                <Minimize2 size={18} />
                <span>Exit Fullscreen</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-6">
            <div className="relative p-6 bg-white rounded-3xl shadow-2xl shadow-emerald-900/20 border-4 border-emerald-500/30 flex flex-col items-center">
              {loading ? (
                <div className="w-80 h-80 flex items-center justify-center">
                  <RefreshCw size={40} className="animate-spin text-slate-400" />
                </div>
              ) : (
                <img src={qrData?.qrDataUrl} alt="Office QR Code" className="w-80 h-80 sm:w-96 sm:h-96 object-contain rounded-2xl" />
              )}

              <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Refreshes in {countdown}s</span>
              </div>
            </div>

            <div className="mt-8 text-center max-w-md">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Scan with Google Lens or Camera
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Point your phone camera to instantly record Check-In or Check-Out
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-6 text-center text-xs text-slate-500 font-medium">
            Oditech HRMS • Anti-Spoofing Signed Token Security Enabled
          </div>
        </div>
      ) : null}

      {/* Standard Management View */}
      <div className="space-y-6">
        {/* Main QR Display Card & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* QR Terminal Card */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Live Office QR Terminal</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchQrCode}
                  disabled={loading}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                  title="Force Regenerate Token"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Regenerate</span>
                </button>

                <button
                  onClick={() => setIsKioskMode(true)}
                  className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  title="Open Fullscreen Kiosk Mode for Office Display"
                >
                  <Maximize2 size={14} />
                  <span>Kiosk Display</span>
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="p-5 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 relative my-2">
              {loading ? (
                <div className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                  <RefreshCw size={36} className="animate-spin text-slate-400" />
                </div>
              ) : (
                <img
                  src={qrData?.qrDataUrl}
                  alt="Dynamic Office QR Code"
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain bg-white p-3 rounded-2xl shadow-md"
                />
              )}

              {/* Progress bar indicating remaining token lifetime */}
              <div className="mt-4 w-full">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 mb-1">
                  <span>Token Auto-Refresh</span>
                  <span className="text-emerald-600 font-mono">{countdown}s remaining</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / expirySetting) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* URL Target & Scan Instructions */}
            <div className="mt-4 w-full max-w-md p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Scanned URL Destination</p>
              <p className="font-mono text-xs text-blue-600 truncate">{qrData?.qrUrl || 'Generating...'}</p>
            </div>

            {/* Download & Print Buttons */}
            <div className="flex items-center gap-3 mt-6 w-full max-w-md">
              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Download size={15} />
                <span>Download PNG</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={15} />
                <span>Print Standee</span>
              </button>
            </div>
          </div>

          {/* Settings & Security Information Side Panel */}
          <div className="lg:col-span-5 space-y-6">
            {/* Expiry Settings Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">QR Token Expiry Configuration</h4>
                  <p className="text-xs text-slate-500">Security refresh frequency</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Dynamic tokens automatically invalidate old screenshots so employees cannot photograph the QR code and scan from home.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Token Refresh Duration:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 120].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleUpdateExpiry(sec)}
                      disabled={savingSettings}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        expirySetting === sec
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* How QR Attendance Works */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>Smart Verification Architecture</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] flex-shrink-0 text-white">1</div>
                  <p><strong className="text-white">Day 1 Setup:</strong> Employee scans this code using Google Lens or default camera, logs in once with Employee ID and password, and binds their mobile phone.</p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] flex-shrink-0 text-white">2</div>
                  <p><strong className="text-white">Day 2 Onward:</strong> Employee points camera at the screen. The backend immediately identifies their bound device and marks Check-In or Check-Out without any login.</p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] flex-shrink-0 text-white">3</div>
                  <p><strong className="text-white">1 Active Device Limit:</strong> Only one registered phone is permitted per employee to prevent attendance buddy-punching.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminQrManagement;
