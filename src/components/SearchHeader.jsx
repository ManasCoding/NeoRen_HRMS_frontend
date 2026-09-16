import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, ArrowLeft, ChevronDown } from 'lucide-react';

const SearchHeader = ({ 
  title, 
  subtitle, 
  count, 
  searchTerm, 
  setSearchTerm, 
  placeholder = "Search...",
  onBack,
  showBack = false,
  filterOptions = [],
  filterValue = 'All',
  onFilterChange
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    onFilterChange && onFilterChange(opt);
    setShowDropdown(false);
  };

  return (
    <div className="bg-white rounded-[32px] p-8 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all">
      <div className="flex items-center gap-4">
        {showBack && (
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#1e293b]">{title}</h2>
            {count !== undefined && (
              <span className="bg-[#2563eb] text-white text-[12px] font-bold px-3 py-1 rounded-full shadow-sm">
                {count}
              </span>
            )}
          </div>
          {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        <div className="relative group w-full sm:w-auto">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-14 pr-6 py-4 bg-[#f8fafc] border border-slate-100 rounded-[20px] text-sm focus:outline-none focus:ring-4 focus:ring-slate-50 transition-all w-full md:w-[380px] font-bold placeholder:text-slate-400 shadow-sm"
          />
        </div>
        
        {/* Filter dropdown */}
        {filterOptions && filterOptions.length > 0 && (
          <div className="relative shrink-0" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-4 bg-white border rounded-[20px] text-sm font-bold transition-all shadow-sm hover:bg-slate-50 ${showDropdown ? 'border-blue-300 text-blue-600 ring-4 ring-blue-50' : 'border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200'}`}
            >
              <Filter size={18} />
              {filterValue !== 'All' && (
                <span className="text-blue-600 font-bold truncate max-w-[120px]">{filterValue}</span>
              )}
              <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden min-w-[180px]">
                {filterOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-5 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 ${filterValue === opt ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchHeader;
