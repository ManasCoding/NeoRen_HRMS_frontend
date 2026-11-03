import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import { useParams } from 'react-router-dom';
import { BookOpen, Shield, Clock, Laptop, Heart, Download, ChevronRight, FileText, X } from 'lucide-react';
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

const generatePdfHtml = (content, updatedAt) => {
  if (!content) return '';
  const lines = content.split('\n');
  let html = '';
  lines.forEach((line) => {
    if (/^\d+\.\s/.test(line)) {
      const headingText = line.trim().endsWith(':-') ? line : `${line} :-`;
      html += `<h4 style="font-size:16px;font-weight:700;color:#1e293b;margin:20px 0 8px 0;">${headingText}</h4>`;
    } else if (line.trim().endsWith(':') && !line.startsWith('-')) {
      html += `<h5 style="font-size:14px;font-weight:600;color:#334155;margin:14px 0 6px 0;">${line}</h5>`;
    } else if (line.startsWith('- ')) {
      let text = line.substring(2);
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html += `<div style="display:flex;gap:8px;margin-bottom:6px;color:#475569;font-size:13px;line-height:1.6;"><span style="color:#94a3b8;flex-shrink:0;">•</span><span>${text}</span></div>`;
    } else if (line.trim() === '') {
      html += `<br/>`;
    } else {
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Auto-bold specific names for PDF as well
      const highlights = [
        "Director",
        "P Debendra Rao",
        "HR & Operation Manager",
        "Priyanka Nayak"
      ];
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const combinedRegex = new RegExp(`(${highlights.map(escapeRegExp).join('|')})`, 'g');
      formattedLine = formattedLine.replace(combinedRegex, '<strong>$1</strong>');
      
      html += `<p style="color:#475569;font-size:13px;line-height:1.6;margin-bottom:6px;">${formattedLine}</p>`;
    }
  });
  return html;
};

const PolicyCard = ({ title, icon: Icon, updatedDate, bgClass, textClass, description, onClick, onDownload }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300 group flex flex-col h-full cursor-pointer"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bgClass} ${textClass}`}>
        <Icon size={26} strokeWidth={2.5} />
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onDownload && onDownload(); }}
        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors" 
        title="Download Policy"
      >
        <Download size={18} />
      </button>
    </div>
    <div className="flex-1">
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">{description}</p>
    </div>
    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Updated: {updatedDate}</p>
      <button className="text-sm font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
        Read <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

const EmployeePolicy = () => {
  const { employeeSlug } = useParams();
  
  const [activePolicy, setActivePolicy] = useState(null);
  const [policyData, setPolicyData] = useState({ content: defaultPolicyContent, updatedAt: 'Mar 02, 2026' });

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
    }
  };

  const handleDownload = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const bodyHtml = generatePdfHtml(policyData.content, policyData.updatedAt);
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
        <div style="text-align:center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 28px;">
          <h1 style="font-size:22px; font-weight:900; color:#0f172a; letter-spacing:2px; text-transform:uppercase; margin:0 0 6px 0;">OFFICE ORDER</h1>
          <p style="font-size:11px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin:0;">NeoRen Enterprise Pvt Ltd</p>
        </div>
        ${bodyHtml}
        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: right;">
          Last Updated: ${policyData.updatedAt}
        </div>
      </div>
    `;
    const opt = {
      margin: 0,
      filename: 'Office_Order_Policy.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(container).save();
  };

  const handleCloseModal = () => {
    setActivePolicy(null);
  };

  return (
    <EmployeeLayout title="Company Policy" subtitle="Review organizational guidelines, rules, and protocols.">
      <div className="max-w-7xl mx-auto space-y-8 pb-10 relative">
        
        {/* Header Banner */}
        <div className="bg-[#0f172a] rounded-[32px] p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-20 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
              <Shield className="text-blue-400" size={32} />
              Policy & Guidelines
            </h2>
            <p className="text-slate-300 font-medium max-w-xl leading-relaxed mt-4">
              Access all important company documents. Please ensure you are familiar with our latest policies and guidelines to maintain a safe and compliant work environment.
            </p>
          </div>
        </div>

        {/* Policy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* <PolicyCard 
            title="Code of Conduct" 
            description="Guidelines on professional behavior, ethics, and workplace compliance."
            icon={Shield} 
            updatedDate="Jan 15, 2026"
            bgClass="bg-blue-50"
            textClass="text-blue-600"
          /> */}
          <PolicyCard 
            title="Office Order" 
            description="Rules regarding working hours, shifts, and leave application procedures."
            icon={Clock} 
            updatedDate={policyData.updatedAt}
            bgClass="bg-emerald-50"
            textClass="text-emerald-600"
            onClick={() => handleOpenView("Office Order")}
            onDownload={handleDownload}
          />
          {/* <PolicyCard 
            title="IT & Security Policy" 
            description="Protocols for using company devices, internet, and data protection."
            icon={Laptop} 
            updatedDate="Feb 20, 2026"
            bgClass="bg-violet-50"
            textClass="text-violet-600"
          />
          <PolicyCard 
            title="Health & Safety" 
            description="Workplace safety standards, emergency procedures, and health guidelines."
            icon={Heart} 
            updatedDate="Nov 10, 2025"
            bgClass="bg-rose-50"
            textClass="text-rose-600"
          />
          <PolicyCard 
            title="Remote Work Guidelines" 
            description="Expectations, requirements, and support for working from home."
            icon={BookOpen} 
            updatedDate="Apr 05, 2026"
            bgClass="bg-orange-50"
            textClass="text-orange-600"
          />
          <PolicyCard 
            title="Expense Policy" 
            description="Reimbursement processes, eligible expenses, and claim submissions."
            icon={FileText} 
            updatedDate="Jan 20, 2026"
            bgClass="bg-indigo-50"
            textClass="text-indigo-600"
          /> */}
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
                <p className="text-sm font-medium text-slate-500 mt-1">Last Updated: {policyData.updatedAt}</p>
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
              <div className="policy-content prose prose-slate max-w-none">
                {parseAndRenderContent(policyData.content)}
              </div>
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
    </EmployeeLayout>
  );
};

export default EmployeePolicy;

