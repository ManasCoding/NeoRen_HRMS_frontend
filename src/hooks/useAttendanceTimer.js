import { useState, useEffect, useRef } from 'react';
import { calculateLiveAttendanceState } from '../utils/timerUtils';

/**
 * Single controlled React hook for live attendance timer.
 * Prevents multiple interval creation on re-renders and cleans up properly.
 *
 * @param {Object} attendanceRecord Today's attendance record from backend
 * @returns {Object} Live timer state
 */
export function useAttendanceTimer(attendanceRecord) {
  const [timerState, setTimerState] = useState(() => calculateLiveAttendanceState(attendanceRecord));
  const recordRef = useRef(attendanceRecord);
  recordRef.current = attendanceRecord;

  useEffect(() => {
    // Initial sync
    setTimerState(calculateLiveAttendanceState(attendanceRecord));

    // If no checkIn, or already checked out, or pending/rejected approval, don't run active ticker
    if (
      !attendanceRecord ||
      !attendanceRecord.checkIn ||
      attendanceRecord.checkOut ||
      attendanceRecord.autoCheckedOut ||
      attendanceRecord.checkInApprovalStatus === 'Pending' ||
      attendanceRecord.checkInApprovalStatus === 'Rejected'
    ) {
      return;
    }

    // Controlled interval ticking every second
    const intervalId = setInterval(() => {
      setTimerState(calculateLiveAttendanceState(recordRef.current, new Date()));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [
    attendanceRecord?.checkIn,
    attendanceRecord?.checkOut,
    attendanceRecord?.autoCheckedOut,
    attendanceRecord?.checkInApprovalStatus
  ]);

  return timerState;
}
