import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { 
  BarChart3, 
  MapPin, 
  CheckSquare, 
  Clock
} from 'lucide-react';
import DashboardView from './admin/siteVisits/DashboardView';
import RequestsView from './admin/siteVisits/RequestsView';
import ActiveView from './admin/siteVisits/ActiveView';

const AdminSiteVisits = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'requests': return <RequestsView />;
      case 'active': return <ActiveView />;
      default: return <DashboardView />;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
    { id: 'requests', label: 'All Site Visits', icon: <CheckSquare size={16} /> },
    { id: 'active', label: 'Ongoing & Completed Visits', icon: <MapPin size={16} /> }
  ];

  return (
    <AdminLayout title="Site Visits" subtitle="Manage employee field visits, approvals, ongoing visits, and work duration">
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-sm mb-6 border border-slate-200 p-1.5 inline-flex">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#0B1426] text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          {renderContent()}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSiteVisits;
