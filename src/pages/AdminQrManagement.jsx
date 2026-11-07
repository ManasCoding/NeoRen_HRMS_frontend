import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { 
  QrCode, RefreshCw, Download, Printer, Maximize2, Minimize2, 
  ShieldCheck, Clock, Settings, Sparkles, Check, AlertCircle, ExternalLink, Globe, Wifi, CheckCircle2
} from 'lucide-react';
import { getOfficeQr, getPermanentQr, getQrSettings, updateQrSettings } from '../services/qrAttendanceApi';

const AdminQrManagement = () => {
  const [loading, setLoading] = useState(true);
  const [qrType, setQrType] = useState('permanent'); // 'permanent' (default) or 'dynamic'
  const [qrData, setQrData] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [expirySetting, setExpirySetting] = useState(60);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Portal URL state
  const [targetUrl, setTargetUrl] = useState('https://neo-ren-hrms-frontend.vercel.app');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const timerRef = useRef(null);

  // Fetch QR Code based on mode
  const fetchQrCode = async (overrideType, overrideUrl) => {
    try {
      setLoading(true);
      const mode = overrideType || qrType;
      const urlToUse = overrideUrl !== undefined ? overrideUrl : targetUrl;

      if (mode === 'permanent') {
        const res = await getPermanentQr(urlToUse);
        if (res.success) {
          setQrData(res);
        }
      } else {
        const res = await getOfficeQr(urlToUse);
        if (res.success) {
          setQrData(res);
          setCountdown(res.expirySeconds || 60);
          setExpirySetting(res.expirySeconds || 60);
        }
      }
    } catch (err) {
      console.error('Failed to generate office QR:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const settingsRes = await getQrSettings();
        if (settingsRes.success && settingsRes.settings) {
          const loadedUrl = settingsRes.settings.qr_frontend_url || 'https://neo-ren-hrms-frontend.vercel.app';
          setTargetUrl(loadedUrl);
          setCustomUrlInput(loadedUrl);
          setExpirySetting(settingsRes.settings.qr_token_expiry_seconds || 60);
          fetchQrCode('permanent', loadedUrl);
        } else {
          fetchQrCode('permanent');
        }
      } catch (e) {
        fetchQrCode('permanent');
      }
    };
    init();
  }, []);

  // Countdown timer (only active in dynamic token mode)
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    if (qrType === 'dynamic') {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            fetchQrCode('dynamic', targetUrl);
            return expirySetting;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(clockInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qrType, expirySetting, targetUrl]);

  const handleSwitchType = (type) => {
    setQrType(type);
    fetchQrCode(type, targetUrl);
  };

  const handleUpdateExpiry = async (newVal) => {
    try {
      setSavingSettings(true);
      await updateQrSettings({ qr_token_expiry_seconds: newVal });
      setExpirySetting(newVal);
      if (qrType === 'dynamic') {
        fetchQrCode('dynamic', targetUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveUrl = async (newUrl) => {
    try {
      setSavingSettings(true);
      const cleaned = (newUrl || '').trim().replace(/\/$/, '');
      await updateQrSettings({ qr_frontend_url: cleaned });
      setTargetUrl(cleaned);
      setCustomUrlInput(cleaned);
      setIsEditingUrl(false);
      fetchQrCode(qrType, cleaned);
    } catch (err) {
      console.error('Failed to update QR portal URL:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDownload = () => {
    if (!qrData?.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrData.qrDataUrl;
    a.download = `NeoRen_Office_Permanent_QR.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout
      title="QR Code Management"
      subtitle="Permanent office QR code standee & auto-attendance terminal for Google Lens and phone cameras."
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
                <p className="text-xs text-emerald-400 font-semibold tracking-wider uppercase">Smart QR Attendance Terminal</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-black font-mono tracking-tight text-white">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <button
                onClick={() => setIsKioskMode(false)}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Exit Kiosk Mode"
              >
                <Minimize2 size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles size={14} />
              <span>Scan with Google Lens or Camera</span>
            </div>

            {/* Glowing Kiosk QR Frame */}
            <div className="relative p-6 bg-white rounded-3xl shadow-2xl shadow-emerald-500/10 border-4 border-slate-800/60 flex flex-col items-center">
              <img
                src={qrData?.qrDataUrl}
                alt="Office QR Code"
                className="w-72 h-72 sm:w-96 sm:h-96 object-contain rounded-2xl"
              />

              {qrType === 'dynamic' ? (
                <div className="mt-4 w-full">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1.5 font-mono">
                    <span>REFRESHING IN</span>
                    <span className="text-emerald-600">{countdown}s</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(countdown / expirySetting) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  <CheckCircle2 size={13} />
                  <span>Permanent Office QR • Never Expires</span>
                </div>
              )}
            </div>

            <p className="mt-6 text-slate-300 text-sm max-w-md font-medium">
              Log in once on Day 1. Next time, Google Lens marks Check-In / Check-Out automatically without password!
            </p>
          </div>

          <div className="border-t border-slate-800/80 pt-6 text-center text-xs text-slate-500 font-medium">
            Oditech HRMS • Smart One-Tap Mobile Device Binding Enabled
          </div>
        </div>
      ) : null}

      {/* Standard Management View */}
      <div className="space-y-6">
        {/* Main QR Display Card & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* QR Terminal Card */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            {/* Header with Type Switcher */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
              <div className="flex p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSwitchType('permanent')}
                  className={`flex-1 sm:flex-initial py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    qrType === 'permanent'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Sparkles size={13} className="text-emerald-500" />
                  <span>Permanent Fixed QR (Recommended)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchType('dynamic')}
                  className={`flex-1 sm:flex-initial py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    qrType === 'dynamic'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Clock size={13} />
                  <span>Dynamic 60s QR</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchQrCode(qrType, targetUrl)}
                  disabled={loading}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                  title="Reload QR Code"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
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

            {/* Permanent vs Dynamic Status Banner */}
            <div className="w-full mb-3">
              {qrType === 'permanent' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-left">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Fixed Permanent Office Standee QR — Never Expires!</span>
                  </div>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">Permanent</span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-left">
                    <Clock size={16} className="text-amber-600 flex-shrink-0" />
                    <span>Rotating Token QR — Refreshes every {expirySetting}s for kiosk screen protection</span>
                  </div>
                  <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">Expiring</span>
                </div>
              )}
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
                  alt="Office QR Code"
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain bg-white p-3 rounded-2xl shadow-md"
                />
              )}

              {/* Progress bar (only for dynamic mode) */}
              {qrType === 'dynamic' && (
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
              )}
            </div>

            {/* Scanned Destination URL Box */}
            <div className="mt-4 w-full max-w-md p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Google Lens Destination URL</p>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {qrType === 'permanent' ? 'Permanent Standee URL' : 'Expiring Token URL'}
                </span>
              </div>
              <p className="font-mono text-xs text-blue-600 break-all">{qrData?.qrUrl || 'Generating...'}</p>
            </div>

            {/* Download & Print Buttons */}
            <div className="flex items-center gap-3 mt-6 w-full max-w-md">
              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Download size={15} />
                <span>Download Standee PNG</span>
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

          {/* Settings & Configuration Side Panel */}
          <div className="lg:col-span-5 space-y-6">
            {/* How QR Attendance Works Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>1-Tap Attendance Architecture</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</div>
                  <p><strong className="text-white">Day 1 (Scan & Login):</strong> Employee scans this office QR code. Logs in once with their Employee ID & password. Their mobile phone is securely bound automatically.</p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</div>
                  <p><strong className="text-white">Day 2 Onward (No Login!):</strong> Employee points Google Lens or camera at this QR code. The system auto-verifies their registered device and immediately marks <strong className="text-emerald-400">Check-In</strong> (Morning) or <strong className="text-blue-400">Check-Out</strong> (Evening)!</p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">3</div>
                  <p><strong className="text-white">Permanent & Printable:</strong> You can print this QR code on a counter standee, poster, or wall plaque. It never expires.</p>
                </div>
              </div>
            </div>

            {/* Target Attendance Domain Configuration */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Globe size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Attendance Portal Domain</h4>
                  <p className="text-xs text-slate-500">The website opened when phone scans QR</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSaveUrl('https://neo-ren-hrms-frontend.vercel.app')}
                    disabled={savingSettings}
                    className={`w-full p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      targetUrl === 'https://neo-ren-hrms-frontend.vercel.app'
                        ? 'border-blue-500 bg-blue-50/40 text-blue-900 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Globe size={13} className="text-blue-600" />
                        <span>Live Production Cloud (Vercel)</span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">https://neo-ren-hrms-frontend.vercel.app</p>
                    </div>
                    {targetUrl === 'https://neo-ren-hrms-frontend.vercel.app' && (
                      <Check size={16} className="text-blue-600 flex-shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveUrl('http://192.168.31.33:5173')}
                    disabled={savingSettings}
                    className={`w-full p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                      targetUrl === 'http://192.168.31.33:5173'
                        ? 'border-blue-500 bg-blue-50/40 text-blue-900 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Wifi size={13} className="text-emerald-600" />
                        <span>Local Office Wi-Fi Testing (Local IP)</span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">http://192.168.31.33:5173</p>
                    </div>
                    {targetUrl === 'http://192.168.31.33:5173' && (
                      <Check size={16} className="text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                </div>

                {/* Custom Domain Input */}
                <div className="pt-2">
                  {!isEditingUrl ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingUrl(true)}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Settings size={12} />
                      <span>Enter Custom Company Domain</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="url"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://hrms.yourcompany.com"
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveUrl(customUrlInput)}
                        disabled={savingSettings || !customUrlInput}
                        className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingUrl(false)}
                        className="px-2 py-2 text-slate-500 text-xs font-semibold hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Token Settings (Visible if dynamic mode selected) */}
            {qrType === 'dynamic' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">QR Expiry Configuration</h4>
                    <p className="text-xs text-slate-500">Auto-refresh seconds</p>
                  </div>
                </div>

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
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminQrManagement;
