import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const LoginPage = ({ isAdmin = false }) => {
  const [loginId, setLoginId] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [employeeType, setEmployeeType] = useState('regular');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getPrefix = () => employeeType === 'regular' ? 'OG25' : 'CK';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="bg-surface rounded-[24px] p-10 md:p-12 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_20px_25px_-5px_rgba(0,0,0,0.03),0_0_0_1px_rgba(0,0,0,0.02)]">
          <div className="flex justify-center mb-8">
            <img src="/logo.jpeg" alt="Company Logo" className="w-16 h-16 rounded-[16px] object-cover shadow-[0_8px_16px_rgba(15,23,42,0.12)]" />
          </div>
          
          <div className="text-center mb-10">
            <div className="text-text-muted text-[0.85rem] font-bold uppercase tracking-[1.5px] mb-2">
              NeoRen Enterprise Pvt Ltd
            </div>
            <h1 className="text-text-main text-2xl font-semibold tracking-tight mb-2">
              {isAdmin ? 'Admin Portal' : 'Employee Portal'}
            </h1>
            <p className="text-text-muted text-sm">
              Enter your credentials to continue
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-500 p-3.5 rounded-xl text-sm font-medium text-center mb-6 flex items-center justify-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isAdmin && (
              <div className="flex p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setEmployeeType('regular')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
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
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                    employeeType === 'kitchen'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Cloud Kitchen
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-text-main text-sm font-semibold" htmlFor="login_id">
                {isAdmin ? 'Username' : 'Employee Code'}
              </label>
              {isAdmin ? (
                <input
                  type="text"
                  id="login_id"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full p-3.5 bg-background border border-border rounded-xl text-sm text-text-main transition-all duration-200 focus:outline-none focus:border-slate-400 focus:bg-surface focus:ring-4 focus:ring-slate-900/5"
                  placeholder="admin_username"
                  required
                />
              ) : (
                <div className="flex items-stretch w-full bg-background border border-border rounded-xl transition-all duration-200 focus-within:border-slate-400 focus-within:bg-surface focus-within:ring-4 focus-within:ring-slate-900/5 overflow-hidden">
                  <div className="flex items-center justify-center pl-3.5 pr-2 bg-slate-50/50 text-slate-500 font-medium text-sm select-none border-r border-border">
                    {getPrefix()}
                  </div>
                  <input
                    type="text"
                    id="login_id"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                    className="flex-1 p-3.5 bg-transparent border-none text-sm text-text-main focus:outline-none focus:ring-0 w-full"
                    placeholder="001"
                    autoComplete="off"
                    required
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mt-1">
                <label className="block text-text-main text-sm font-semibold" htmlFor="password">
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
                  className="w-full p-3.5 pr-12 bg-background border border-border rounded-xl text-sm text-text-main transition-all duration-200 focus:outline-none focus:border-slate-400 focus:bg-surface focus:ring-4 focus:ring-slate-900/5"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full p-3.5 bg-primary text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/15 active:translate-y-0"
            >
              Sign In to Portal
            </button>
          </form>
        </div>
      </div>
      
      <div className="fixed bottom-6 w-full text-center text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
        Designed & Developed by <span className="text-slate-400">ODITECH GLOBAL PVT. LTD.</span>
      </div>
    </div>
  );
};

export default LoginPage;
