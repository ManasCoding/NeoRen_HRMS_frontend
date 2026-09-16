import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

const CustomDropdown = ({ icon: Icon, value, options, onChange, name }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm min-w-[200px] cursor-pointer hover:border-blue-400 transition-all"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-slate-400" />}
          <span className="text-sm font-bold text-[#1e293b]">{value}</span>
        </div>
        <ChevronRight size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-[270deg]' : 'rotate-90'}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-60 overflow-y-auto py-1">
            {options.map((option, index) => (
              <li 
                key={index}
                onClick={() => {
                  onChange({ target: { name, value: option } });
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 text-sm font-bold cursor-pointer transition-colors ${
                  value === option 
                    ? 'bg-blue-600 text-white' 
                    : 'text-[#1e293b] hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
