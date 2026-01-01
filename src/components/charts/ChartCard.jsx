import React from 'react';

/**
 * ChartCard - Wrapper component for charts with consistent styling
 * Provides card layout, title, subtitle, and loading state
 *
 * @param {string} title - Chart title
 * @param {string} subtitle - Optional subtitle/description
 * @param {boolean} isLoading - Loading state
 * @param {React.ReactNode} children - Chart component to render
 * @param {string} className - Additional CSS classes
 */
const ChartCard = ({
  title,
  subtitle,
  isLoading = false,
  children,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-6 ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-base font-semibold text-slate-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
              <p className="text-sm text-slate-500">Loading chart...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;
