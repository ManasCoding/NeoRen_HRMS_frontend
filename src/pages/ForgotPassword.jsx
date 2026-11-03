import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = ({ isAdmin = false }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Timer state
  const [timer, setTimer] = useState(30);
  
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Handle OTP Input
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/forgot-password', { email, isAdmin });
      if (res.data.success) {
        setStep(2);
        setTimer(30);
        if (res.data.demoOtp) {
          alert(`DEMO MODE: Your OTP is ${res.data.demoOtp}`);
        }
      }
    } catch (err) {
      if (!err.response) {
        // Network error — server is not reachable
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        // Server responded with an error (e.g. 404 account not found, 500 SMTP error)
        setError(err.response.data?.message || 'Failed to send recovery code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const code = otp.join('');
      const res = await api.post('/verify-otp', { email, otp: code, isAdmin });
      if (res.data.success) {
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/reset-password', { email, newPassword, isAdmin });
      if (res.data.success) {
        setStep(4);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let strength = 0;
    if (newPassword.length > 5) strength += 1;
    if (newPassword.length > 7) strength += 1;
    if (/[A-Z]/.test(newPassword)) strength += 1;
    if (/[0-9]/.test(newPassword)) strength += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1;
    return Math.min(strength, 4);
  };
  
  const strength = getPasswordStrength();
  const strengthColors = ['bg-slate-200', 'bg-red-500', 'bg-amber-500', 'bg-emerald-400', 'bg-emerald-600'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const StepperItem = ({ num, title, subtitle, current }) => {
    const isCompleted = step > num;
    const isActive = step === num;
    return (
      <div className={`flex flex-col items-center flex-1 transition-all duration-500 ${isActive || isCompleted ? 'opacity-100' : 'opacity-40'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black mb-3 transition-colors duration-500 ${isActive || isCompleted ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-200 text-slate-500'}`}>
          {isCompleted ? <Check size={16} /> : num}
        </div>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-[10px] text-slate-500 font-medium hidden sm:block mt-1">{subtitle}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 py-10 font-sans">
      
      {/* Top Stepper */}
      <div className="w-full max-w-4xl flex items-start justify-between mb-12 relative animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute top-4 left-0 w-full h-[2px] bg-slate-200 -z-10"></div>
        <div 
          className="absolute top-4 left-0 h-[2px] bg-blue-600 -z-10 transition-all duration-700 ease-out"
          style={{ width: `${(step - 1) * 33.33}%` }}
        ></div>
        <StepperItem num={1} title="Forgot Password" subtitle="Enter your registered email" />
        <StepperItem num={2} title="Verify Email (OTP)" subtitle="Enter the OTP sent to your email" />
        <StepperItem num={3} title="Reset Password" subtitle="Create your new password" />
        <StepperItem num={4} title="Success" subtitle="Password reset successful" />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[420px] bg-white rounded-[32px] p-10 md:p-12 shadow-xl shadow-slate-200/50 relative overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-black rounded-[20px] flex items-center justify-center shadow-lg mb-4 overflow-hidden">
            <img src="/logo.jpeg" alt="CitiCon" className="w-full h-full object-cover p-1" />
          </div>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">
            CitiCon Pvt. Ltd.
          </p>
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Reset Your Password</h2>
              <p className="text-slate-500 text-sm font-medium">
                Enter your registered email address to receive OTP.
              </p>
            </div>

            {error && <div className="text-rose-500 text-xs font-bold text-center mb-4">{error}</div>}

            <form onSubmit={handleSendCode}>
              <div className="mb-8">
                <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-widest">
                  {isAdmin ? 'Username' : 'Work Email or Employee Code'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isAdmin ? "admin_username" : "employee@citicon.com"}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[16px] text-sm font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-[16px] text-sm font-black hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>

            <button onClick={() => navigate(isAdmin ? '/admin/login' : '/login')} className="mt-8 flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeft size={14} /> Back to Login
            </button>
          </div>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Verify Your Email</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We have sent a 6-digit OTP to<br />
                <span className="font-bold text-slate-800">{email}</span>
              </p>
            </div>

            {error && <div className="text-rose-500 text-xs font-bold text-center mb-4">{error}</div>}

            <form onSubmit={handleVerifyCode}>
              <div className="flex justify-between gap-2 mb-6">
                {otp.map((data, index) => (
                  <input
                    className="w-12 h-14 bg-white border border-slate-200 rounded-[12px] text-xl text-center font-black text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    type="text"
                    name="otp"
                    maxLength="1"
                    key={index}
                    value={data}
                    onChange={e => handleChange(e.target, index)}
                    onKeyDown={e => handleKeyDown(e, index)}
                    ref={el => inputRefs.current[index] = el}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <div className="text-center mb-8">
                <p className="text-xs font-bold text-slate-500">
                  Resend OTP in <span className="text-blue-600">00:{timer.toString().padStart(2, '0')}</span>
                </p>
                {timer === 0 && (
                  <button type="button" onClick={handleSendCode} className="text-xs font-bold text-blue-600 mt-2 hover:underline">
                    Resend OTP Now
                  </button>
                )}
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-[16px] text-sm font-black hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <button onClick={() => setStep(1)} className="mt-8 flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeft size={14} /> Back to Login
            </button>
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Create New Password</h2>
              <p className="text-slate-500 text-sm font-medium">
                Please enter your new password.
              </p>
            </div>

            {error && <div className="text-rose-500 text-xs font-bold text-center mb-4">{error}</div>}

            <form onSubmit={handleResetPassword}>
              <div className="mb-6">
                <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-widest">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-[16px] text-sm font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Password Strength Bar */}
                {newPassword && (
                  <div className="mt-3 animate-in fade-in">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                       <div className={`h-full ${strengthColors[strength]} transition-all duration-300`} style={{width: `${(strength/4)*100}%`}}></div>
                    </div>
                    <p className={`text-[10px] font-bold mt-1.5 ${strengthColors[strength].replace('bg-', 'text-')}`}>
                      {strengthLabels[strength]} Password
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-widest">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-[16px] text-sm font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-[16px] text-sm font-black hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <button onClick={() => navigate(isAdmin ? '/admin/login' : '/login')} className="mt-8 flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeft size={14} /> Back to Login
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="animate-in fade-in zoom-in-95 duration-500 text-center flex flex-col items-center">
            
            <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-50 rounded-full animate-ping opacity-70" style={{ animationDuration: '3s' }}></div>
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center relative z-10">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                  <Check size={32} strokeWidth={3} />
                </div>
              </div>
              {/* Fake Confetti Dots */}
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400"></div>
              <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-rose-400"></div>
              <div className="absolute top-1/2 -left-2 w-1.5 h-1.5 rounded-full bg-blue-400"></div>
              <div className="absolute bottom-2 right-8 w-2 h-2 rounded-full bg-purple-400"></div>
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-3">Password Reset<br/>Successful!</h2>
            <p className="text-slate-500 text-sm font-medium mb-10 max-w-[250px]">
              Your password has been updated successfully.
            </p>

            <button onClick={() => navigate(isAdmin ? '/admin/login' : '/login')} className="w-full py-4 bg-blue-600 text-white rounded-[16px] text-sm font-black hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all">
              Go to Login
            </button>
          </div>
        )}
      </div>

      {/* Security Tip Footer */}
      <div className="w-full max-w-4xl mt-10 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800">Security Tip</h4>
          <p className="text-xs font-medium text-slate-500 mt-0.5">For your security, do not share your OTP or password with anyone.</p>
        </div>
      </div>

    </div>
  );
};

export default ForgotPassword;
