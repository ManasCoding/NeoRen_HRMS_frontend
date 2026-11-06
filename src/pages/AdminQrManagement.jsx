import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { 
  QrCode, RefreshCw, Download, Printer, Maximize2, Minimize2, 
  ShieldCheck, Clock, Settings, Sparkles, Check, AlertCircle, ExternalLink, Globe, Wifi
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

  // Portal URL state
  const [targetUrl, setTargetUrl] = useState('https://neo-ren-hrms-frontend.vercel.app');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const timerRef = useRef(null);

  // Fetch live QR token & data
  const fetchQrCode = async (overrideUrl) => {
    try {
      setLoading(true);
      const urlToUse = overrideUrl !== undefined ? overrideUrl : targetUrl;
      const res = await getOfficeQr(urlToUse);
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

  // Initial load: get settings first then fetch QR
  useEffect(() => {
    const init = async () => {
      try {
        const settingsRes = await getQrSettings();
        if (settingsRes.success && settingsRes.settings) {
          const loadedUrl = settingsRes.settings.qr_frontend_url || 'https://neo-ren-hrms-frontend.vercel.app';
          setTargetUrl(loadedUrl);
          setCustomUrlInput(loadedUrl);
          setExpirySetting(settingsRes.settings.qr_token_expiry_seconds || 60);
          fetchQrCode(loadedUrl);
        } else {
          fetchQrCode();
        }
      } catch (e) {
        fetchQrCode();
      }
    };
    init();
  }, []);

  // Live countdown clock & auto-refresh
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchQrCode(targetUrl);
          return expirySetting;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(clockInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [expirySetting, targetUrl]);

  const handleUpdateExpiry = async (newVal) => {
    try {
      setSavingSettings(true);
      await updateQrSettings({ qr_token_expiry_seconds: newVal });
      setExpirySetting(newVal);
      fetchQrCode(targetUrl);
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
      fetchQrCode(cleaned);
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
            </div>

            <p className="mt-6 text-slate-400 text-sm max-w-md font-medium">
              Point your smartphone camera or Google Lens to mark today's Check-In or Check-Out automatically.
            </p>
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
                  onClick={() => fetchQrCode(targetUrl)}
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

            {/* Scanned Destination URL Box */}
            <div className="mt-4 w-full max-w-md p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Google Lens Destination URL</p>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Mobile Friendly</span>
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

          {/* Settings & Configuration Side Panel */}
          <div className="lg:col-span-5 space-y-6">
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
                <p className="text-xs text-slate-600">
                  Select where you want employee mobile phones to land:
                </p>

                {/* Preset Options */}
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
                      <span>Enter Custom Domain / URL</span>
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
