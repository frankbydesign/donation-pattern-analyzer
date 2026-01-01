import React from 'react';
import { Line } from 'react-chartjs-2';
import { lineDefaults } from '../../config/chartDefaults';

/**
 * LineChart - Preconfigured line chart component
 *
 * @param {Array} labels - X-axis labels
 * @param {Array} datasets - Chart datasets with data and styling
 * @param {Object} options - Additional Chart.js options (merged with defaults)
 * @param {number} height - Chart height in pixels (default: 300)
 */
const LineChart = ({
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Merge default options with provided options
  const mergedOptions = {
    ...lineDefaults,
    ...options,
    plugins: {
      ...lineDefaults.plugins,
      ...options.plugins,
      legend: {
        ...lineDefaults.plugins?.legend,
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
      <Line data={chartData} options={mergedOptions} />
    </div>
  );
};

export default LineChart;
