import React, { useEffect, useState } from 'react';
import { Users, Clock, MapPin, CheckCircle, Clock3 } from 'lucide-react';
import api from '../../../services/api';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className={`p-4 rounded-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

const DashboardView = () => {
  const [stats, setStats] = useState({
    totalVisits: 0,
    activeVisits: 0,
    rejected: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [allRes, activeRes] = await Promise.all([
        api.get('/site-visits'),
        api.get('/site-visits/active')
      ]);
      
      const visits = allRes.data.siteVisits || [];
      const active = activeRes.data.activeVisits || [];
      
      setStats({
        totalVisits: visits.length,
        activeVisits: active.length,
        rejected: visits.filter(v => v.status === 'Rejected').length,
        completed: visits.filter(v => v.status === 'Completed').length
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading Dashboard...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-6">Site Visits Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Requests" 
          value={stats.totalVisits} 
          icon={<Users className="text-blue-600" size={24} />} 
          color="bg-blue-100" 
        />
        <StatCard 
          title="Active on Site" 
          value={stats.activeVisits} 
          icon={<MapPin className="text-green-600" size={24} />} 
          color="bg-green-100" 
        />
        <StatCard 
          title="Completed" 
          value={stats.completed} 
          icon={<CheckCircle className="text-purple-600" size={24} />} 
          color="bg-purple-100" 
        />
        <StatCard 
          title="Rejected" 
          value={stats.rejected} 
          icon={<Clock3 className="text-rose-600" size={24} />} 
          color="bg-rose-100" 
        />
      </div>
    </div>
  );
};

export default DashboardView;
