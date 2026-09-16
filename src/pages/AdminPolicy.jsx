import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { BookOpen, Shield, Clock, Laptop, Heart, Upload, ChevronRight, Edit3, X, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';

const defaultPolicyContent = `OFFICE ORDER

To ensure smooth operations and maintain workplace discipline, all employees are required to adhere to the following office rules and regulations with immediate effect.

1. Office Timings

- Official office hours are 9:30 AM to 6:30 PM (Lunch Time: 1:30 PM - 2:15 PM).
- Depending on work requirements, employees may occasionally be required to extend their working hours beyond the scheduled closing time.

2. Attendance & Punctuality

- All employees must report to the office on time and mark their attendance between 9:30 AM and 9:35 AM.
- Employees are advised to arrive 5–10 minutes before the official reporting time to avoid delays.
- Attendance must be recorded only with a Blue Pen in the Attendance Register.
- The attendance register must be maintained neatly and accurately. Overwriting, cutting, or any alterations are strictly prohibited.
- Employees must ensure that both In Time and Out Time are entered before leaving the office each day.
- Any employee found making overwriting or unauthorized corrections in the attendance register will be subject to a penalty of ₹100/-.

3. Workplace Communication

- To maintain a professional work environment, all employees are required to communicate in English during office hours.
- Employees who fail to comply with this policy may be subject to a penalty of ₹100 for each violation.
- All employees must wear their ID cards in the office. Failure to wear an ID card will result in a penalty of ₹100/-.
- All employees must come in uniform.
- Only on Wednesdays, casual wear is allowed.
- If anyone comes without the required uniform, a penalty of ₹500/- will be applicable.

4. Late Attendance Policy

- If an employee is late once due to a genuine reason, it will be considered only if the employee informs HR with a valid explanation.
- If an employee reports late twice, it will be treated as Half-Day Leave.
- If an employee is late three or more times in a month, one day's salary will be deducted.

5. Leave Policy

Emergency Leave:
- Employees must inform HR before office hours with a valid reason.
- Supporting documents or proof may be required if necessary.

Planned Leave:
- Employees must apply for leave at least 48 hours in advance and obtain prior approval.

Unauthorized Leave:
- If an employee takes leave without prior information or approval, it will be considered Leave Without Approval.
- One additional day's salary will be deducted along with the leave deduction.

6. General Instructions

All employees are expected to maintain professionalism, discipline, and punctuality at all times.

Your cooperation in following these policies is highly appreciated and will contribute to a positive and productive work environment.

- Mail ID - priyankanayakCitiCon@gmail.com
- cc - CitiConofficial@gmail.com

**Director**
**P Debendra Rao**

**HR & Operation Manager**
**Priyanka Nayak**`;

const parseAndRenderContent = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Bold Section Headings
    if (/^\d+\.\s/.test(line)) {
      const headingText = line.trim().endsWith(':-') ? line : `${line} :-`;
      return <h4 key={idx} className="text-xl font-bold text-slate-800 mt-6 mb-3">{headingText}</h4>;
    }
    // Sub-headings like "Emergency Leave:"
    if (line.trim().endsWith(':') && !line.startsWith('-')) {
      return <h5 key={idx} className="text-lg font-semibold text-slate-700 mt-4 mb-2">{line}</h5>;
    }

    if (line.trim() === '') return <br key={idx} />;

    let content = line.startsWith('- ') ? line.substring(2) : line;
    
    // Highlight penalties
    content = content.replace(/(₹100\/-|₹500\/-|₹100)/g, '<span class="font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded">$1</span>');
    
    // Highlight specific phrases
    const highlights = [
      "neatly and accurately. Overwriting, cutting, or any alterations are strictly prohibited.",
      "9:30 AM to 6:30 PM.",
      "priyankanayakCitiCon@gmail.com",
      "CitiConofficial@gmail.com",
      "one day's salary will be deducted.",
      "communicate in English",
      "In Time and Out Time",
      "three or more times",
      "1.30PM - 2.15PM.",
      "3 or more times",
      "come in uniform.",
      "5–10 minutes",
      "Wednesdays,",
      "Half-Day",
      "48 hours",
      "Blue Pen",
      "9:30 AM",
      "Director",
      "P Debendra Rao",
      "HR & Operation Manager",
      "Priyanka Nayak"
    ];
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const combinedRegex = new RegExp(`(${highlights.map(escapeRegExp).join('|')})`, 'g');
    content = content.replace(combinedRegex, '<span class="font-bold text-slate-800">$1</span>');

    // Handle Markdown-style bold
    content = content.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-slate-800">$1</span>');

    if (line.startsWith('- ')) {
      return (
        <div key={idx} className="flex items-start mb-2 text-slate-600 leading-relaxed">
          <span className="text-slate-400 mr-2 mt-1">•</span>
          <p dangerouslySetInnerHTML={{ __html: content }}></p>
        </div>
      );
    }
    
    return <p key={idx} className="text-slate-600 leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: content }}></p>;
  });
};

const PolicyCard = ({ title, icon: Icon, updatedDate, bgClass, textClass, onClick, onEdit }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300 group cursor-pointer"
  >
    <div className="flex items-start justify-between mb-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bgClass} ${textClass}`}>
        <Icon size={26} strokeWidth={2.5} />
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
      >
        <Edit3 size={14} />
      </button>
    </div>
    <div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Updated: {updatedDate}</p>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors group-hover:translate-x-1" />
      </div>
    </div>
  </div>
);

const AdminPolicy = () => {
  const [activePolicy, setActivePolicy] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [policyData, setPolicyData] = useState({ content: defaultPolicyContent, updatedAt: 'Mar 02, 2026' });
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchPolicy = async () => {
    try {
      const response = await api.get('/policies/Office%20Order');
      if (response.data) {
        const dateObj = new Date(response.data.updatedAt);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        setPolicyData({
          content: response.data.content,
          updatedAt: formattedDate
        });
      }
    } catch (error) {
      if (error?.status !== 404) {
        console.error("Failed to fetch policy", error);
      }
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleOpenView = (title) => {
    if (title === 'Office Order') {
      setActivePolicy(title);
      setIsEditing(false);
    }
  };

  const handleOpenEdit = (title) => {
    if (title === 'Office Order') {
      setActivePolicy(title);
      setEditContent(policyData.content);
      setIsEditing(true);
    }
  };

  const handleCloseModal = () => {
    if (isEditing && editContent !== policyData.content) {
      setShowConfirmClose(true);
    } else {
      setActivePolicy(null);
      setIsEditing(false);
    }
  };

  const confirmDiscard = () => {
    setShowConfirmClose(false);
    setActivePolicy(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.put('/policies/Office%20Order', {
        content: editContent,
        category: 'Attendance'
      });
      
      const dateObj = new Date(response.data.policy.updatedAt);
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      
      setPolicyData({
        content: response.data.policy.content,
        updatedAt: formattedDate
      });
      
      setSuccessMessage('Policy updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save policy", error);
      alert('Failed to save policy');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title="Company Policy" subtitle="Manage and update organizational guidelines and protocols.">
      <div className="max-w-7xl mx-auto space-y-8 relative">
        
        {/* Success Notification */}
        {successMessage && (
          <div className="fixed top-24 right-8 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-fade-in-down">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check size={16} strokeWidth={3} />
            </div>
            <p className="font-bold text-sm">{successMessage}</p>
          </div>
        )}

        {/* Header Action */}
        {/* <div className="bg-gradient-to-r from-[#0f172a] to-slate-800 rounded-[32px] p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-20 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">Policy Repository</h2>
            <p className="text-slate-300 font-medium max-w-md leading-relaxed">
              Ensure your workforce is aligned by keeping company policies up to date. Upload new guidelines or modify existing ones.
            </p>
          </div>
          
          <button className="w-full md:w-auto px-8 py-4 bg-white text-[#0f172a] rounded-2xl text-sm font-black tracking-wide hover:bg-blue-50 hover:text-blue-600 hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-3 relative z-10">
            <Upload size={18} strokeWidth={2.5} />
            Upload New Policy
          </button>
        </div> */}

        {/* Policy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* <PolicyCard 
            title="Code of Conduct" 
            icon={Shield} 
            updatedDate="Jan 15, 2026"
            bgClass="bg-blue-50"
            textClass="text-blue-600"
            onClick={() => {}}
            onEdit={() => {}}
          /> */}
          <PolicyCard 
            title="Office Order" 
            icon={Clock} 
            updatedDate={policyData.updatedAt}
            bgClass="bg-emerald-50"
            textClass="text-emerald-600"
            onClick={() => handleOpenView("Office Order")}
            onEdit={() => handleOpenEdit("Office Order")}
          />
          {/* <PolicyCard 
            title="IT & Security Policy" 
            icon={Laptop} 
            updatedDate="Feb 20, 2026"
            bgClass="bg-violet-50"
            textClass="text-violet-600"
            onClick={() => {}}
            onEdit={() => {}}
          />
          <PolicyCard 
            title="Health & Safety" 
            icon={Heart} 
            updatedDate="Nov 10, 2025"
            bgClass="bg-rose-50"
            textClass="text-rose-600"
            onClick={() => {}}
            onEdit={() => {}}
          /> */}
          {/* <PolicyCard 
            title="Remote Work Guidelines" 
            icon={BookOpen} 
            updatedDate="Apr 05, 2026"
            bgClass="bg-orange-50"
            textClass="text-orange-600"
            onClick={() => {}}
            onEdit={() => {}}
          /> */}
        </div>

        {/* Audit Log / Recent Changes */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_40px_rgb(0,0,0,0.04)] p-8 mt-8">
           <h3 className="text-xl font-black text-slate-800 tracking-tight mb-6">Recent Policy Updates</h3>
           <div className="space-y-6">
              {[
                { name: 'Remote Work Guidelines updated to Version 2.1', date: 'Apr 05, 2026', author: 'Super Admin' },
                { name: 'Attendance & Leave Policy modified (Section 3.B)', date: 'Mar 02, 2026', author: 'HR Manager' },
              ].map((log, idx) => (
                <div key={idx} className="flex items-start gap-4 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                     <Edit3 size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-sm">{log.name}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      By <span className="font-bold">{log.author}</span> on {log.date}
                    </p>
                  </div>
                </div>
              ))}
           </div>
        </div>

      </div>

      {/* Policy Modal Overlay */}
      {activePolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-800">{activePolicy === 'Office Order' ? activePolicy : `${activePolicy} Policy`}</h2>
                {!isEditing && (
                  <p className="text-sm font-medium text-slate-500 mt-1">Last Updated: {policyData.updatedAt}</p>
                )}
                {isEditing && (
                  <p className="text-sm font-medium text-blue-600 mt-1">Edit Mode</p>
                )}
              </div>
              <button 
                onClick={handleCloseModal}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[500px] p-6 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none text-slate-700 font-sans leading-relaxed text-base"
                  placeholder="Enter policy content here..."
                />
              ) : (
                <div className="policy-content prose prose-slate max-w-none">
                  {parseAndRenderContent(policyData.content)}
                </div>
              )}
            </div>

            {/* Modal Footer (Edit Mode Only) */}
            {isEditing && (
              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4 shrink-0">
                <button 
                  onClick={handleCloseModal}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discard Changes Confirmation Modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 animate-fade-in-up text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Discard changes?</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              You have unsaved changes. Are you sure you want to discard them? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                Keep Editing
              </button>
              <button 
                onClick={confirmDiscard}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </AdminLayout>
  );
};

export default AdminPolicy;
