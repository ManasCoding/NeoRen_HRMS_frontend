import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAttendance } from '../../context/AttendanceContext';

const STATUS_OPTIONS = [
  'Present',
  'Absent',
  'Half Day',
  'Late',
  'Paid Leave',
  'Unpaid Leave',
  'Holiday',
  'Weekend'
];

const STATUS_COLORS = {
  'Present': 'bg-[#E8F8F0] text-[#00A86B] border-[#00A86B]/20',
  'Absent': 'bg-[#FDECEC] text-[#E53935] border-[#E53935]/20',
  'Half Day': 'bg-[#E3F2FD] text-[#1E88E5] border-[#1E88E5]/20',
  'Paid Leave': 'bg-[#F3E8FF] text-[#8E44AD] border-[#8E44AD]/20',
  'Unpaid Leave': 'bg-[#FFF3E0] text-[#FB8C00] border-[#FB8C00]/20',
  'Holiday': 'bg-[#E8EAF6] text-[#3F51B5] border-[#3F51B5]/20',
  'Weekend': 'bg-[#F5F5F5] text-[#757575] border-[#757575]/20',
  'Upcoming': 'bg-slate-50 text-slate-400 border-slate-200',
  'Late': 'bg-[#FFF3E0] text-[#FB8C00] border-[#FB8C00]/20'
};

const InlineAttendanceStatusEditor = ({ record, employeeId, onUpdateSuccess }) => {
  const { triggerRefresh } = useAttendance();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(record.status || 'Absent');

  const dropdownRef = useRef(null);
  const confirmRef = useRef(null);

  // Sync state if record prop changes externally
  useEffect(() => {
    setCurrentStatus(record.status || 'Absent');
  }, [record.status]);

  // Handle outside clicks to close popovers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (confirmRef.current && !confirmRef.current.contains(event.target)) {
        setShowConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStatus = (newStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }
    setSelectedStatus(newStatus);
    setIsOpen(false);
    setShowConfirm(true);
  };

  const confirmUpdate = async () => {
    setLoading(true);
    setShowConfirm(false);

    const oldStatus = currentStatus;
    
    // Optimistic UI Update
    setCurrentStatus(selectedStatus);

    try {
      const attendanceId = record._id || 'new'; // Handle missing records
      
      const payload = {
        status: selectedStatus,
        employeeId: employeeId,
        date: record.date.split('T')[0] // Format YYYY-MM-DD
      };

      const response = await api.patch(`/admin/attendance/${attendanceId}`, payload);

      if (response.data.success) {
        toast.success('Attendance updated successfully');
        triggerRefresh(); // Global refresh
        if (onUpdateSuccess) {
          onUpdateSuccess(); // Local refresh
        }
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Attendance update error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update attendance';
      toast.error(errorMessage, { duration: 5000 });
      // Rollback Optimistic UI
      setCurrentStatus(oldStatus);
    } finally {
      setLoading(false);
    }
  };

  const badgeColor = STATUS_COLORS[currentStatus] || STATUS_COLORS['Absent'];
  const displayDate = new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="relative inline-block text-left">
      <div 
        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${badgeColor} ${loading ? 'opacity-70 pointer-events-none' : ''}`}
        onClick={() => !loading && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!loading) setIsOpen(!isOpen);
          }
        }}
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-[10px] font-black uppercase tracking-widest">{currentStatus}</span>
        
        {loading ? (
          <Loader2 size={12} className="animate-spin opacity-70" />
        ) : (
          <Edit3 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        )}
      </div>

      {/* Dropdown Popover */}
      {isOpen && !showConfirm && (
        <div 
          ref={dropdownRef} 
          className="absolute z-50 mt-2 w-48 rounded-xl bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200 focus:outline-none"
          role="listbox"
        >
          <div className="py-1">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectStatus(status);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-colors hover:bg-slate-50 ${currentStatus === status ? 'text-primary bg-primary/5' : 'text-slate-700'}`}
                role="option"
                aria-selected={currentStatus === status}
              >
                <span>{status}</span>
                {currentStatus === status && <Check size={14} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            ref={confirmRef}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Edit3 size={24} />
              </div>
              <button 
                onClick={() => setShowConfirm(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 mb-2">Confirm Update</h3>
            <p className="text-sm font-medium text-slate-600 leading-relaxed mb-6">
              Change attendance for <span className="font-bold text-slate-800">{displayDate}</span> from <span className="font-bold text-slate-800">{currentStatus}</span> to <span className="font-bold text-primary">{selectedStatus}</span>?
            </p>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 px-4 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmUpdate}
                className="flex-1 py-3 px-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-transform active:scale-95"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineAttendanceStatusEditor;
