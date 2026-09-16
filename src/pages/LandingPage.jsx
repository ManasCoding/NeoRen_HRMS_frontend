import React from 'react';
import { User, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-width-[480px] animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="bg-surface rounded-[24px] p-10 md:p-14 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_20px_25px_-5px_rgba(0,0,0,0.03),0_0_0_1px_rgba(0,0,0,0.02)] text-center max-w-md mx-auto">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-[18px] overflow-hidden shadow-[0_8px_16px_rgba(15,23,42,0.12)]">
              <img
                src="/logo.jpeg"
                alt="CitiCon Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="text-text-muted text-sm font-bold uppercase tracking-[1.5px] mb-3">
            CitiCon Pvt. Ltd.
          </div>

          <h1 className="text-text-main text-3xl font-bold tracking-tight mb-3">
            Welcome to a new day
          </h1>

          <p className="text-text-muted text-[1.05rem] leading-relaxed mb-10">
            Every day is a new opportunity. Let's build something great together.
          </p>

          <div className="flex flex-col gap-4">
            <Link
              to="/login"
              className="w-full p-4 rounded-xl text-[1.05rem] font-semibold flex items-center justify-center gap-3 bg-primary text-white border-2 border-primary hover:bg-primary-hover hover:border-primary-hover hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-primary/20"
            >
              <User size={20} />
              Log in as Employee
            </Link>

            <Link
              to="/admin/login"
              className="w-full p-4 rounded-xl text-[1.05rem] font-semibold flex items-center justify-center gap-3 bg-transparent text-primary border-2 border-border hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <Lock size={20} />
              Log in as Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 w-full text-center text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
        Designed & Developed by <span className="text-slate-400">Manas Kumar Gumansingh</span>
      </div>
    </div>
  );
};

export default LandingPage;
