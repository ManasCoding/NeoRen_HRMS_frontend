import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { Edit2, Trash2, AlertCircle, RotateCcw } from 'lucide-react';
import api from '../services/api';
import SearchHeader from '../components/SearchHeader';

const AdminExEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchExEmployees = async () => {
    try {
      const res = await api.get('/admin/employees/ex');
      if (res.data.success) {
        setEmployees(res.data.employees);
      }
    } catch (err) {
      console.error('Error fetching ex-employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExEmployees();
  }, []);


  const handleRestore = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to restore this employee to active status?')) {
      try {
        const response = await api.put(`/admin/employees/${id}`, { status: 'Active' });
        if (response.data.success) {
          fetchExEmployees();
        }
      } catch (err) {
        alert('Error restoring employee');
      }
    }
  };

  const handlePermanentDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('WARNING: This will permanently delete the employee record. This action cannot be undone. Proceed?')) {
      try {
        const response = await api.delete(`/admin/employees/${id}?permanent=true`);
        if (response.data.success) {
          fetchExEmployees();
        }
      } catch (err) {
        alert('Error deleting employee');
      }
    }
  };

  const departments = ['All', ...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.empCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || emp.department === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <AdminLayout title="Former Staff Archive" subtitle="Manage records of employees who have left the organization.">
      <SearchHeader 
        title="Archived Records"
        subtitle="Former staff and past employee profiles."
        count={employees.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search archives by name or code..."
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
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Loading Archives...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr 
                    key={emp._id} 
                    onClick={() => navigate(`/admin/employees/${emp._id}`)}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center font-bold grayscale">
                          {emp.fullName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-main">{emp.fullName}</p>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{emp.empCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-text-main font-bold">{emp.department || 'Not Assigned'}</p>
                      <p className="text-xs text-text-muted font-bold">{emp.role || 'Team Member'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-text-main">{emp.email}</p>
                      <p className="text-[10px] text-text-muted">{emp.phone || '-'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200">
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-text-muted">
                      {new Date(emp.joinDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => handleRestore(e, emp._id)}
                          title="Restore Employee"
                          className="p-2 text-text-muted hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button 
                          onClick={(e) => handlePermanentDelete(e, emp._id)}
                          className="p-2 text-text-muted hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-border">
                        <AlertCircle size={32} className="text-slate-300" />
                      </div>
                      <h4 className="text-lg font-bold text-text-main mb-1">No Archived Records</h4>
                      <p className="text-text-muted text-sm">No ex-employee records were found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminExEmployees;
