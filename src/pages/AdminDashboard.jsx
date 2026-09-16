import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttendance } from '../context/AttendanceContext';
import AdminLayout from '../layouts/AdminLayout';
import api from '../services/api';
import { 
  Users, Search, Filter, Briefcase, ArrowLeft, ChevronLeft, ChevronRight
} from 'lucide-react';


const StatCard = ({ label, value, percentage, color, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`bg-white rounded-[24px]  gap-3 border border-slate-100 shadow-sm p-4 relative overflow-hidden hover:shadow-md transition-all text-center flex-1 group ${
      isActive ? 'ring-2 ring-[#1e293b] shadow-lg translate-y-[-2px]' : ''
    }`}
  >
    <div className={`absolute top-0 left-0 w-full h-[6px] ${color}`}></div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{label}</p>
    <h3 className={`text-3xl font-black mb-3 transition-colors ${isActive ? 'text-[#1e293b]' : 'text-slate-700'}`}>
      {value}
    </h3>
    {percentage !== undefined && (
      <p className="text-xs font-black text-slate-400 tracking-widest">{percentage}%</p>
    )}
  </button>
);

// Removed SOCKET_URL

const AdminDashboard = () => {
  const { refreshKey } = useAttendance();
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState({
    totalEmployees: 0,
    presentToday: 0,
    halfDayToday: 0,
    leavesToday: 0,
    lateToday: 0,
    absentToday: 0
  });
  const [activeFilter, setActiveFilter] = useState('Total');
  const [employeeList, setEmployeeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) setStatsData(res.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchFilteredEmployees = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '/admin/employees';
      if (activeFilter === 'Present') endpoint = '/admin/attendance/present';
      else if (activeFilter === 'Half Day') endpoint = '/admin/attendance/halfday';
      else if (activeFilter === 'Absent') endpoint = '/admin/attendance/absent';
      else if (activeFilter === 'Late Marks') endpoint = '/admin/attendance/late';
      else if (activeFilter === 'On Leave') endpoint = '/admin/leaves/active';

      const res = await api.get(endpoint);
      if (res.data.success) {
        setEmployeeList(res.data.employees);
      }
    } catch (err) {
      console.error('Error fetching list:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  useEffect(() => {
    fetchFilteredEmployees();
  }, [fetchFilteredEmployees, refreshKey]);

  // Removed socket effect

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const getPercentage = (val) => {
    if (!statsData.totalEmployees) return 0;
    return Math.round((val / statsData.totalEmployees) * 100);
  };

  const stats = [
    { label: 'Total Employees', type: 'Total', value: statsData.totalEmployees, color: 'bg-blue-600' },
    { label: 'Present', type: 'Present', value: statsData.presentToday, percentage: getPercentage(statsData.presentToday), color: 'bg-emerald-500' },
    { label: 'Half Day', type: 'Half Day', value: statsData.halfDayToday, percentage: getPercentage(statsData.halfDayToday), color: 'bg-sky-500' },
    { label: 'Absent', type: 'Absent', value: statsData.absentToday, percentage: getPercentage(statsData.absentToday), color: 'bg-rose-500' },
    { label: 'Late Marks', type: 'Late Marks', value: statsData.lateToday, percentage: getPercentage(statsData.lateToday), color: 'bg-orange-500' },
    { label: 'On Leave', type: 'On Leave', value: statsData.leavesToday, percentage: getPercentage(statsData.leavesToday), color: 'bg-violet-500' },
  ];

  const filteredList = employeeList.filter(emp => 
    emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.empCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get color for the active list header border
  const getHeaderColor = () => {
    const stat = stats.find(s => s.type === activeFilter);
    return stat ? stat.color : 'bg-slate-900';
  };

  return (
    <AdminLayout title="Dashboard" subtitle={`Today's HR snapshot (${today}).`}>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Today's Overview Section */}
        <div className="bg-white border border-slate-100 shadow-sm p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-sky-400"></div>
          <div className="mb-10">
            <h2 className="text-2xl font-black text-[#1e293b] mb-1">Today's Overview</h2>
            <p className="text-slate-400 text-xs font-medium tracking-tight">Key HR metrics and attendance statistics for {today}.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-1">
            {stats.map((stat, idx) => (
              <StatCard 
                key={idx} 
                {...stat} 
                isActive={activeFilter === stat.type}
                onClick={() => setActiveFilter(stat.type)}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Detail List - MATCHING SCREENSHOT EXACTLY */}
        <div className="space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${getHeaderColor()}`}></div>
            
            {/* List Header */}
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* <button 
                  onClick={() => setActiveFilter('Total')}
                  className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <ArrowLeft size={20} />
                </button> */}
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-[#1e293b]">{activeFilter} Employees</h3>
                    <span className={`px-4 py-1 rounded-full text-xs font-black text-white ${getHeaderColor()}`}>
                      {filteredList.length}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm font-medium mt-1">Employees who are {activeFilter.toLowerCase()} today.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search employees..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-[20px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-50 transition-all placeholder:text-slate-300"
                  />
                </div>
                {/* <button className="p-4 border border-slate-100 rounded-[20px] text-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                  <Filter size={20} />
                </button> */}
              </div>
            </div>

            {/* Employee Grid - 5 COLUMNS ON XL SCREENS */}
            <div className="px-4 pb-10">
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1e293b] rounded-full animate-spin"></div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Records...</p>
                </div>
              ) : filteredList.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {filteredList.map((emp) => {
                      const initials = emp.fullName ? emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'E';
                      return (
                        <div 
                          key={emp._id}
                          onClick={() => navigate(`/admin/employees/${emp._id}`)}
                          className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer active:scale-95 relative overflow-hidden"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 bg-[#1e293b] rounded-full flex items-center justify-center text-white font-black text-lg border-2 border-white shadow-md overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                              {emp.profileImage ? <img src={emp.profileImage} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} /> : initials}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-black text-[#1e293b] truncate mb-0.5">{emp.fullName}</h4>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">MEMBER</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight leading-tight mb-1 truncate">
                                {emp.role || 'STAFF'}
                              </p>
                              <div className="flex items-center gap-1 text-slate-300">
                                <Briefcase size={10} />
                                <span className="text-[10px] font-bold uppercase tracking-wider truncate">{emp.department || 'Staff'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-between items-end">
                            {/* Dynamic Badge Color */}
                            <div className={`px-3 py-1 rounded-lg text-[9px] font-black border opacity-90 ${
                              activeFilter === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              activeFilter === 'Absent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              activeFilter === 'Late Marks' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              activeFilter === 'Half Day' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                              activeFilter === 'On Leave' ? 'bg-violet-50 text-violet-600 border-violet-100' :
                              'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {emp.empCode}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Exact Pagination Layout - Clustering buttons in the center-right */}
                  <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-black text-slate-400 order-2 sm:order-1">
                      Showing {filteredList.length} of {employeeList.length} employees
                    </p>
                    <div className="flex items-center gap-2 order-1 sm:order-2">
                      <button className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:bg-slate-50 hover:text-slate-600 transition-all shadow-sm">
                        <ChevronLeft size={16} strokeWidth={3} />
                      </button>
                      <button className={`w-10 h-10 rounded-xl text-white flex items-center justify-center text-sm font-black shadow-lg shadow-opacity-20 ${
                        activeFilter === 'Present' ? 'bg-[#10b981] shadow-emerald-200' :
                        activeFilter === 'Absent' ? 'bg-[#ef4444] shadow-rose-200' :
                        activeFilter === 'Late Marks' ? 'bg-[#f59e0b] shadow-amber-200' :
                        activeFilter === 'Half Day' ? 'bg-[#0ea5e9] shadow-sky-200' :
                        activeFilter === 'On Leave' ? 'bg-[#8b5cf6] shadow-violet-200' :
                        'bg-[#3b82f6] shadow-blue-200'
                      }`}>
                        1
                      </button>
                      <button className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:bg-slate-50 hover:text-slate-600 transition-all shadow-sm">
                        <ChevronRight size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                  <p className="text-slate-400 font-black text-sm uppercase tracking-widest">No matching records found</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
