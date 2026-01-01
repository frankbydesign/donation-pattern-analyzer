import React from 'react';
import useDataStore from '../../store/dataStore';

/**
 * FilterStatus - Shows how a section responds to the global date filter
 * @param {string} mode - 'filtered', 'highlighted', or 'independent'
 * @param {string} context - Additional context text (e.g., "Based on X gifts")
 */
const FilterStatus = ({ mode, context }) => {
  const { filters, getDateRangeLabel } = useDataStore();
  const isFiltered = filters.dateRange !== null;

  if (!isFiltered && mode !== 'independent') {
    return null;
  }

  const config = {
    filtered: {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      ),
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      message: `Data filtered to ${getDateRangeLabel()}`
    },
    highlighted: {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      message: `All data shown. ${getDateRangeLabel()} highlighted.`
    },
    independent: {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-200',
      message: 'Uses independent baseline selector. Global time filter does not affect these projections.'
    }
  };

  const style = config[mode];

  return (
    <div className={`${style.bgColor} ${style.borderColor} border rounded-lg px-3 py-2 mb-4`}>
      <div className="flex items-center gap-2">
        <div className={style.textColor}>
          {style.icon}
        </div>
        <p className={`text-xs ${style.textColor} font-medium`}>
          {style.message}
        </p>
      </div>
      {context && (
        <p className={`text-xs ${style.textColor} mt-1 ml-6`}>
          {context}
        </p>
      )}
    </div>
  );
};

export default FilterStatus;
