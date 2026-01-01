import React, { useState, useRef, useEffect } from 'react';
import useDataStore from '../../store/dataStore';

/**
 * DateRangeFilter - Global date range filter with preset options
 * Controls which time period is visible across different sections
 */
const DateRangeFilter = () => {
  const { filters, setFilters, resetFilters } = useDataStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowCustom(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate date ranges for presets
  const getPresetRange = (preset) => {
    const now = new Date();
    let start, end;

    switch (preset) {
      case 'all':
        return null;

      case 'last12':
        end = new Date(now);
        start = new Date(now);
        start.setMonth(start.getMonth() - 12);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };

      case 'last24':
        end = new Date(now);
        start = new Date(now);
        start.setMonth(start.getMonth() - 24);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };

      case '2025':
        return { start: '2025-01-01', end: '2025-12-31' };

      case '2024':
        return { start: '2024-01-01', end: '2024-12-31' };

      case '2023':
        return { start: '2023-01-01', end: '2023-12-31' };

      default:
        return null;
    }
  };

  const handlePresetSelect = (preset) => {
    const range = getPresetRange(preset);
    if (range === null) {
      resetFilters();
    } else {
      setFilters({ dateRange: range });
    }
    setIsOpen(false);
    setShowCustom(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      setFilters({ dateRange: { start: customStart, end: customEnd } });
      setIsOpen(false);
      setShowCustom(false);
      setCustomStart('');
      setCustomEnd('');
    }
  };

  const handleReset = () => {
    resetFilters();
    setIsOpen(false);
    setShowCustom(false);
  };

  // Get label for current filter
  const getCurrentLabel = () => {
    if (!filters.dateRange) {
      return 'All Time';
    }

    const { start, end } = filters.dateRange;

    // Check if it matches a preset
    if (start === '2025-01-01' && end === '2025-12-31') return 'Year: 2025';
    if (start === '2024-01-01' && end === '2024-12-31') return 'Year: 2024';
    if (start === '2023-01-01' && end === '2023-12-31') return 'Year: 2023';

    // Check if it's approximately last 12 or 24 months
    const startDate = new Date(start);
    const endDate = new Date(end);
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                      (endDate.getMonth() - startDate.getMonth());

    if (monthsDiff >= 11 && monthsDiff <= 13) return 'Last 12 Months';
    if (monthsDiff >= 23 && monthsDiff <= 25) return 'Last 24 Months';

    // Custom range
    const formatDate = (dateStr) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const isFiltered = filters.dateRange !== null;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-600">Time Period:</span>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            isFiltered
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
          aria-label="Select date range"
          aria-expanded={isOpen}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{getCurrentLabel()}</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isFiltered && (
          <button
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Reset to all time"
            title="Reset to all time"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-slate-200 shadow-lg z-50">
          {!showCustom ? (
            <div className="py-1">
              <button
                onClick={() => handlePresetSelect('all')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  !filters.dateRange ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700'
                }`}
              >
                All Time
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => handlePresetSelect('last12')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Last 12 Months
              </button>

              <button
                onClick={() => handlePresetSelect('last24')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Last 24 Months
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => handlePresetSelect('2025')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Year: 2025
              </button>

              <button
                onClick={() => handlePresetSelect('2024')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Year: 2024
              </button>

              <button
                onClick={() => handlePresetSelect('2023')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Year: 2023
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => setShowCustom(true)}
                className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
              >
                Custom Range...
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex-1 px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                  className="flex-1 px-3 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
