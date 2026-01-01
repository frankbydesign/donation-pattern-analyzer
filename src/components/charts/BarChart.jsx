import React from 'react';
import { Bar } from 'react-chartjs-2';
import { barDefaults } from '../../config/chartDefaults';

/**
 * BarChart - Preconfigured bar chart component
 *
 * @param {Array} labels - X-axis labels
 * @param {Array} datasets - Chart datasets with data and styling
 * @param {Object} options - Additional Chart.js options (merged with defaults)
 * @param {number} height - Chart height in pixels (default: 300)
 */
const BarChart = ({
  labels = [],
  datasets = [],
  options = {},
  height = 300
}) => {
  // Check for empty data
  if (!labels.length || !datasets.length || !datasets.some(d => d.data?.length)) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Merge default options with provided options
  const mergedOptions = {
    ...barDefaults,
    ...options,
    plugins: {
      ...barDefaults.plugins,
      ...options.plugins,
      legend: {
        ...barDefaults.plugins?.legend,
        ...options.plugins?.legend,
        // Only show legend if multiple datasets
        display: datasets.length > 1 && (options.plugins?.legend?.display !== false),
      },
    },
  };

  const chartData = {
    labels,
    datasets,
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={chartData} options={mergedOptions} />
    </div>
  );
};

export default BarChart;
