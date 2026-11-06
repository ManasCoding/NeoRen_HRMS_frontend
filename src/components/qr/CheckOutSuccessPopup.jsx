import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Calendar, Briefcase, ShieldCheck, ArrowRight, Home } from 'lucide-react';

const CheckOutSuccessPopup = ({ data, onClose, onContinue }) => {
  const [countdown, setCountdown] = useState(10);
  const employee = data?.employee || {};
  const attendance = data?.attendance || {};
  const greeting = data?.greeting || 'GOOD EVENING';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onClose) onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  const formattedCheckIn = attendance?.checkIn
    ? new Date(attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : '--:--';

  const formattedCheckOut = attendance?.checkOut
    ? new Date(attendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const formattedDate = attendance?.date || new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const workHoursDisplay = attendance?.workHours || '0h 0m';
  const statusLabel = attendance?.status?.toUpperCase() || 'PRESENT';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100 my-auto"
        >
          {/* Top Blue Header */}
          <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-8 text-center text-white overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />

            {/* Oditech HRMS branding pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-[11px] font-bold tracking-widest uppercase mb-4">
              <ShieldCheck size={13} />
              Oditech HRMS • Smart QR
            </div>

            {/* Animated Checkmark Circle */}
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-xl shadow-blue-900/30"
              >
                <Check size={44} strokeWidth={3.5} />
              </motion.div>
            </div>

            {/* Greeting */}
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs font-black uppercase tracking-[0.25em] text-blue-200 mb-1"
            >
              {greeting}!
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
            >
              Have a Great Evening, {employee?.name || 'Team Member'}!
            </motion.h2>

            <p className="text-blue-100/90 text-sm mt-1 font-medium">
              Your check-out has been successfully recorded.
            </p>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Employee Preview */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-blue-100 border-2 border-white shadow-md flex items-center justify-center text-blue-700 font-bold text-xl flex-shrink-0">
                {employee?.profileImage ? (
                  <img src={employee.profileImage} alt={employee.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{employee?.name ? employee.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-slate-900 truncate">
                  {employee?.name || 'Employee'}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    ID: {employee?.empCode || 'N/A'}
                  </span>
                  {employee?.department && (
                    <span className="text-xs text-slate-500 font-medium truncate">
                      {employee.department}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid: Date, Check-In, Check-Out, Total Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate mt-0.5">{formattedDate}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Check-Out Time</p>
                <p className="text-xs sm:text-sm font-bold text-blue-600 truncate mt-0.5">{formattedCheckOut}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Total Work Duration</p>
                    <p className="text-base font-black text-slate-900">{workHoursDisplay}</p>
                  </div>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Warm Farewell Message */}
            <div className="text-center p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center gap-2">
              <Home size={16} className="text-blue-500 flex-shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-slate-600 italic">
                “Thank you for your hard work today. Have a safe journey home!”
              </p>
            </div>

            {/* Actions & Countdown */}
            <div className="space-y-3 pt-2">
              <button
                onClick={onContinue || onClose}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-[0.98]"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>

              <div className="text-center">
                <p className="text-[11px] font-medium text-slate-400">
                  Auto-closing in <span className="font-bold text-slate-700">{countdown}s</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CheckOutSuccessPopup;
