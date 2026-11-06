import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Smartphone, Lock, User, AlertCircle, 
  Loader2, QrCode, CheckCircle2, ArrowRight, Eye, EyeOff, Sparkles, RefreshCw
} from 'lucide-react';
import { scanQrAttendance, registerDeviceAndCheckIn, verifyQrToken } from '../services/qrAttendanceApi';
import CheckInSuccessPopup from '../components/qr/CheckInSuccessPopup';
import CheckOutSuccessPopup from '../components/qr/CheckOutSuccessPopup';
import AlreadyCompletedPopup from '../components/qr/AlreadyCompletedPopup';

const STORAGE_KEY = 'oditech_device_credential';

const getClientDeviceInfo = () => {
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  let browser = 'Mobile Browser';
  let model = 'Mobile Device';

  if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';

  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';

  if (/iphone/i.test(ua)) model = 'iPhone';
  else if (/ipad/i.test(ua)) model = 'iPad';
  else if (/pixel/i.test(ua)) model = 'Google Pixel';
  else if (/samsung/i.test(ua)) model = 'Samsung Galaxy';
  else if (/android/i.test(ua)) model = 'Android Phone';

  return { operatingSystem: os, browserName: browser, deviceModel: model };
};

const QrAttendancePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenFromUrl = searchParams.get('token');

  // states: 'loading' | 'register' | 'verifying' | 'success' | 'error' | 'no_token'
  const [viewState, setViewState] = useState('loading');
  const [statusMessage, setStatusMessage] = useState('Verifying QR Code & Device...');
  const [errorMessage, setErrorMessage] = useState('');
  const [registrationNotice, setRegistrationNotice] = useState('');

  // First-time form fields
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Success Popups
  const [popupAction, setPopupAction] = useState(null); // 'CHECK_IN' | 'CHECK_OUT' | 'ALREADY_COMPLETED'
  const [attendanceData, setAttendanceData] = useState(null);

  useEffect(() => {
    initQrFlow();
  }, [tokenFromUrl]);

  const initQrFlow = async () => {
    setErrorMessage('');

    if (!tokenFromUrl) {
      setViewState('no_token');
      return;
    }

    // Step 1: Pre-verify token expiry
    try {
      await verifyQrToken(tokenFromUrl);
    } catch (err) {
      setViewState('error');
      setErrorMessage(err.message || 'QR Code has expired. Please scan the current code displayed at the office terminal.');
      return;
    }

    // Step 2: Check for registered device credential in localStorage
    const savedCredential = localStorage.getItem(STORAGE_KEY);
    const clientInfo = getClientDeviceInfo();

    if (!savedCredential) {
      // First-time scan on this mobile browser
      setViewState('register');
      setRegistrationNotice('Welcome! Please sign in with your Employee ID and password once to register this mobile device.');
      return;
    }

    // Step 3: Device credential exists -> Automatic Attendance Scan!
    setViewState('verifying');
    setStatusMessage('Recognizing your registered device & processing attendance...');

    try {
      const res = await scanQrAttendance(tokenFromUrl, savedCredential, clientInfo);

      if (res.success) {
        setAttendanceData(res);
        setPopupAction(res.action);
        setViewState('success');
      } else if (res.requireAuth) {
        // Device was cleared/reset on backend
        localStorage.removeItem(STORAGE_KEY);
        setViewState('register');
        setRegistrationNotice(res.message || 'Device credential not recognized. Please sign in to re-register this device.');
      } else if (res.blocked) {
        setViewState('error');
        setErrorMessage(res.message || 'Your device is blocked by Administrator.');
      } else {
        setViewState('error');
        setErrorMessage(res.message || 'Unable to record attendance.');
      }
    } catch (err) {
      if (err.expired) {
        setViewState('error');
        setErrorMessage(err.message || 'QR Code expired. Please re-scan the live code on the office terminal.');
      } else if (err.requireAuth) {
        localStorage.removeItem(STORAGE_KEY);
        setViewState('register');
        setRegistrationNotice(err.message || 'Please log in to register this device.');
      } else if (err.blocked) {
        setViewState('error');
        setErrorMessage(err.message || 'This device is blocked.');
      } else {
        setViewState('error');
        setErrorMessage(err.message || 'Network error during QR attendance.');
      }
    }
  };

  // Submit first-time login & bind device
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginId.trim() || !password.trim()) {
      setErrorMessage('Please enter your Employee Code and Password.');
      return;
    }

    setSubmitting(true);
    const clientInfo = getClientDeviceInfo();

    try {
      const res = await registerDeviceAndCheckIn({
        qrToken: tokenFromUrl,
        loginId: loginId.trim(),
        password: password.trim(),
        clientInfo
      });

      if (res.success && res.deviceCredential) {
        // Save persistent device credential
        localStorage.setItem(STORAGE_KEY, res.deviceCredential);
        if (res.employee) {
          localStorage.setItem('oditech_emp_code', res.employee.empCode);
          localStorage.setItem('oditech_emp_name', res.employee.name);
        }

        // Show Check-In popup
        setAttendanceData(res);
        setPopupAction(res.action || 'CHECK_IN');
        setViewState('success');
      } else {
        setErrorMessage(res.message || 'Registration failed. Please check credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please verify your Employee ID and password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueAfterSuccess = () => {
    // Navigate to employee dashboard if slug is known, or show completed status
    const empCode = attendanceData?.employee?.empCode || localStorage.getItem('oditech_emp_code');
    if (empCode) {
      navigate(`/employee/${empCode}/dashboard`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 selection:bg-emerald-500 selection:text-white">
      {/* Background radial gradient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 max-w-md mx-auto w-full pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md shadow-emerald-500/10 overflow-hidden flex items-center justify-center">
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-wider uppercase text-white">Oditech HRMS</h3>
            <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Smart QR Attendance</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Device Secured</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-md mx-auto w-full my-auto py-8">
        {/* Loading / Verifying State */}
        {(viewState === 'loading' || viewState === 'verifying') && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
              <Loader2 size={32} className="animate-spin text-emerald-400" />
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2">Smart QR Verification</h2>
            <p className="text-sm text-slate-400 font-medium">{statusMessage}</p>
          </div>
        )}

        {/* First-Time Employee Device Registration */}
        {viewState === 'register' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Smartphone size={28} />
              </div>
              <h2 className="text-2xl font-black text-white">First-Time Setup</h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Register your mobile device for one-tap automatic QR attendance.
              </p>
            </div>

            {registrationNotice && (
              <div className="mb-5 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2.5">
                <Sparkles size={16} className="text-emerald-400 flex-shrink-0" />
                <span>{registrationNotice}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Employee Code / ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="e.g. DB251001 or OD-001"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                🔒 <strong className="text-slate-200">One-Time Registration:</strong> This device will be securely bound to your employee profile. Future scans from this phone will automatically record attendance without requiring credentials.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying & Binding Device...</span>
                  </>
                ) : (
                  <>
                    <span>Register Mobile & Check-In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Error State */}
        {viewState === 'error' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-white mb-2">QR Scan Notice</h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
              {errorMessage || 'Unable to complete attendance scan.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                <span>Try Scanning Again</span>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl bg-transparent border border-slate-800 text-slate-400 hover:text-white font-semibold text-xs transition-all"
              >
                Go to Regular Login
              </button>
            </div>
          </div>
        )}

        {/* No Token Provided State */}
        {viewState === 'no_token' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <QrCode size={34} />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Smart QR Attendance</h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
              Please point your smartphone camera or Google Lens directly at the office terminal QR display to mark your attendance.
            </p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 mb-6">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">How it works:</p>
              <p className="text-xs text-slate-300">1. Open Google Lens or Camera on your mobile.</p>
              <p className="text-xs text-slate-300">2. Scan the dynamic office QR display.</p>
              <p className="text-xs text-slate-300">3. Tap the link to automatically record check-in / check-out!</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20"
            >
              Back to Employee Portal
            </button>
          </div>
        )}
      </div>

      {/* Success Popups */}
      {popupAction === 'CHECK_IN' && (
        <CheckInSuccessPopup
          data={attendanceData}
          onClose={() => setPopupAction(null)}
          onContinue={handleContinueAfterSuccess}
        />
      )}

      {popupAction === 'CHECK_OUT' && (
        <CheckOutSuccessPopup
          data={attendanceData}
          onClose={() => setPopupAction(null)}
          onContinue={handleContinueAfterSuccess}
        />
      )}

      {popupAction === 'ALREADY_COMPLETED' && (
        <AlreadyCompletedPopup
          data={attendanceData}
          onClose={() => setPopupAction(null)}
          onContinue={handleContinueAfterSuccess}
        />
      )}

      {/* Bottom Footer Credit */}
      <div className="relative z-10 text-center py-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
          Designed & Developed by <span className="text-slate-400">ODITECH GLOBAL PVT. LTD.</span>
        </p>
      </div>
    </div>
  );
};

export default QrAttendancePage;
