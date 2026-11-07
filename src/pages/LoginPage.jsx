import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff, QrCode, Smartphone, Sparkles, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../services/api';
import { scanQrAttendance, registerDeviceAndCheckIn } from '../services/qrAttendanceApi';

import CheckInSuccessPopup from '../components/qr/CheckInSuccessPopup';
import CheckOutSuccessPopup from '../components/qr/CheckOutSuccessPopup';
import AlreadyCompletedPopup from '../components/qr/AlreadyCompletedPopup';

const LoginPage = ({ isAdmin = false }) => {
  const [loginId, setLoginId] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [employeeType, setEmployeeType] = useState('regular');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // QR Attendance Auto-Verify States
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [qrResult, setQrResult] = useState(null);
  const [savedCredential, setSavedCredential] = useState(() => localStorage.getItem('oditech_device_credential'));

  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const isQrAttendance = searchParams.get('qr_attendance') === 'true' || 
                         searchParams.get('qr_scan') === '1' || 
                         searchParams.get('qr') === '1' || 
                         searchParams.get('qr') === 'true';

  const getPrefix = () => employeeType === 'regular' ? 'DB25' : 'CK';

  // Helper to extract device info
  const getClientInfo = () => {
    const ua = navigator.userAgent;
    let model = 'Mobile Device';
    let os = 'Android';
    let browser = 'Mobile Browser';

    if (/iphone/i.test(ua)) { model = 'iPhone'; os = 'iOS'; }
    else if (/ipad/i.test(ua)) { model = 'iPad'; os = 'iOS'; }
    else if (/pixel/i.test(ua)) { model = 'Google Pixel'; os = 'Android'; }
    else if (/samsung|sm-[a-z0-9]+/i.test(ua)) { model = 'Samsung Galaxy'; os = 'Android'; }
    else if (/android/i.test(ua)) { model = 'Android Phone'; os = 'Android'; }
    else if (/windows/i.test(ua)) { model = 'Windows PC'; os = 'Windows'; }
    else if (/macintosh/i.test(ua)) { model = 'MacBook'; os = 'macOS'; }

    if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua)) browser = 'Chrome';
    else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/edge|edg/i.test(ua)) browser = 'Edge';

    return { deviceModel: model, operatingSystem: os, browserName: browser };
  };

  // Perform automatic attendance verification for registered device
  const handleAutoAttendance = async (credential) => {
    if (!credential) return;
    try {
      setAutoVerifying(true);
      setError('');
      const clientInfo = getClientInfo();

      const res = await scanQrAttendance('PERMANENT_OFFICE_QR', credential, clientInfo);

      if (res.success) {
        if (res.token) localStorage.setItem('token', res.token);
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));
        setQrResult(res);
      } else if (res.requireAuth) {
        localStorage.removeItem('oditech_device_credential');
        setSavedCredential(null);
        setError(res.message || 'Device credential was reset. Please log in once to re-register.');
      } else {
        setError(res.message || 'Auto attendance verification failed.');
      }
    } catch (err) {
      console.error('Auto attendance error:', err);
      setError(err.message || 'Failed to auto-verify device. Please log in manually.');
    } finally {
      setAutoVerifying(false);
    }
  };

  // On Mount: If opened from QR Scan and device is already registered, auto-verify immediately!
  useEffect(() => {
    if (isAdmin) return;

    const cred = localStorage.getItem('oditech_device_credential');
    if (isQrAttendance && cred) {
      handleAutoAttendance(cred);
    }
  }, [isQrAttendance, isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    try {
      let finalLoginId;
      if (isAdmin) {
        finalLoginId = loginId.trim();
      } else {
        const prefix = getPrefix();
        const trimmedCode = employeeCode.trim();
        if (trimmedCode.toUpperCase().startsWith(prefix.toUpperCase())) {
          finalLoginId = trimmedCode;
        } else {
          finalLoginId = `${prefix}${trimmedCode}`;
        }
      }
      const cleanPassword = password.trim();

      // IF EMPLOYEE (Not Admin): Register device and check in
      if (!isAdmin) {
        const clientInfo = getClientInfo();
        
        try {
          const regRes = await registerDeviceAndCheckIn({
            qrToken: 'PERMANENT_OFFICE_QR',
            loginId: finalLoginId,
            password: cleanPassword,
            clientInfo
          });

          if (regRes.success) {
            // Save persistent device credential
            if (regRes.deviceCredential) {
              localStorage.setItem('oditech_device_credential', regRes.deviceCredential);
              setSavedCredential(regRes.deviceCredential);
            }
            if (regRes.token) localStorage.setItem('token', regRes.token);
            if (regRes.user) localStorage.setItem('user', JSON.stringify(regRes.user));

            // If scanned via QR or first-time registration, display success popup!
            if (isQrAttendance || regRes.action === 'CHECK_IN') {
              setQrResult(regRes);
              setSubmitting(false);
              return;
            }

            // Normal login navigation
            navigate(`/employee/${regRes.user?.slug || regRes.employee?.empCode}/dashboard`);
            return;
          }
        } catch (regErr) {
          // If register-and-checkin failed with credentials mismatch, show clear message
          if (regErr.message && !regErr.message.includes('QR')) {
            throw regErr;
          }
        }
      }

      // Standard fallback login
      const data = await login(finalLoginId, cleanPassword, isAdmin, isAdmin ? undefined : employeeType);
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('token', data.token);
        
        if (isAdmin) {
          navigate('/admin/dashboard');
        } else {
          navigate(`/employee/${data.user.slug}/dashboard`);
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePopupClose = () => {
    const slug = qrResult?.user?.slug || qrResult?.employee?.empCode;
    setQrResult(null);
    if (slug) {
      navigate(`/employee/${slug}/dashboard`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50/50">
      {/* Full-Screen Auto-Verifying Overlay */}
      {autoVerifying && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 p-2 shadow-2xl flex items-center justify-center animate-pulse">
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover rounded-2xl" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
              <Sparkles size={12} />
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 mb-1">Auto-Verifying Registered Device</h2>
          <p className="text-sm font-medium text-emerald-600 mb-4">Processing One-Tap Attendance...</p>

          <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-emerald-500 rounded-full w-full animate-indeterminate" />
          </div>

          <p className="text-xs text-slate-400 font-medium max-w-xs">
            Recognized your mobile browser. Recording Check-In / Check-Out without password...
          </p>
        </div>
      )}

      {/* Popups for Check-In, Check-Out, and Shifts Completed */}
      {qrResult && (
        <>
          {qrResult.action === 'CHECK_IN' && (
            <CheckInSuccessPopup
              data={qrResult}
              onClose={handlePopupClose}
            />
          )}
          {qrResult.action === 'CHECK_OUT' && (
            <CheckOutSuccessPopup
              data={qrResult}
              onClose={handlePopupClose}
            />
          )}
          {qrResult.action === 'ALREADY_COMPLETED' && (
            <AlreadyCompletedPopup
              data={qrResult}
              onClose={handlePopupClose}
            />
          )}
        </>
      )}

      <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="bg-surface rounded-[24px] p-8 sm:p-10 md:p-12 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_20px_25px_-5px_rgba(0,0,0,0.03),0_0_0_1px_rgba(0,0,0,0.02)]">
          <div className="flex justify-center mb-6">
            <img src="/logo.jpeg" alt="Company Logo" className="w-16 h-16 rounded-[16px] object-cover shadow-[0_8px_16px_rgba(15,23,42,0.12)]" />
          </div>
          
          <div className="text-center mb-6">
            <div className="text-text-muted text-[0.85rem] font-bold uppercase tracking-[1.5px] mb-1.5">
              NeoRen Enterprise Pvt Ltd
            </div>
            <h1 className="text-text-main text-2xl font-bold tracking-tight mb-1">
              {isAdmin ? 'Admin Portal' : 'Employee Portal'}
            </h1>
            <p className="text-text-muted text-xs">
              {isQrAttendance 
                ? 'Sign in once to register this phone for 1-tap attendance' 
                : 'Enter your credentials to continue'}
            </p>
          </div>

          {/* QR Attendance Mode Banner (First Time Registration Notice) */}
          {isQrAttendance && !isAdmin && (
            <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-2.5 shadow-sm">
              <div className="p-1.5 rounded-xl bg-emerald-600 text-white flex-shrink-0 mt-0.5">
                <Smartphone size={14} />
              </div>
              <div>
                <strong className="font-bold text-emerald-950 block">Office QR Device Registration</strong>
                <span>Login once below. Your phone will be registered automatically, so next time you scan you will be checked in instantly without password!</span>
              </div>
            </div>
          )}

          {/* Quick One-Tap Attendance Button for Registered Phones */}
          {savedCredential && !isAdmin && !isQrAttendance && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>Device Registered</span>
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md font-mono">1-Tap Ready</span>
              </div>
              <p className="text-xs text-slate-300 mb-3 font-medium">
                Your phone is registered. Tap below to automatically record Check-In or Check-Out!
              </p>
              <button
                type="button"
                onClick={() => handleAutoAttendance(savedCredential)}
                disabled={autoVerifying}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
              >
                <Sparkles size={14} />
                <span>One-Tap Attendance Check-In / Out</span>
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-500 p-3.5 rounded-xl text-xs font-medium text-center mb-6 flex items-center justify-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isAdmin && (
              <div className="flex p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setEmployeeType('regular')}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all duration-200 ${
                    employeeType === 'regular'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Regular Employee
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeeType('kitchen')}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all duration-200 ${
                    employeeType === 'kitchen'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Cloud Kitchen
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-text-main text-xs font-bold" htmlFor="login_id">
                {isAdmin ? 'Username' : 'Employee Code'}
              </label>
              {isAdmin ? (
                <input
                  type="text"
                  id="login_id"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full p-3 bg-background border border-border rounded-xl text-sm text-text-main transition-all duration-200 focus:outline-none focus:border-slate-400 focus:bg-surface focus:ring-4 focus:ring-slate-900/5"
                  placeholder="admin_username"
                  required
                />
              ) : (
                <div className="flex items-stretch w-full bg-background border border-border rounded-xl transition-all duration-200 focus-within:border-slate-400 focus-within:bg-surface focus-within:ring-4 focus-within:ring-slate-900/5 overflow-hidden">
                  <div className="flex items-center justify-center pl-3 pr-2 bg-slate-50/50 text-slate-500 font-bold text-xs select-none border-r border-border font-mono">
                    {getPrefix()}
                  </div>
                  <input
                    type="text"
                    id="login_id"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                    className="flex-1 p-3 bg-transparent border-none text-sm text-text-main focus:outline-none focus:ring-0 w-full font-medium"
                    placeholder="001"
                    autoComplete="off"
                    required
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-text-main text-xs font-bold" htmlFor="password">
                  Password
                </label>
                <button 
                  type="button" 
                  onClick={() => navigate(isAdmin ? '/admin/forgot-password' : '/forgot-password')} 
                  className="hidden text-[11px] font-black text-slate-400 hover:text-primary transition-colors tracking-wide"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-11 bg-background border border-border rounded-xl text-sm text-text-main transition-all duration-200 focus:outline-none focus:border-slate-400 focus:bg-surface focus:ring-4 focus:ring-slate-900/5"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full p-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/15 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Signing In & Registering...</span>
                </>
              ) : isQrAttendance ? (
                <>
                  <Smartphone size={15} />
                  <span>Sign In & Register Device</span>
                </>
              ) : (
                <span>Sign In to Portal</span>
              )}
            </button>
          </form>
        </div>
      </div>
      
      <div className="fixed bottom-4 w-full text-center text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
        Designed & Developed by <span className="text-slate-400">ODITECH GLOBAL PVT. LTD.</span>
      </div>
    </div>
  );
};

export default LoginPage;
