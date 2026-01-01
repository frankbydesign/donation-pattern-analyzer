/**
 * Chart.js default configurations and color palette
 * Provides consistent styling across all charts in the application
 */

/**
 * Base Chart.js configuration with consistent styling
 */
export const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        font: {
          family: "'IBM Plex Sans', sans-serif",
          size: 12,
        },
        color: '#64748B', // slate-500
        padding: 12,
        usePointStyle: true,
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: '#FFFFFF',
      titleColor: '#1E293B', // slate-800
      bodyColor: '#475569', // slate-600
      borderColor: '#E2E8F0', // slate-200
      borderWidth: 1,
      padding: 12,
      boxPadding: 6,
      usePointStyle: true,
      titleFont: {
        family: "'IBM Plex Sans', sans-serif",
        size: 13,
        weight: '600',
      },
      bodyFont: {
        family: "'IBM Plex Sans', sans-serif",
        size: 12,
      },
      callbacks: {
        // Format numbers with commas
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            // Check if this is a currency value (contains $ in dataset label or title)
            const isCurrency = context.dataset.label?.includes('$') ||
                             context.dataset.label?.toLowerCase().includes('revenue') ||
                             context.dataset.label?.toLowerCase().includes('amount');

            if (isCurrency) {
              label += '$' + context.parsed.y.toLocaleString();
            } else {
              label += context.parsed.y.toLocaleString();
            }
          }
          return label;
        }
      }
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        font: {
          family: "'IBM Plex Sans', sans-serif",
          size: 11,
        },
        color: '#64748B', // slate-500
      },
    },
    y: {
      grid: {
        color: '#E5E7EB', // gray-200
        drawBorder: false,
      },
      ticks: {
        font: {
          family: "'IBM Plex Sans', sans-serif",
          size: 11,
        },
        color: '#64748B', // slate-500
        // Format large numbers
        callback: function(value) {
          if (value >= 1000000) {
            return '$' + (value / 1000000).toFixed(1) + 'M';
          } else if (value >= 1000) {
            return '$' + (value / 1000).toFixed(0) + 'K';
          }
          return value;
        }
      },
      beginAtZero: true,
    },
  },
};

/**
 * Color palette for consistent chart styling
 */
export const colors = {
  // Semantic colors
  primary: '#4F46E5',      // indigo-600
  secondary: '#10B981',    // emerald-500
  warning: '#F59E0B',      // amber-500
  danger: '#DC2626',       // red-600
  neutral: '#6B7280',      // gray-500

  // Status colors
  success: '#10B981',      // emerald-500
  info: '#3B82F6',         // blue-500

  // Extended palette for multi-series data
  chartPalette: [
    '#4F46E5', // indigo
    '#10B981', // emerald
    '#F59E0B', // amber
    '#DC2626', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ],

  // Segment-specific colors (for donor segments)
  segments: {
    champions: '#10B981',    // emerald - high value, engaged
    loyal: '#3B82F6',        // blue - consistent supporters
    atRisk: '#F59E0B',       // amber - warning
    lapsed: '#DC2626',       // red - need reactivation
    new: '#8B5CF6',          // violet - new donors
  },

  // Risk level colors
  risk: {
    low: '#10B981',          // emerald
    medium: '#F59E0B',       // amber
    high: '#DC2626',         // red
  },

  // Chart background colors (with transparency)
  backgroundColors: {
    primary: 'rgba(79, 70, 229, 0.1)',      // indigo
    secondary: 'rgba(16, 185, 129, 0.1)',   // emerald
    warning: 'rgba(245, 158, 11, 0.1)',     // amber
    danger: 'rgba(220, 38, 38, 0.1)',       // red
  },
};

/**
 * Doughnut/Pie chart specific defaults
 */
export const doughnutDefaults = {
  ...chartDefaults,
  plugins: {
    ...chartDefaults.plugins,
    legend: {
      ...chartDefaults.plugins.legend,
      position: 'right',
    },
  },
  scales: undefined, // Doughnut charts don't use scales
};

/**
 * Line chart specific defaults
 */
export const lineDefaults = {
  ...chartDefaults,
  elements: {
    line: {
      tension: 0.3, // Slight curve for smoother lines
      borderWidth: 2,
    },
    point: {
      radius: 4,
      hitRadius: 10,
      hoverRadius: 6,
    },
  },
};

/**
 * Bar chart specific defaults
 */
export const barDefaults = {
  ...chartDefaults,
  barPercentage: 0.7,
  categoryPercentage: 0.8,
};
