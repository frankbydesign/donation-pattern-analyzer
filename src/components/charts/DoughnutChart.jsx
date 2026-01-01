import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { doughnutDefaults } from '../../config/chartDefaults';

/**
 * DoughnutChart - Preconfigured doughnut/pie chart component
 *
 * @param {Array} labels - Segment labels
 * @param {Array} datasets - Chart datasets with data and styling
 * @param {Object} options - Additional Chart.js options (merged with defaults)
 * @param {number} height - Chart height in pixels (default: 300)
 */
const DoughnutChart = ({
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Merge default options with provided options
  const mergedOptions = {
    ...doughnutDefaults,
    ...options,
    plugins: {
      ...doughnutDefaults.plugins,
      ...options.plugins,
      legend: {
        ...doughnutDefaults.plugins?.legend,
        ...options.plugins?.legend,
      },
      tooltip: {
        ...doughnutDefaults.plugins?.tooltip,
        ...options.plugins?.tooltip,
        callbacks: {
          // Custom tooltip for doughnut charts showing percentage
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);

            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          },
          ...options.plugins?.tooltip?.callbacks,
        }
      }
    },
  };

  const chartData = {
    labels,
    datasets,
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Doughnut data={chartData} options={mergedOptions} />
    </div>
  );
};

export default DoughnutChart;
