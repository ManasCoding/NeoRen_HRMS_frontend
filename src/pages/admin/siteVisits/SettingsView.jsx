import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const SettingsView = () => {
  const [settings, setSettings] = useState({
    site_visit_max_hours: 8,
    site_visit_min_hours: 4,
    site_visit_max_overtime: 2,
    site_visit_geofence_radius: 200,
    site_visit_overtime_enabled: true,
    site_visit_overtime_approval_required: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        const s = res.data.settings;
        setSettings({
          site_visit_max_hours: s.site_visit_max_hours || 8,
          site_visit_min_hours: s.site_visit_min_hours || 4,
          site_visit_max_overtime: s.site_visit_max_overtime || 2,
          site_visit_geofence_radius: s.site_visit_geofence_radius || 200,
          site_visit_overtime_enabled: s.site_visit_overtime_enabled === 'true' || s.site_visit_overtime_enabled === true,
          site_visit_overtime_approval_required: s.site_visit_overtime_approval_required === 'true' || s.site_visit_overtime_approval_required === true
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-3xl">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Site Visit Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Daily Maximum Hours</label>
            <input 
              type="number" 
              name="site_visit_max_hours"
              value={settings.site_visit_max_hours}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Working Hours</label>
            <input 
              type="number" 
              name="site_visit_min_hours"
              value={settings.site_visit_min_hours}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Maximum Overtime (Hours)</label>
            <input 
              type="number" 
              name="site_visit_max_overtime"
              value={settings.site_visit_max_overtime}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Geofence Radius (Meters)</label>
            <input 
              type="number" 
              name="site_visit_geofence_radius"
              value={settings.site_visit_geofence_radius}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
            />
          </div>

        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              name="site_visit_overtime_enabled"
              checked={settings.site_visit_overtime_enabled}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">Allow Overtime</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              name="site_visit_overtime_approval_required"
              checked={settings.site_visit_overtime_approval_required}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">Overtime Requires Admin Approval</span>
          </label>
        </div>

        <div className="pt-6">
          <button 
            type="submit" 
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
