import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { 
  Users, TrendingUp, Award, Target, 
  Eye, ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Filter, Trash2
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import api from '../services/api';

const COLORS = ['#10b981', '#3b82f6', '#eab308', '#ef4444'];

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, bgClass, isIncrease }) => (
  <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex items-start gap-4">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
      <Icon size={24} strokeWidth={2.5} />
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-500 mb-1">{title}</h3>
      <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
      <p className={`text-xs font-bold mt-2 ${isIncrease ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isIncrease ? '↑' : '↓'} {subtext}
      </p>
    </div>
  </div>
);

const AdminPerformance = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    averageRating: 0,
    topPerformers: 0,
    goalsCompleted: 0,
    overview: [],
    distribution: []
  });
  const [topPerformers, setTopPerformers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDepartment, setFilterDepartment] = useState('All Departments');
  const [departments, setDepartments] = useState(['All Departments', 'Digital Marketing', 'Web Development', 'SEO', 'HR', 'Others']);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDate) {
        params.append('startDate', filterDate);
        params.append('endDate', filterDate);
      }
      const res = await api.get(`/performance?${params.toString()}`);
      if (res.data.success) {
        const distObj = res.data.data.distribution;
        const formattedDist = [
          { name: '5 Stars', value: distObj.fiveStars, fill: '#10b981' },
          { name: '4 Stars', value: distObj.fourStars, fill: '#3b82f6' },
          { name: '3 Stars', value: distObj.threeStars, fill: '#eab308' },
          { name: '2 Stars', value: distObj.twoStars, fill: '#f97316' },
          { name: '1 Star', value: distObj.oneStar, fill: '#ef4444' },
        ];
        
        setStats({ ...res.data.data.summary, distribution: formattedDist, totalRatingsCount: distObj.total });
        setTopPerformers(res.data.data.employees.filter(emp => emp.averageRating >= 4.5).slice(0, 5));
        
        // Find unique departments from employees for the dropdown
        const uniqueDepts = [...new Set(res.data.data.employees.map(e => e.role).filter(Boolean))];
        setDepartments(['All Departments', ...uniqueDepts]);

        setEmployees(res.data.data.employees);
      }
    } catch (error) {
      console.error("Error fetching performance data", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, [filterDate]);

  const deleteRating = async (emp) => {
    if (!window.confirm(`Delete all performance ratings for ${emp.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/performance/${emp.employeeId}/ratings`);
      await fetchData();
    } catch (error) {
      console.error('Error deleting rating:', error);
      alert('Failed to delete ratings. Please try again.');
    }
  };

  const openProfile = async (empId) => {
    try {
      const res = await api.get(`/performance/${empId}`);
      setSelectedEmployee(res.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching profile", error);
      
      // Fallback for when the backend returns 404/500 (e.g. on the live server)
      // Find the basic employee info from the list
      const empBasic = employees.find(e => e.employeeId === empId) || {};
      
      setSelectedEmployee({
        employeeId: {
          _id: empId,
          fullName: empBasic.name || 'Unknown Employee',
          department: empBasic.role || '',
          designation: '',
          profileImage: empBasic.avatar || ''
        },
        parameters: {
          qualityOfWork: 0,
          productivity: 0,
          communication: 0,
          teamwork: 0,
          punctuality: 0,
          problemSolving: 0
        },
        overallRating: 0,
        goalsCompleted: 0,
        status: 'No rating yet',
        reviews: []
      });
      setShowModal(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Good': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Average': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'Needs Improvement': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getProgressColor = (percent) => {
    if (percent >= 80) return 'bg-emerald-500';
    if (percent >= 60) return 'bg-blue-500';
    if (percent >= 40) return 'bg-yellow-500';
    return 'bg-rose-500';
  };

  const renderStars = (emp) => {
    if (!emp.totalRatings || emp.totalRatings === 0) {
      return <span className="text-sm text-slate-500 font-medium">No rating yet</span>;
    }
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`text-lg ${i <= Math.round(emp.averageRating) ? 'text-yellow-400' : 'text-slate-200'}`}>
          ★
        </span>
      );
    }
    return <div className="flex items-center gap-1">{stars} <span className="ml-2 font-bold text-slate-700">{emp.averageRating} / 5</span></div>;
  };

  const renderModalStars = (rating) => {
    const num = parseFloat(rating) || 0;
    if (num === 0) return <span className="text-sm text-slate-500 font-medium">No rating yet</span>;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`text-xl ${i <= Math.round(num) ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
      );
    }
    return <div className="flex items-center gap-1">{stars} <span className="ml-2 font-bold text-slate-700">{num} / 5</span></div>;
  };

  const filteredEmployees = employees.filter(emp => 
    (filterDepartment === 'All Departments' || emp.role === filterDepartment) &&
    emp.status !== 'No rating yet'
  );
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const currentEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <AdminLayout title="Employee Performance" subtitle="Track and evaluate employee performance and key metrics.">
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Employee Performance" subtitle="Track and evaluate employee performance and key metrics.">
      
      {/* Date Range and Filter removed from top */}

      <div className="space-y-2">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Employees" 
            value={stats.totalEmployees} 
            subtext="8% from last month" 
            icon={Users} 
            bgClass="bg-indigo-50" colorClass="text-indigo-600" isIncrease={true} 
          />
          <StatCard 
            title="Average Rating" 
            value={`${stats.averageRating} / 5`} 
            subtext="5% from last month" 
            icon={TrendingUp} 
            bgClass="bg-emerald-50" colorClass="text-emerald-600" isIncrease={true} 
          />
          <StatCard 
            title="Top Performers" 
            value={stats.topPerformers} 
            subtext="12% from last month" 
            icon={Award} 
            bgClass="bg-orange-50" colorClass="text-orange-600" isIncrease={true} 
          />
          <StatCard 
            title="Goals Completed" 
            value={`${stats.goalsCompleted}%`} 
            subtext="10% from last month" 
            icon={Target} 
            bgClass="bg-blue-50" colorClass="text-blue-600" isIncrease={true} 
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radar Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Performance Overview</h3>
            <div className="flex-1 w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.overview}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar name="Performance" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 bg-blue-50 text-blue-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">i</div>
              Ratings are based on 6 key performance parameters.
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Performance Distribution</h3>
            <div className="flex-1 w-full min-h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-black text-slate-800">{stats.totalRatingsCount || 0}</span>
                <span className="text-sm font-semibold text-slate-500">Total</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-3 mt-4">
              {stats.distribution.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.fill }}></div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{entry.name.split(' (')[0]}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{entry.value} Ratings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Top Performers</h3>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              {topPerformers.map((emp, idx) => (
                <div key={emp._id || idx} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <img 
                      src={emp.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} 
                      alt={emp.name} 
                      className="w-10 h-10 rounded-full object-cover bg-slate-100"
                    />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.role}</p>
                    </div>
                  </div>
                  <div className="bg-yellow-50 text-yellow-700 font-bold text-xs px-2.5 py-1 rounded-md flex items-center gap-1 border border-yellow-100">
                    <span className="text-yellow-500">★</span> {emp.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className=" rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
          <div className=" border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800">Employee Performance List</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={filterDepartment}
                  onChange={(e) => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none pr-8 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Filter size={14} />
                </div>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer hover:bg-slate-100 transition-colors"
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Rating</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Goals Completed</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Review</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentEmployees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} 
                          alt={emp.name} 
                          className="w-8 h-8 rounded-full object-cover bg-slate-100"
                        />
                        <span className="font-bold text-slate-800 text-sm">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">{emp.role}</td>
                    <td className="py-4 px-6">
                      {renderStars(emp)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getProgressColor(emp.goalsCompleted)}`} 
                            style={{ width: `${emp.goalsCompleted}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-600 w-8">{emp.goalsCompleted}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {emp.lastReview ? new Date(emp.lastReview).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => openProfile(emp.employeeId)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                          title="View Profile"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => deleteRating(emp)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-block"
                          title="Delete Rating"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-sm font-medium text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, employees.length)} of {employees.length} employees
            </p>
            <div className="flex items-center gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0f172a] text-white font-bold text-sm">
                {currentPage}
              </button>
              
              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(p => p + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Performance Profile Modal */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in-up">
            
            <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-lg sm:text-2xl font-black text-slate-800">Employee Performance Profile</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/30">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm mb-8 text-center sm:text-left">
                <img 
                  src={selectedEmployee.employeeId?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployee.employeeId?.fullName)}&background=random`} 
                  alt="Profile" 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-1 break-words">{selectedEmployee.employeeId?.fullName}</h3>
                  <p className="text-slate-500 font-medium mb-4 text-sm">{selectedEmployee.employeeId?.designation} • {selectedEmployee.employeeId?.department}</p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Overall Rating</p>
                      {renderModalStars(selectedEmployee.overallRating)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedEmployee.status)}`}>
                        {selectedEmployee.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Goals Progress */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Goals Progress</h4>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getProgressColor(selectedEmployee.goalsCompleted)}`} 
                        style={{ width: `${selectedEmployee.goalsCompleted}%` }}
                      ></div>
                    </div>
                    <span className="text-xl font-black text-slate-700">{selectedEmployee.goalsCompleted}%</span>
                  </div>
                  <p className="text-sm font-medium text-slate-500">Overall goals completed this cycle.</p>
                </div>

                {/* Recent Reviews */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Recent Reviews</h4>
                  {(() => {
                    const reviews = selectedEmployee.recentReviews || selectedEmployee.reviews || [];
                    return reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.slice(0, 3).map((review, idx) => (
                          <div key={idx} className="border-l-2 border-blue-500 pl-4 py-1">
                            <div className="flex items-center gap-2 mb-1">
                              {renderModalStars(review.rating)}
                            </div>
                            <p className="text-sm text-slate-600 mb-1">{review.comment || review.comments || 'No comments provided.'}</p>
                            <p className="text-xs font-bold text-slate-400">By {review.ratedBy || review.reviewer || 'Admin'} • {new Date(review.date).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No recent reviews found.</p>
                    );
                  })()}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </AdminLayout>
  );
};

export default AdminPerformance;
