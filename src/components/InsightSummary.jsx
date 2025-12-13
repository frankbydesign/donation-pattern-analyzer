import React from 'react';

/**
 * InsightSummary - A narrative summary component for displaying insights
 * @param {string} title - The title of the insight
 * @param {string} summary - The narrative summary text
 * @param {string} variant - Optional variant: 'default', 'success', 'warning', 'danger'
 * @param {string} icon - Optional emoji or icon character
 * @param {React.ReactNode} children - Optional additional content
 */
const InsightSummary = ({
  title,
  summary,
  variant = 'default',
  icon,
  children
}) => {
  const variantStyles = {
    default: 'border-l-indigo-600 bg-white',
    success: 'border-l-emerald-500 bg-emerald-50',
    warning: 'border-l-amber-500 bg-amber-50',
    danger: 'border-l-red-600 bg-red-50',
    info: 'border-l-blue-500 bg-blue-50'
  };

  const titleStyles = {
    default: 'text-slate-900',
    success: 'text-emerald-800',
    warning: 'text-amber-800',
    danger: 'text-red-800',
    info: 'text-blue-800'
  };

  return (
    <article
      className={`
        rounded-lg border border-slate-200 border-l-4 p-6 shadow-sm
        transition-shadow duration-200 hover:shadow-md
        ${variantStyles[variant] || variantStyles.default}
      `}
      role="region"
      aria-labelledby={`insight-title-${title?.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <header className="mb-3 flex items-start gap-3">
        {icon && (
          <span
            className="text-2xl flex-shrink-0"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <h3
          id={`insight-title-${title?.replace(/\s+/g, '-').toLowerCase()}`}
          className={`
            text-lg font-semibold leading-tight
            ${titleStyles[variant] || titleStyles.default}
          `}
        >
          {title}
        </h3>
      </header>

      <p className="text-slate-600 leading-relaxed text-base">
        {summary}
      </p>

      {children && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          {children}
        </div>
      )}
    </article>
  );
};

/**
 * InsightSummaryGroup - Container for multiple insight summaries
 */
export const InsightSummaryGroup = ({ children, columns = 1 }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  };

  return (
    <div
      className={`grid gap-4 ${gridCols[columns] || gridCols[1]}`}
      role="list"
      aria-label="Insight summaries"
    >
      {children}
    </div>
  );
};

export default InsightSummary;
