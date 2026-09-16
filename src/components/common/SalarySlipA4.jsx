import React from 'react';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n || 0);

const fmtNum = (n) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Header = ({ data, employee }) => {
  const monthName = new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long' });
  // Always show last date of the payslip month as "Generated On"
  const lastDayOfMonth = new Date(data.year, data.month, 0); // day 0 of next month = last day of current month
  const generatedOn = lastDayOfMonth.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        {/* Left side: Logo + Divider + Company Info */}
        <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
          {/* Logo - no circular crop */}
          <div style={{ width: 120, height: 110, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
            <img src="/logo.png" alt="CitiCon Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
          </div>

          {/* Vertical divider */}
          <div style={{ width: 1.5, height: 100, backgroundColor: '#ccc', margin: '0 18px', flexShrink: 0 }}></div>

          {/* Company text info */}
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#000', letterSpacing: 0.5, lineHeight: 1.1, marginBottom: 2 }}>CitiCon</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 6, lineHeight: 1.2 }}>Pvt. Ltd</div>
            {/* Decorative underline: blue + gold */}
            <div style={{ display: 'flex', marginBottom: 12, height: 3, width: 140 }}>
              <div style={{ flex: 2, background: '#1e3a8a', borderRadius: '2px 0 0 2px' }}></div>
              <div style={{ flex: 1, background: '#ca8a04', borderRadius: '0 2px 2px 0' }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11, color: '#222', fontWeight: 500 }}>
              {/* Location */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
                </div> */}
                <div style={{ width: 1, height: 14, backgroundColor: '#ccc' }}></div>
                Plot No-8p, J.n Marg, Acharya Vihar, <br/>
                Bhubaneswar, Odisha 751022
              </div>
              {/* Email */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                </div> */}
                <div style={{ width: 1, height: 14, backgroundColor: '#ccc' }}></div>
                official@CitiCon.com
              </div>
              {/* Phone */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                </div> */}
                <div style={{ width: 1, height: 14, backgroundColor: '#ccc' }}></div>
                9124670011
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side: Salary Slip Title & Details */}
        <div style={{ textAlign: 'right', paddingTop: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#000', marginBottom: 20, letterSpacing: 0.5 }}>SALARY SLIP</div>
          <table style={{ fontSize: 11, color: '#000', borderCollapse: 'collapse', float: 'right' }}>
            <tbody>
              <tr>
                <td style={{ textAlign: 'left', paddingRight: 30, paddingBottom: 10, fontWeight: 500 }}>Payslip Month</td>
                <td style={{ textAlign: 'center', paddingRight: 20, paddingBottom: 10 }}>:</td>
                <td style={{ textAlign: 'right', paddingBottom: 10, fontWeight: 600 }}>{monthName} {data.year}</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', paddingRight: 30, paddingBottom: 10, fontWeight: 500 }}>Payroll Period</td>
                <td style={{ textAlign: 'center', paddingRight: 20, paddingBottom: 10 }}>:</td>
                <td style={{ textAlign: 'right', paddingBottom: 10, fontWeight: 600 }}>{formatDate(data.periodStart)} to {formatDate(data.periodEnd)}</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', paddingRight: 30, paddingBottom: 10, fontWeight: 500 }}>Generated On</td>
                <td style={{ textAlign: 'center', paddingRight: 20, paddingBottom: 10 }}>:</td>
                <td style={{ textAlign: 'right', paddingBottom: 10, fontWeight: 600 }}>{generatedOn}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* New GSTIN and UAN Block */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #999',
        borderRadius: 8,
        padding: '12px 20px',
        fontSize: 12,
        color: '#000',
        fontWeight: 600,
        justifyContent: 'space-between'
      }}>
        {/* GSTIN Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, flex: 1, paddingLeft: 10 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <text x="7" y="16.5" fontSize="6.5" fontWeight="bold" stroke="none" fill="#2563eb">GST</text>
          </svg>
          <div style={{ display: 'flex', gap: 15 }}>
            <span>GSTIN</span>
            <span>:</span>
            <span>21AAECO9745R1ZR</span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div style={{ width: 1, height: 24, backgroundColor: '#999', margin: '0 20px' }}></div>

        {/* CIN Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, flex: 1, justifyContent: 'flex-start' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <div style={{ display: 'flex', gap: 15 }}>
            <span>CIN</span>
            <span>:</span>
            <span>U620990D2025PTC051691</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SalarySlipA4 = ({ data, employee, containerId = 'salary-slip-print' }) => {
  const monthName = new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long' });
  const generatedDateStr = formatDate(data.generatedDate || data.createdAt);

  const earningsRows = [
    { label: 'Basic Salary',              amount: data.basicSalary },
    { label: 'House Rent Allowance',      amount: data.hra },
    { label: 'Conveyance Allowance',      amount: data.travelAllowance || data.conveyanceAllowance },
    { label: 'Medical Allowance',         amount: data.medicalAllowance },
    { label: 'Food Allowance',            amount: data.foodAllowance },
    { label: 'Special Allowance',         amount: data.specialAllowance },
    { label: 'Bonus',                     amount: data.bonus },
    { label: 'Overtime',                  amount: data.overtime },
    { label: 'Other Earnings',            amount: data.otherEarnings },
  ].filter(r => r.amount > 0);

  const deductionRows = [
    { label: 'Provident Fund',         amount: data.pf },
    { label: 'Professional Tax',       amount: data.professionalTax },
    { label: 'Income Tax',             amount: data.tds || data.incomeTax },
    { label: 'ESI',                    amount: data.esi },
    { label: 'Advance',                amount: data.advance },
    { label: 'Loan',                   amount: data.loan },
    { label: 'Penalty',                amount: data.penalty },
    { label: 'Absent Deduction',       amount: data.absentDeduction },
    { label: 'Unpaid Leave Deduction', amount: data.unpaidLeaveDeduction },
    { label: 'Late Fine',              amount: data.lateFine },
    { label: 'Other Deductions',       amount: data.otherDeductions },
  ].filter(r => r.amount > 0);

  // Helper for mock YTD - simple assumption (amount * 7 for 7 months as in design)
  // In a real app, YTD should come from data.
  const ytdMultiplier = (new Date(data.year, data.month - 1).getMonth() + 1) % 12 || 1; // Basic placeholder

  return (
    <div id={containerId} style={{
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      background: '#fff',
      width: 794,
      height: 1123,
      overflow: 'hidden',
      margin: '0 auto',
      padding: '40px',
      boxSizing: 'border-box',
      position: 'relative',
      fontSize: 11,
      color: '#000',
    }}>
      
      {/* ── HEADER ── */}
      <Header data={data} employee={employee} />
      
      <div style={{ height: 1, background: '#ddd', marginBottom: 25 }} />

      {/* ── EMPLOYEE SUMMARY ── */}
      <div style={{
        position: 'relative',
        border: '1px solid #999',
        borderRadius: 8,
        padding: '20px 25px',
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          position: 'absolute',
          top: -9,
          left: 15,
          background: '#fff',
          padding: '0 8px',
          fontWeight: 700,
          fontSize: 12,
          color: '#000'
        }}>
          EMPLOYEE SUMMARY
        </div>

        <table style={{ fontSize: 12, borderCollapse: 'collapse', lineHeight: 2.2 }}>
          <tbody>
            <tr>
              <td style={{ width: 150 }}>Employee Name</td>
              <td style={{ width: 30, textAlign: 'center' }}>:</td>
              <td style={{ fontWeight: 700 }}>{data.employeeName || employee?.fullName}</td>
            </tr>
            <tr>
              <td>Designation</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td style={{ fontWeight: 700 }}>{data.designation || employee?.role}</td>
            </tr>
            <tr>
              <td>Employee ID</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td style={{ fontWeight: 700 }}>{data.employeeCode || employee?.empCode}</td>
            </tr>
            <tr>
              <td>Date of Joining</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td style={{ fontWeight: 700 }}>{formatDate(data.joiningDate || employee?.joinDate)}</td>
            </tr>
            <tr>
              <td>Paid Days</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td style={{ fontWeight: 700 }}>{data.payableDays || data.presentDays || 0}</td>
            </tr>
            <tr>
              <td>LOP Days</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td style={{ fontWeight: 700 }}>{(data.absentDays || 0) + (data.unpaidLeaves || 0)}</td>
            </tr>
          </tbody>
        </table>

        {/* Right Attendance Data */}
        <table style={{ fontSize: 12, borderCollapse: 'collapse', lineHeight: 2.2, marginRight: 50 }}>
          <tbody>
            <tr>
              <td style={{ width: 150 }}>Working Days</td>
              <td style={{ width: 30, textAlign: 'center' }}>:</td>
              <td style={{ fontWeight: 700 }}>{data.workingDays || 0}</td>
            </tr>
            <tr>
              <td>Half Day</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td style={{ fontWeight: 700 }}>{data.halfDays || 0}</td>
            </tr>
            <tr>
              <td>Paid Leave</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td style={{ fontWeight: 700 }}>{data.paidLeaves || 0}</td>
            </tr>
            <tr>
              <td>Unpaid Leave</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td style={{ fontWeight: 700 }}>{data.unpaidLeaves || 0}</td>
            </tr>
            <tr>
              <td>Holiday</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td style={{ fontWeight: 700 }}>{data.holidays || 0}</td>
            </tr>
            <tr>
              <td>Week Off</td>
              <td style={{ textAlign: 'center' }}>:</td>
              <td style={{ fontWeight: 700 }}>{data.weeklyOffs || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── BANK & ID DETAILS ── */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Optional Watermark from the image */}
        <div style={{
          position: 'absolute',
          right: 20,
          bottom: -15,
          fontSize: 60,
          fontWeight: 900,
          color: '#f1f5f9',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0
        }}>
          MS
        </div>

        <div style={{
          fontWeight: 800,
          fontSize: 12,
          color: '#64748b',
          marginBottom: 16,
          letterSpacing: 0.5,
          position: 'relative',
          zIndex: 1
        }}>
          BANK &amp; ID DETAILS
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px 20px',
          fontSize: 12,
          position: 'relative',
          zIndex: 1
        }}>
          {/* Left Column - 4 items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><span style={{ color: '#94a3b8', fontWeight: 700, width: 45, display: 'inline-block' }}>PAN:</span> <span style={{ color: '#1e293b' }}>{data.panNumber || employee?.pan || '—'}</span></div>
            <div><span style={{ color: '#94a3b8', fontWeight: 700, width: 45, display: 'inline-block' }}>Bank:</span> <span style={{ color: '#1e293b' }}>{data.bankName || employee?.bankName || '—'}</span></div>
            <div><span style={{ color: '#94a3b8', fontWeight: 700, width: 45, display: 'inline-block' }}>IFSC:</span> <span style={{ color: '#1e293b' }}>{data.ifscCode || employee?.ifsc || '—'}</span></div>
            <div><span style={{ color: '#94a3b8', fontWeight: 700, width: 45, display: 'inline-block' }}>UPI:</span> <span style={{ color: '#1e293b' }}>{data.upiId || employee?.upi || '—'}</span></div>
          </div>
          {/* Right Column - 4 items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><span style={{ color: '#94a3b8', fontWeight: 700, width: 90, display: 'inline-block' }}>Aadhar:</span> <span style={{ color: '#1e293b' }}>{data.aadharNumber || employee?.aadhar || '—'}</span></div>
            <div><span style={{ color: '#94a3b8', fontWeight: 700, width: 90, display: 'inline-block' }}>Account No:</span> <span style={{ color: '#1e293b' }}>{data.accountNumber || employee?.accountNo || '—'}</span></div>
            <div><span style={{ color: '#94a3b8', fontWeight: 700, width: 90, display: 'inline-block' }}>Branch:</span> <span style={{ color: '#1e293b' }}>{data.branchName || employee?.branch || '—'}</span></div>
            <div><span style={{ color: '#94a3b8', fontWeight: 700, width: 90, display: 'inline-block' }}>PF A/C No:</span> <span style={{ color: '#1e293b' }}>{data.pfAccountNumber || employee?.pfAccount || '—'}</span></div>
          </div>
        </div>
      </div>

      {/* ── EARNINGS & DEDUCTIONS ── */}
      <div style={{
        border: '1px solid #999',
        borderRadius: 8,
        marginBottom: 20,
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex' }}>
          {/* Earnings Column */}
          <div style={{ flex: 1, borderRight: '1px solid #999' }}>
            <div style={{ display: 'flex', fontWeight: 700, borderBottom: '1px solid #ccc', padding: '12px 15px', backgroundColor: '#fafafa' }}>
              <div style={{ flex: 2 }}>EARNINGS</div>
              <div style={{ flex: 1, textAlign: 'right' }}>AMOUNT (₹)</div>
              <div style={{ flex: 1, textAlign: 'right' }}>YTD (₹)</div>
            </div>
            <div style={{ padding: '10px 15px', minHeight: 140 }}>
              {earningsRows.map((r, i) => (
                <div key={i} style={{ display: 'flex', marginBottom: 12 }}>
                  <div style={{ flex: 2 }}>{r.label}</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>{fmtNum(r.amount)}</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>{fmtNum((r.ytd || r.amount * 7))}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', fontWeight: 700, borderTop: '1px solid #ccc', padding: '12px 15px' }}>
              <div style={{ flex: 2 }}>TOTAL EARNINGS</div>
              <div style={{ flex: 1, textAlign: 'right' }}>{fmtNum(data.totalEarnings || data.grossSalary)}</div>
              <div style={{ flex: 1, textAlign: 'right' }}>{fmtNum((data.totalEarnings || data.grossSalary) * 7)}</div>
            </div>
          </div>

          {/* Deductions Column */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', fontWeight: 700, borderBottom: '1px solid #ccc', padding: '12px 15px', backgroundColor: '#fafafa' }}>
              <div style={{ flex: 2 }}>DEDUCTIONS</div>
              <div style={{ flex: 1, textAlign: 'right' }}>AMOUNT (₹)</div>
              <div style={{ flex: 1, textAlign: 'right' }}>YTD (₹)</div>
            </div>
            <div style={{ padding: '10px 15px', minHeight: 140 }}>
              {deductionRows.map((r, i) => (
                <div key={i} style={{ display: 'flex', marginBottom: 12 }}>
                  <div style={{ flex: 2 }}>{r.label}</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>{fmtNum(r.amount)}</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>{fmtNum((r.ytd || r.amount * 7))}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', fontWeight: 700, borderTop: '1px solid #ccc', padding: '12px 15px' }}>
              <div style={{ flex: 2 }}>TOTAL DEDUCTIONS</div>
              <div style={{ flex: 1, textAlign: 'right' }}>{fmtNum(data.totalDeductions || data.deduction)}</div>
              <div style={{ flex: 1, textAlign: 'right' }}>{fmtNum((data.totalDeductions || data.deduction) * 7)}</div>
            </div>
          </div>
        </div>
      </div>



      {/* ── NET PAYABLE SALARY ── */}
      <div style={{
        border: '1px solid #999',
        borderRadius: 8,
        padding: '15px 20px',
        marginBottom: 40,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5 }}>NET PAYABLE SALARY</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(data.netSalary)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5 }}>AMOUNT IN WORDS</div>
          <div style={{ fontSize: 11, fontWeight: 500 }}>
            {data.amountInWords || '—'}
          </div>
        </div>
      </div>

      {/* ── SIGNATURES ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px', marginTop: 80 }}>
        <div style={{ textAlign: 'center', width: 150 }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: 10, fontSize: 10, fontWeight: 500 }}>
            Employee Signature
          </div>
        </div>
        <div style={{ textAlign: 'center', width: 150 }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: 10, fontSize: 10, fontWeight: 500 }}>
            HR Manager
          </div>
        </div>
        <div style={{ textAlign: 'center', width: 150 }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: 10, fontSize: 10, fontWeight: 500 }}>
            Authorized Signatory
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, fontSize: 9, color: '#666' }}>
        <div>This is a computer generated payslip and does not require any physical signature.</div>
        <div>Generated On: {generatedDateStr}</div>
      </div>
    </div>
  );
};

export default SalarySlipA4;
