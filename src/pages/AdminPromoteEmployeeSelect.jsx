import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import SearchHeader from '../components/SearchHeader';

const AdminPromoteEmployeeSelect = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/admin/employees');
      if (response.data.success) {
        // Show eligible employees (exclude Ex-Employees, etc. depending on business logic, here just Active)
        setEmployees(response.data.employees.filter(e => e.status !== 'Ex-Employee'));
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
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
    <AdminLayout title="Select Employee to Promote / Upgrade" subtitle="Select an employee to view their employment history and upgrade their current employment.">
      
      <div className="mb-6 flex gap-3">
        <button 
          onClick={() => navigate('/admin/employees')}
          className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
          Back to Employees
        </button>
      </div>

      <SearchHeader 
        title="Eligible Employees"
        subtitle="Active employees available for promotion."
        count={filteredEmployees.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search employees..."
        filterOptions={departments}
        filterValue={filterDept}
        onFilterChange={setFilterDept}
      />

      {loading ? (
        <div className="py-10 text-center">Loading employees...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((emp) => (
            <div key={emp._id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md">
              <div className="w-24 h-24 bg-slate-100 rounded-full mb-4 overflow-hidden border-4 border-white shadow-sm flex items-center justify-center font-bold text-2xl text-slate-400">
                {emp.profileImage ? (
                  <img src={emp.profileImage} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                ) : (
                  emp.fullName[0]
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">{emp.fullName}</h3>
              <p className="text-sm font-semibold text-slate-500 mb-4">{emp.empCode}</p>
              
              <div className="w-full bg-slate-50 rounded-xl p-4 mb-5 text-left space-y-2">
                <p className="text-sm"><span className="text-slate-400 text-xs uppercase tracking-wider block mb-0.5">Role</span> <span className="font-semibold text-slate-700">{emp.role || 'N/A'}</span></p>
                <p className="text-sm"><span className="text-slate-400 text-xs uppercase tracking-wider block mb-0.5">Department</span> <span className="font-semibold text-slate-700">{emp.department || 'N/A'}</span></p>
                <p className="text-sm"><span className="text-slate-400 text-xs uppercase tracking-wider block mb-0.5">Employment</span> <span className="font-semibold text-blue-600">{emp.employmentType || (emp.empCode?.includes('OD-IN') ? 'Intern' : 'Regular')}</span></p>
              </div>
              
              <button 
                onClick={() => navigate(`/admin/employees/promote/${emp._id}`)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2"
              >
                <TrendingUp size={18} />
                View & Upgrade
              </button>
            </div>
          ))}
          
          {filteredEmployees.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No eligible employees found.
            </div>
          )}
        </div>
      )}
      
    </AdminLayout>
  );
};

export default AdminPromoteEmployeeSelect;
