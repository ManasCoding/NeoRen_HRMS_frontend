
export function getEmployeeAttendanceStatus(attendance) {
  if (!attendance || !attendance.checkIn) {
    return 'NOT CHECKED IN';
  }

  if (attendance.checkInApprovalStatus === 'Pending') {
    return 'Absent';
  }

  if (attendance.checkInApprovalStatus === 'Approved') {
    return attendance.status || 'Present';
  }

  if (attendance.checkInApprovalStatus === 'Rejected') {
    return 'Absent';
  }

  return attendance.status || 'Present';
}
