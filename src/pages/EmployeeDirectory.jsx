import React, { useState, useEffect } from 'react';
import { Mail, Phone, Briefcase, User } from 'lucide-react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import api from '../services/api';
import SearchHeader from '../components/SearchHeader';

const EmployeeCard = ({ employee }) => {
  const initials = employee.fullName
    ? employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'E';

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
      {/* Accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#1e293b]/5 group-hover:bg-[#1e293b] transition-all"></div>

      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-[24px] bg-[#1e293b] flex items-center justify-center text-white text-xl font-black shadow-lg overflow-hidden transition-transform group-hover:scale-105">
            {employee.profileImage ? (
              <img src={employee.profileImage} alt={employee.fullName} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[8px] font-black border border-emerald-100 shadow-sm">
            {employee.empCode}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-[#1e293b] truncate group-hover:text-sky-600 transition-colors">
            {employee.fullName}
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            {employee.role || 'Member'}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Briefcase size={12} className="flex-shrink-0" />
              <span className="text-[11px] font-bold truncate">{employee.department || 'NeoRen'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Mail size={12} className="flex-shrink-0" />
              <span className="text-[11px] font-bold truncate">{employee.email}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-2 text-slate-400">
                <Phone size={12} className="flex-shrink-0" />
                <span className="text-[11px] font-bold truncate">{employee.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');

  const fetchDirectory = async () => {
    try {
      const res = await api.get('/employee/directory');
      if (res.data.success) {
        setEmployees(res.data.employees);
      }
    } catch (err) {
      console.error('Error fetching directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, []);


  const departments = ['All', ...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.empCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || emp.department === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <EmployeeLayout
      title="Employee Directory"
      subtitle={`Meet your colleagues at NeoRen (${employees.length} members).`}
    >
      <div className="space-y-6">
        <SearchHeader 
          title="Colleagues"
          subtitle="Discover and connect with your team members."
          count={employees.length}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Search by name or code..."
          filterOptions={departments}
          filterValue={filterDept}
          onFilterChange={setFilterDept}
        />

        {/* Directory Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 animate-pulse">
                <div className="flex gap-5">
                  <div className="w-20 h-20 bg-slate-100 rounded-[24px]"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    <div className="h-8 bg-slate-100 rounded w-full mt-4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEmployees.map(emp => (
              <EmployeeCard key={emp.empCode} employee={emp} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
              <User size={40} />
            </div>
            <h3 className="text-xl font-black text-[#1e293b] mb-2">No colleagues found</h3>
            <p className="text-sm text-slate-400 font-medium">Try adjusting your search or filter to find who you're looking for.</p>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDirectory;
