import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, Calendar, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const AlreadyCompletedPopup = ({ data, onClose, onContinue }) => {
  const [countdown, setCountdown] = useState(8);
  const employee = data?.employee || {};
  const attendance = data?.attendance || {};

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
    : '--:--';

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
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100 my-auto"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-800 p-8 text-center text-white overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-purple-100 text-[11px] font-bold tracking-widest uppercase mb-4">
              <ShieldCheck size={13} />
              Oditech HRMS • Status
            </div>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white text-purple-600 flex items-center justify-center shadow-lg shadow-purple-950/30">
                <CheckCircle2 size={36} />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Attendance Completed!
            </h2>
            <p className="text-purple-200 text-sm mt-1 font-medium">
              Today's attendance is already completed for {employee?.name || 'you'}.
            </p>
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Check-In</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{formattedCheckIn}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Check-Out</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{formattedCheckOut}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Total Work Recorded</p>
                  <p className="text-base font-black text-slate-900">{attendance?.workHours || 'Shift Finished'}</p>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider bg-purple-600 text-white">
                  {attendance?.status || 'COMPLETED'}
                </span>
              </div>
            </div>

            <div className="text-center p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <Sparkles size={15} className="text-purple-500" />
              Both check-in and check-out are safely saved for today.
            </div>

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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlreadyCompletedPopup;
