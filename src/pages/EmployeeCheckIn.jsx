import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle2, AlertCircle, Loader2, Navigation, ArrowLeft, Clock, XCircle, Hourglass, ThumbsUp } from 'lucide-react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import api from '../services/api';

const EARTH_RADIUS_M = 6371000;

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Format a Date object or ISO string as "h:mm AM/PM"
function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const EmployeeCheckIn = () => {
  const { employeeSlug } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // status: idle | locating | success | failed | already | late_pending | late_approved | late_rejected
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [coords, setCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [attendance, setAttendance] = useState(null);

  const handleFindLocation = async () => {
    setStatus('locating');
    setMessage('');

    if (!navigator.geolocation) {
      setStatus('failed');
      setMessage('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          // Fetch office settings
          const settingsRes = await api.get('/settings');
          const settings = settingsRes.data.settings;

          const officeLat = parseFloat(settings.office_lat);
          const officeLng = parseFloat(settings.office_lng);
          const radius = parseFloat(settings.geofence_radius) || 50;

          const dist = getDistanceMeters(latitude, longitude, officeLat, officeLng);
          setDistance(Math.round(dist));

          if (dist <= radius) {
            // Within geofence — check in
            const checkInRes = await api.post('/employee/attendance/check-in', {
              employeeId: user.id,
              lat: latitude,
              lng: longitude,
            });

            const data = checkInRes.data;
            if (!data.success) {
              setStatus('failed');
              setMessage(data.message || 'Check-in failed. Please try again.');
              return;
            }

            const att = data.attendance;
            setAttendance(att);

            if (data.alreadyCheckedIn) {
              // Already checked in today — show appropriate status
              const approvalStatus = att?.checkInApprovalStatus;
              if (approvalStatus === 'Pending') {
                setStatus('late_pending');
              } else if (approvalStatus === 'Approved') {
                setStatus('late_approved');
              } else if (approvalStatus === 'Rejected') {
                setStatus('late_rejected');
              } else {
                setStatus('already');
                setMessage('You have already checked in today. Your attendance is recorded.');
              }
            } else if (data.lateApprovalPending) {
              setStatus('late_pending');
            } else {
              setStatus('success');
              setMessage(`Check-in successful! You are ${Math.round(dist)}m from office.`);
              setTimeout(() => navigate(`/employee/${user.slug}/dashboard`), 2500);
            }
          } else {
            setStatus('failed');
            setMessage(`You are ${Math.round(dist)}m away from the office. Geofence radius is ${radius}m.`);
          }
        } catch (err) {
          setStatus('failed');
          setMessage('Could not verify location. Please try again.');
        }
      },
      (error) => {
        setStatus('failed');
        setMessage('Location access denied. Please allow location access.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const slug = user.slug || employeeSlug;

  return (
    <EmployeeLayout title="Attendance Check-In" subtitle="Secured location verification for your work logs.">
      <div className="max-w-2xl mx-auto pb-20">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <button 
            onClick={() => navigate(`/employee/${slug}/dashboard`)}
            className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#1e293b] transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <div className="w-20 h-20 bg-[#1e293b] rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200">
            <MapPin size={32} className="text-white" />
          </div>
          <h2 className="text-4xl font-black text-[#1e293b] mb-2">Location Verification</h2>
          <p className="text-slate-400 text-sm font-medium">You must be within the office premises to mark your attendance.</p>
        </div>

        <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden p-10 relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#1e293b]"></div>

          <div className="space-y-8">
            {/* User Profile Summary */}
            <div className="flex items-center gap-4 p-6 bg-slate-50/50 rounded-[32px] border border-slate-100">
               <div className="w-14 h-14 bg-[#1e293b] rounded-2xl flex items-center justify-center text-white font-black text-xl overflow-hidden border border-slate-200">
                 {user.profileImage ? (
                   <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                 ) : (
                   user.name?.[0] || 'U'
                 )}
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checking in as</p>
                 <h4 className="text-lg font-black text-[#1e293b]">{user.name}</h4>
               </div>
            </div>

            {/* Date/Time Display */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Today's Date</p>
                <p className="text-lg font-black text-[#1e293b]">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Time</p>
                <p className="text-lg font-black text-[#1e293b]">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            {/* ── Status Messages ─────────────────────────────────────── */}

            {/* Loading */}
            {status === 'locating' && (
              <div className="py-8 flex flex-col items-center gap-4 animate-pulse">
                <Loader2 size={40} className="text-[#1e293b] animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Verifying Coordinates...</p>
              </div>
            )}

            {/* On-time check-in success */}
            {status === 'success' && (
              <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 text-center animate-in zoom-in duration-300">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-black text-emerald-900 mb-1">Check-In Successful</h3>
                <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest">{message}</p>
              </div>
            )}

            {/* Already checked in (on time) */}
            {status === 'already' && (
              <div className="p-8 bg-amber-50 rounded-[32px] border border-amber-100 text-center animate-in zoom-in duration-300">
                <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-black text-amber-900 mb-1">Check-In Complete</h3>
                <p className="text-amber-600 text-xs font-bold uppercase tracking-widest">{message}</p>
              </div>
            )}

            {/* Location / geofence failure */}
            {status === 'failed' && (
              <div className="p-8 bg-rose-50 rounded-[32px] border border-rose-100 text-center animate-in zoom-in duration-300">
                <XCircle size={48} className="text-rose-500 mx-auto mb-4" />
                <h3 className="text-xl font-black text-rose-900 mb-1">Verification Failed</h3>
                <p className="text-rose-600 text-xs font-bold uppercase tracking-widest">{message}</p>
              </div>
            )}

            {/* ── LATE PENDING ─────────────────────────────────────────── */}
            {status === 'late_pending' && (
              <div className="p-8 bg-amber-50 rounded-[32px] border-2 border-amber-200 text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hourglass size={32} className="text-amber-600" />
                </div>
                <h3 className="text-xl font-black text-amber-900 mb-1">Late Check-In Request Submitted</h3>
                <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-6">Waiting for Admin Approval</p>

                <div className="bg-white rounded-[20px] border border-amber-100 p-5 space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-In Time</span>
                    <span className="text-sm font-black text-[#1e293b]">{fmtTime(attendance?.checkIn)}</span>
                  </div>
                  {attendance?.lateMinutes > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Late By</span>
                      <span className="text-sm font-black text-amber-600">{attendance.lateMinutes} minutes</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                    <span className="text-xs font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full">Pending Admin Approval</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested At</span>
                    <span className="text-sm font-black text-slate-500">{fmtTime(attendance?.approvalRequestedAt)}</span>
                  </div>
                </div>

                <p className="mt-5 text-[10px] text-amber-600 font-bold uppercase tracking-widest">
                  The admin will review your request shortly.
                </p>
              </div>
            )}

            {/* ── LATE APPROVED ─────────────────────────────────────────── */}
            {status === 'late_approved' && (
              <div className="p-8 bg-emerald-50 rounded-[32px] border-2 border-emerald-200 text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ThumbsUp size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-emerald-900 mb-1">Check-In Approved</h3>
                <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-6">Your attendance has been confirmed</p>

                <div className="bg-white rounded-[20px] border border-emerald-100 p-5 space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-In Time</span>
                    <span className="text-sm font-black text-[#1e293b]">{fmtTime(attendance?.checkIn)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                    <span className="text-xs font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full">Late</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved By</span>
                    <span className="text-sm font-black text-slate-600">{attendance?.approvedBy?.fullName || 'Admin'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved At</span>
                    <span className="text-sm font-black text-slate-500">{fmtTime(attendance?.approvedAt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── LATE REJECTED ─────────────────────────────────────────── */}
            {status === 'late_rejected' && (
              <div className="p-8 bg-rose-50 rounded-[32px] border-2 border-rose-200 text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle size={32} className="text-rose-600" />
                </div>
                <h3 className="text-xl font-black text-rose-900 mb-1">Check-In Rejected</h3>
                <p className="text-rose-600 text-xs font-bold uppercase tracking-widest mb-6">Your late check-in was not approved</p>

                <div className="bg-white rounded-[20px] border border-rose-100 p-5 space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-In Time</span>
                    <span className="text-sm font-black text-[#1e293b]">{fmtTime(attendance?.checkIn)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                    <span className="text-xs font-black bg-rose-100 text-rose-700 px-3 py-1 rounded-full">Check-In Rejected</span>
                  </div>
                  {attendance?.rejectionReason && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</span>
                      <span className="text-sm font-semibold text-slate-600 italic">"{attendance.rejectionReason}"</span>
                    </div>
                  )}
                </div>

                <p className="mt-5 text-[10px] text-rose-600 font-bold uppercase tracking-widest">
                  Contact your manager for assistance.
                </p>
              </div>
            )}

            {/* ── Action Buttons ─────────────────────────────────────────── */}

            {/* Main Check-In Button — only show if not in a terminal/pending state */}
            {status !== 'success' && status !== 'already' && status !== 'locating'
              && status !== 'late_pending' && status !== 'late_approved' && status !== 'late_rejected' && (
              <button
                onClick={handleFindLocation}
                className="w-full py-6 bg-[#1e293b] text-white rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-300 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                <Navigation size={20} />
                Verify Location &amp; Check In
              </button>
            )}

            {status === 'locating' && (
              <div className="w-full py-6 bg-slate-100 text-slate-400 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] text-center">
                Fetching GPS Signal...
              </div>
            )}

            {/* Disabled Check-In button for pending state */}
            {status === 'late_pending' && (
              <div className="w-full py-6 bg-slate-100 text-slate-400 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] text-center cursor-not-allowed opacity-70">
                Check-In Request Submitted
              </div>
            )}

            {/* Return to Dashboard button for completed/terminal states */}
            {(status === 'success' || status === 'already' || status === 'late_approved' || status === 'late_rejected' || status === 'late_pending') && (
              <button
                onClick={() => navigate(`/employee/${slug}/dashboard`)}
                className="w-full py-5 border-2 border-slate-100 text-slate-400 rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Return to Dashboard
              </button>
            )}
          </div>
        </div>
        
        <p className="mt-10 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest px-10 leading-relaxed">
          Official check-in time is 9:30 AM. Late arrivals require Admin approval. Your GPS must be enabled and you must be within the office radius.
        </p>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeCheckIn;
