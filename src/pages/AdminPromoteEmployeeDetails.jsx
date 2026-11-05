import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, TrendingUp, X, CheckCircle, Clock } from 'lucide-react';

const AdminPromoteEmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1); // 1 = form, 2 = review
  const [submitting, setSubmitting] = useState(false);
  
  // Historical stats
  const [stats, setStats] = useState({
    attendance: 0,
    leaves: 0,
    siteVisits: 0,
    siteVisitHours: '0h 0m'
  });

  const [formData, setFormData] = useState({
    employmentType: 'Regular',
    empCode: '',
    role: '',
    department: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    salary: '',
    reason: ''
  });

  useEffect(() => {
    fetchEmployeeDetails();
  }, [id]);

  const fetchEmployeeDetails = async () => {
    try {
      const response = await api.get('/admin/employees');
      const emp = response.data.employees.find(e => e._id === id);
      if (emp) {
        setEmployee(emp);
        setFormData(prev => ({
          ...prev,
          department: emp.department,
          role: emp.role
        }));
        fetchHistoricalStats(emp._id);
      }
    } catch (err) {
      toast.error('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalStats = async (empId) => {
    try {
      // In a real scenario, you would have an endpoint that aggregates this.
      // Here we just fetch what we can or mock the aggregation for the UI.
      const [attRes, leaveRes] = await Promise.all([
        api.get('/admin/attendance/all'),
        api.get('/admin/leaves')
      ]);
      
      const atts = attRes.data.attendanceRecords?.filter(a => a.employeeId?._id === empId) || [];
      const leaves = leaveRes.data.leaves?.filter(l => l.employeeId?._id === empId && l.status === 'Approved') || [];
      
      setStats({
        attendance: atts.length,
        leaves: leaves.length,
        siteVisits: 0, // Mocking since we don't have the site visit aggregation here yet
        siteVisitHours: '0h 0m'
      });
    } catch (error) {
      console.error('Error fetching stats', error);
    }
  };

  const generateNextId = async () => {
    try {
      const response = await api.get('/admin/employees');
      const allEmps = response.data.employees;
      const codes = allEmps.map(e => e.empCode);
      // Basic generation logic
      const numCode = codes.map(c => parseInt(c.replace(/\D/g, ''))).filter(n => !isNaN(n));
      const max = Math.max(...(numCode.length ? numCode : [1000]));
      setFormData(prev => ({ ...prev, empCode: `DB25${max + 1}` }));
    } catch (error) {
      setFormData(prev => ({ ...prev, empCode: `DB251001` }));
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitUpgrade = async () => {
    setSubmitting(true);
    try {
      // Build history item
      const newHistoryItem = {
        empCode: employee.empCode,
        employmentType: employee.employmentType || (employee.empCode?.includes('OD-IN') ? 'Intern' : 'Regular'),
        designation: employee.role,
        department: employee.department,
        startDate: employee.joinDate,
        endDate: formData.effectiveDate ? new Date(formData.effectiveDate) : new Date(),
        status: 'Completed',
        reason: formData.reason || 'Upgraded'
      };

      const updatedHistory = [...(employee.employmentHistory || []), newHistoryItem];

      const payload = {
        empCode: formData.empCode || employee.empCode,
        employmentType: formData.employmentType || employee.employmentType,
        role: formData.role || employee.role,
        department: formData.department || employee.department,
        joinDate: formData.effectiveDate ? new Date(formData.effectiveDate) : employee.joinDate,
        employmentHistory: updatedHistory
      };

      // Call the existing PUT endpoint that is already deployed to Render
      const res = await api.put(`/admin/employees/${id}`, payload);
      
      if (res.data.success) {
        toast.success('Employment upgraded successfully');
        setIsModalOpen(false);
        setStep(1);
        fetchEmployeeDetails(); // Refresh
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upgrade employee');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AdminLayout><div className="py-20 text-center">Loading...</div></AdminLayout>;
  if (!employee) return <AdminLayout><div className="py-20 text-center">Employee not found</div></AdminLayout>;

  return (
    <AdminLayout title="Employee Employment Journey" subtitle="View history and process promotions">
      
      <div className="mb-6 flex gap-3">
        <button 
          onClick={() => navigate('/admin/employees/promote')}
          className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
          Back to Selection
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Profile & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center">
             <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full mb-4 overflow-hidden border-4 border-white shadow-sm flex items-center justify-center font-bold text-2xl text-slate-400">
                {employee.profileImage ? (
                  <img src={employee.profileImage} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                ) : (
                  employee.fullName[0]
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-800">{employee.fullName}</h2>
              <p className="text-sm font-bold text-slate-500 mb-4">{employee.empCode}</p>
              
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {employee.employmentType || (employee.empCode?.includes('OD-IN') ? 'Intern' : 'Regular')}
              </div>

              <div className="space-y-3 text-left bg-slate-50 p-4 rounded-2xl">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Role</span>
                  <span className="font-semibold text-slate-800">{employee.role}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Department</span>
                  <span className="font-semibold text-slate-800">{employee.department}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Joined</span>
                  <span className="font-semibold text-slate-800">{new Date(employee.joinDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
          </div>

        </div>

        {/* Right Column - Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-800">Employment Journey</h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
              >
                <TrendingUp size={16} />
                Promote / Upgrade
              </button>
            </div>

            <div className="relative pl-8 border-l-2 border-slate-200 space-y-10 pb-4">
              
              {/* History Items */}
              {[...(employee.employmentHistory || [])]
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .map((hist, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow shadow-blue-500/50"></div>
                  <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-blue-900 flex items-center gap-2">
                          {hist.employmentType}
                        </h4>
                        <p className="text-sm font-semibold text-blue-600 mt-1">{hist.empCode}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        COMPLETED
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm mt-4">
                      <p><span className="text-slate-500">Designation:</span> <span className="font-medium text-slate-800">{hist.designation}</span></p>
                      <p><span className="text-slate-500">Department:</span> <span className="font-medium text-slate-800">{hist.department}</span></p>
                      <p className="col-span-2 text-blue-700 mt-2 text-xs font-bold">
                        {new Date(hist.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} → {hist.endDate ? new Date(hist.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Current Item */}
              <div className="relative">
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow shadow-blue-500/50"></div>
                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-blue-900 flex items-center gap-2">
                        ⭐ {employee.employmentType || (employee.empCode?.includes('OD-IN') ? 'Intern' : 'Regular')} (Current)
                      </h4>
                      <p className="text-sm font-semibold text-blue-600 mt-1">{employee.empCode}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm mt-4">
                    <p><span className="text-slate-500">Designation:</span> <span className="font-medium text-slate-800">{employee.role}</span></p>
                    <p><span className="text-slate-500">Department:</span> <span className="font-medium text-slate-800">{employee.department}</span></p>
                    <p className="col-span-2 text-blue-700 mt-2 text-xs font-bold">
                      {new Date(employee.joinDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} → Present
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Upgrade Employment</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current</p>
                    <p className="font-bold text-slate-800">{employee.employmentType || (employee.empCode?.includes('OD-IN') ? 'Intern' : 'Regular')} • {employee.empCode}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">New Employment Type *</label>
                      <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none">
                        <option value="Regular">Regular Employee</option>
                        <option value="Contract">Contract</option>
                        <option value="Senior Employee">Senior Employee</option>
                        <option value="Manager">Manager</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">New Employee ID *</label>
                      <div className="flex gap-2">
                        <input type="text" name="empCode" value={formData.empCode} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-blue-700" placeholder="EMP-XXX" />
                        <button type="button" onClick={generateNextId} className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors">Auto</button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">New Designation *</label>
                      <input type="text" name="role" value={formData.role} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">New Department *</label>
                      <input type="text" name="department" value={formData.department} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Effective Date *</label>
                      <input type="date" name="effectiveDate" value={formData.effectiveDate} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Reason for Upgrade</label>
                      <input type="text" name="reason" value={formData.reason} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" placeholder="e.g. Successful Internship" />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
                    <button type="button" onClick={() => setStep(2)} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl">Review & Continue</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  
                  <div className="flex items-center gap-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current</p>
                      <h4 className="font-bold text-slate-800">{employee.employmentType || (employee.empCode?.includes('OD-IN') ? 'Intern' : 'Regular')}</h4>
                      <p className="text-sm font-semibold text-slate-500">{employee.empCode}</p>
                    </div>
                    <div className="text-slate-300">
                      <ArrowLeft className="rotate-180" size={32} />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">New</p>
                      <h4 className="font-bold text-blue-800">{formData.employmentType}</h4>
                      <p className="text-sm font-bold text-blue-600">{formData.empCode}</p>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                    <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                      <CheckCircle size={18} /> Data That Will Be Preserved
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm font-medium text-green-700">
                      <p>✓ Attendance history</p>
                      <p>✓ Leave history</p>
                      <p>✓ Site Visit history</p>
                      <p>✓ Task history</p>
                      <p>✓ Previous Employee ID</p>
                      <p>✓ Performance history</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 text-amber-800 text-sm font-medium rounded-xl border border-amber-100">
                    Warning: All previous employment data will remain available in the employee's history. The employee will continue logging in with their same credentials.
                  </div>

                  <div className="pt-4 flex justify-between gap-3">
                    <button type="button" onClick={() => setStep(1)} disabled={submitting} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">Back</button>
                    <button type="button" onClick={submitUpgrade} disabled={submitting} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2">
                      {submitting ? 'Upgrading...' : 'Confirm Upgrade'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPromoteEmployeeDetails;
