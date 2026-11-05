import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { UserPlus, X, Edit2, Trash2, CheckCircle2, Users, TrendingUp } from 'lucide-react';
import api from '../services/api';
import SearchHeader from '../components/SearchHeader';

const generateNextEmpCode = (existingEmployees) => {
  if (!existingEmployees || existingEmployees.length === 0) {
    return 'DB251001';
  }
  
  const codes = existingEmployees
    .map(emp => emp.empCode)
    .filter(code => typeof code === 'string' && code.trim() !== '');
    
  if (codes.length === 0) {
    return 'DB251001';
  }
  
  let maxNum = -1;
  let detectedPrefix = 'DB25';
  
  for (const code of codes) {
    // Match letters/symbols followed by numbers, e.g., "OG252523" or "OG25-001" or "EMP101"
    const match = code.match(/^([a-zA-Z\-_]+)?(\d+)$/);
    if (match) {
      const prefix = match[1] || '';
      const num = parseInt(match[2], 10);
      if (num > maxNum) {
        maxNum = num;
        detectedPrefix = prefix;
      }
    }
  }
  
  if (maxNum !== -1) {
    const nextNum = maxNum + 1;
    const matchedCode = codes.find(c => c.endsWith(maxNum.toString()));
    const numStr = matchedCode?.match(/\d+$/)?.[0] || '';
    const padding = numStr.length;
    const nextNumStr = String(nextNum).padStart(padding, '0');
    return `${detectedPrefix}${nextNumStr}`;
  }
  
  return 'DB251001';
};

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [success, setSuccess] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    empCode: '',
    email: '',
    phone: '',
    department: 'Software Development',
    profileImage: '',
    role: 'Team Member',
    password: '123456'
  });

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/admin/employees');
      if (response.data.success) {
        setEmployees(response.data.employees);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);


  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/admin/employees', formData);
      if (response.data.success) {
        setSuccess('Employee added successfully!');
        setFormData({
          fullName: '',
          empCode: '',
          email: '',
          phone: '',
          department: 'Software Development',
          role: 'Web Developer',
          password: '123456',
          profileImage: ''
        });
        fetchEmployees();
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding employee');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent navigation to details page
    if (window.confirm('Are you sure you want to move this employee to archives?')) {
      try {
        const response = await api.delete(`/admin/employees/${id}`);
        if (response.data.success) {
          fetchEmployees();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting employee');
      }
    }
  };

  const departments = ['All', ...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = emp.fullName.toLowerCase().includes(searchLower) ||
                         emp.empCode.toLowerCase().includes(searchLower) ||
                         emp.employmentHistory?.some(h => h.empCode && h.empCode.toLowerCase().includes(searchLower));
    const matchesDept = filterDept === 'All' || emp.department === filterDept;
    return matchesSearch && matchesDept;
  });


  return (
    <AdminLayout title="Employee Management" subtitle="Add, edit, or deactivate employee profiles.">
      <div className="mb-6 flex justify-end gap-3">
        <button 
          onClick={() => navigate('/admin/employees/ex')}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all shadow-sm"
        >
          <Users size={18} />
          Ex-Employees
        </button>
        <button 
          onClick={() => navigate('/admin/employees/promote')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-2xl text-sm font-bold hover:bg-blue-100 transition-all shadow-sm"
        >
          <TrendingUp size={18} />
          Promote / Upgrade Employee
        </button>
        <button 
          onClick={() => {
            const nextCode = generateNextEmpCode(employees);
            setFormData(prev => ({ ...prev, empCode: nextCode }));
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/10"
        >
          <UserPlus size={18} />
          Add New Employee
        </button>
      </div>

      <SearchHeader 
        title="Total Employees"
        subtitle="Employees who are total today."
        count={employees.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search employees..."
        filterOptions={departments}
        filterValue={filterDept}
        onFilterChange={setFilterDept}
      />

      <div className="bg-surface rounded-[24px] border border-border shadow-sm overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Dept & Role</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEmployees.map((emp) => (
                <tr 
                  key={emp._id} 
                  onClick={() => navigate(`/admin/employees/${emp._id}`)}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/5 text-primary rounded-full flex items-center justify-center font-bold overflow-hidden border border-border">
                        {emp.profileImage ? (
                          <img src={emp.profileImage} alt={emp.fullName} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                        ) : (
                          emp.fullName[0]
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">{emp.fullName}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{emp.empCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-text-main font-bold">{emp.department || 'Not Assigned'}</p>
                    <p className="text-xs text-sky-600 font-bold">{emp.role || 'Team Member'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-text-main">{emp.email}</p>
                    <p className="text-[10px] text-text-muted">{emp.phone || '-'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      emp.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-text-muted">
                    {new Date(emp.joinDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => handleDelete(e, emp._id)}
                        className="p-2 text-text-muted hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-surface w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-border flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-text-main">Add New Employee</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {success ? (
                <div className="flex flex-col items-center justify-center py-10 text-emerald-600 animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="font-bold text-lg">{success}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Full Name</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Employee Code</label>
                      <input type="text" name="empCode" value={formData.empCode} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all" placeholder="OD-001" required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all" placeholder="john@company.com" required />
                  </div>

                   <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Department</label>
                      <select name="department" value={formData.department} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-bold">
                        <option>Engineering</option>
                        <option>Design</option>
                        <option>Human Resources</option>
                        <option>Marketing</option>
                        <option>Product</option>
                        <option>Finance</option>
                        <option>Analytics</option>
                        <option>Sales</option>
                        <option>Quality Assurance</option>
                        <option>IT Support</option>
                        <option>Management</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Designation / Role</label>
                      <input type="text" name="role" value={formData.role} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-bold" placeholder="e.g. Web Developer" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Phone Number</label>
                      <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all" placeholder="+91 987..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Account Status</label>
                      <select name="status" value={formData.status || 'Active'} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-bold">
                        <option value="Active">Active Employee</option>
                        <option value="Ex-Employee">Ex-Employee</option>
                      </select>
                    </div>
                  </div>

                   <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Login Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-bold" placeholder="Set a secure password" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Profile Photo (Optional)</label>
                    <div className="flex items-center gap-4">
                      {formData.profileImage && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-border">
                          <img src={formData.profileImage} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                        </div>
                      )}
                      <label className="flex-1 cursor-pointer">
                        <div className="w-full p-3 bg-slate-50 border border-border border-dashed rounded-xl text-center text-xs font-bold text-text-muted hover:border-primary transition-all">
                          {loadingPhoto ? 'Uploading...' : 'Click to upload photo'}
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            setLoadingPhoto(true);
                            const uploadData = new FormData();
                            uploadData.append('avatar', file);
                            try {
                              const res = await api.post('/employee/upload-avatar/temp', uploadData);
                              if (res.data.success) {
                                setFormData({ ...formData, profileImage: res.data.profileImage });
                              }
                            } catch (err) {
                              alert('Upload failed');
                            } finally {
                              setLoadingPhoto(false);
                            }
                          }} 
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Create Employee Account'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminEmployees;
