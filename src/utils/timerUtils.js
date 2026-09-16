/**
 * Shared Attendance Timer & Live Calculation Utilities
 * Source of truth calculations based on server attendance record & current client time.
 */

export const WORK_TARGET_MINUTES = 495; // 8 Hours 15 Minutes (29,700 seconds)
export const LUNCH_START_TIME = "13:30"; // 1:30 PM
export const LUNCH_END_TIME = "14:15";   // 2:15 PM
export const MAX_OVERTIME_MINUTES = 60;   // 1 Hour (3,600 seconds)

export const formatTimerHHMM = (seconds) => {
  const totalMins = Math.floor(Math.max(0, seconds) / 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
};

/**
 * Calculates live attendance state for any given attendance record.
 * Uses exact timestamp interval matching:
 * - Interval 1: before 13:30
 * - Interval 2: after 14:15
 */
export const calculateLiveAttendanceState = (attendanceRecord, now = new Date()) => {
  if (!attendanceRecord || !attendanceRecord.checkIn) {
    return {
      statusText: 'Not Checked In',
      workingSeconds: 0,
      workingFormatted: '00h 00m',
      overtimeSeconds: 0,
      overtimeFormatted: '00h 00m',
      isOnLunchBreak: false,
      isShiftCompleted: false,
      isAutoCheckedOut: false,
      badgeStatus: 'Absent',
    };
  }

  const checkInDate = new Date(attendanceRecord.checkIn);
  if (isNaN(checkInDate.getTime())) {
    return {
      statusText: 'Not Checked In',
      workingSeconds: 0,
      workingFormatted: '00h 00m',
      overtimeSeconds: 0,
      overtimeFormatted: '00h 00m',
      isOnLunchBreak: false,
      isShiftCompleted: false,
      isAutoCheckedOut: false,
      badgeStatus: 'Absent',
    };
  }

  const isCheckedOut = !!attendanceRecord.checkOut;
  const isAutoCheckedOut = !!attendanceRecord.autoCheckedOut;
  const evalTime = isCheckedOut ? new Date(attendanceRecord.checkOut) : now;

  // Construct Lunch Start and End for checkIn date
  const y = checkInDate.getFullYear();
  const m = checkInDate.getMonth();
  const d = checkInDate.getDate();

  const [lStartH, lStartM] = LUNCH_START_TIME.split(':').map(Number);
  const [lEndH, lEndM] = LUNCH_END_TIME.split(':').map(Number);

  const lunchStart = new Date(y, m, d, lStartH, lStartM, 0);
  const lunchEnd = new Date(y, m, d, lEndH, lEndM, 0);

  // Interval 1: before lunch
  let secBeforeLunch = 0;
  if (checkInDate < lunchStart) {
    const endBefore = new Date(Math.min(evalTime.getTime(), lunchStart.getTime()));
    if (endBefore > checkInDate) {
      secBeforeLunch = Math.floor((endBefore.getTime() - checkInDate.getTime()) / 1000);
    }
  }

  // Interval 2: after lunch
  let secAfterLunch = 0;
  if (evalTime > lunchEnd) {
    const startAfter = new Date(Math.max(checkInDate.getTime(), lunchEnd.getTime()));
    if (evalTime > startAfter) {
      secAfterLunch = Math.floor((evalTime.getTime() - startAfter.getTime()) / 1000);
    }
  }

  const rawWorkedSeconds = Math.max(0, secBeforeLunch + secAfterLunch);
  const targetSeconds = WORK_TARGET_MINUTES * 60; // 29700
  const maxOvertimeSeconds = MAX_OVERTIME_MINUTES * 60; // 3600

  const workingSeconds = Math.min(rawWorkedSeconds, targetSeconds);
  const rawOvertimeSeconds = Math.max(0, rawWorkedSeconds - targetSeconds);
  const overtimeSeconds = Math.min(rawOvertimeSeconds, maxOvertimeSeconds);

  const isOnLunchBreak = !isCheckedOut && evalTime >= lunchStart && evalTime < lunchEnd && checkInDate < lunchEnd;
  const isShiftCompleted = rawWorkedSeconds >= targetSeconds;

  let statusText = 'Working';
  if (attendanceRecord.checkInApprovalStatus === 'Pending') {
    statusText = 'Approval Pending';
  } else if (attendanceRecord.checkInApprovalStatus === 'Rejected') {
    statusText = 'Check-In Rejected';
  } else if (isCheckedOut || isAutoCheckedOut) {
    statusText = 'Checked Out';
  } else if (isOnLunchBreak) {
    statusText = 'Lunch Break';
  } else if (isShiftCompleted) {
    statusText = rawOvertimeSeconds > 0 ? 'Overtime' : 'Shift Completed';
  }

  return {
    statusText,
    workingSeconds,
    workingFormatted: formatTimerHHMM(workingSeconds),
    overtimeSeconds,
    overtimeFormatted: formatTimerHHMM(overtimeSeconds),
    isOnLunchBreak,
    isShiftCompleted,
    isAutoCheckedOut,
    checkInTimeFormatted: checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    checkOutTimeFormatted: isCheckedOut ? new Date(attendanceRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : (isAutoCheckedOut ? 'AUTO' : '—')
  };
};
