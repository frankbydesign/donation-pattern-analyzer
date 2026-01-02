import React, { useMemo, useState } from 'react';
import useDataStore from '../../store/dataStore';
import { ChartCard, LineChart, BarChart } from '../charts';
import { colors } from '../../config/chartDefaults';
import { FilterStatus } from '../filters';

/**
 * TemporalTrends - Dashboard section displaying temporal donor behavior trends
 * Shows year-over-year donor counts, new vs returning donors, and cohort retention analysis
 * HIGHLIGHTED mode: Shows ALL data but visually highlights the selected period
 */
const TemporalTrends = () => {
  const {
    layer1,
    layer2,
    isLoading,
    filters,
    getDateRangeBounds,
    openDrillDownPanel,
    getDonorsByCohort,
    getDonorsRetainedInYear,
    getNewDonorsByYear,
    getReturningDonorsByYear
  } = useDataStore();

  // State for cohort retention view toggle
  const [retentionView, setRetentionView] = useState('heatmap'); // 'heatmap' or 'table'

  // Helper function to get heatmap color based on retention percentage
  const getRetentionColor = (rate) => {
    if (rate === undefined || rate === null) return { bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200' };
    if (rate >= 60) return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' };
    if (rate >= 40) return { bg: 'bg-emerald-400', text: 'text-emerald-900', border: 'border-emerald-500' };
    if (rate >= 20) return { bg: 'bg-yellow-300', text: 'text-yellow-900', border: 'border-yellow-400' };
    if (rate >= 10) return { bg: 'bg-orange-300', text: 'text-orange-900', border: 'border-orange-400' };
    return { bg: 'bg-red-400', text: 'text-red-900', border: 'border-red-500' };
  };

  // Get date range for highlighting
  const dateRangeBounds = getDateRangeBounds();

  // Calculate year-over-year donor counts
  const yoyDonorCountsData = useMemo(() => {
    if (!layer1?.donors) return null;

    // Track unique donors per year
    const donorsByYear = {};

    layer1.donors.forEach(donor => {
      if (!donor.gifts) return;

      // Track which years this donor gave in
      const yearsActive = new Set();
      donor.gifts.forEach(gift => {
        const year = new Date(gift.date).getFullYear();
        yearsActive.add(year);
      });

      // Add this donor to each year they gave
      yearsActive.forEach(year => {
        if (!donorsByYear[year]) {
          donorsByYear[year] = new Set();
        }
        donorsByYear[year].add(donor.donor_id);
      });
    });

    // Convert to sorted arrays
    const years = Object.keys(donorsByYear).sort();
    const counts = years.map(year => donorsByYear[year].size);

    // Create point styles based on highlighting
    // BUG FIX: Make points always visible (5-6px), with highlighted points even larger (8px)
    const pointRadii = years.map(year => {
      if (!dateRangeBounds) return 5; // Default: clearly visible points
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      const isHighlighted = yearStart <= dateRangeBounds.end && yearEnd >= dateRangeBounds.start;
      return isHighlighted ? 8 : 4; // Highlighted: large, non-highlighted: smaller but still visible
    });

    const pointBorderWidths = years.map(year => {
      if (!dateRangeBounds) return 2; // Default: visible border
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      const isHighlighted = yearStart <= dateRangeBounds.end && yearEnd >= dateRangeBounds.start;
      return isHighlighted ? 3 : 2; // Thicker border for highlighted
    });

    // BUG FIX: Use segment styling to make highlighting OBVIOUS with opacity changes
    const segmentBorderColor = (ctx) => {
      if (!dateRangeBounds) return colors.primary;
      const year = years[ctx.p0DataIndex];
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      const isHighlighted = yearStart <= dateRangeBounds.end && yearEnd >= dateRangeBounds.start;
      return isHighlighted ? colors.primary : colors.primary + '60'; // 60% opacity for non-highlighted
    };

    const segmentBackgroundColor = (ctx) => {
      if (!dateRangeBounds) return colors.primary + '20';
      const year = years[ctx.p0DataIndex];
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      const isHighlighted = yearStart <= dateRangeBounds.end && yearEnd >= dateRangeBounds.start;
      return isHighlighted ? colors.primary + '30' : colors.primary + '10'; // More transparent for non-highlighted
    };

    return {
      labels: years,
      datasets: [{
        label: 'Unique Donors',
        data: counts,
        borderColor: colors.primary,
        backgroundColor: colors.primary + '20',
        segment: {
          borderColor: segmentBorderColor,
          backgroundColor: segmentBackgroundColor,
        },
        tension: 0.4,
        fill: true,
        pointRadius: pointRadii,
        pointHoverRadius: pointRadii.map(r => r + 2),
        pointBorderColor: colors.primary,
        pointBackgroundColor: '#ffffff',
        pointBorderWidth: pointBorderWidths,
      }],
      rawData: { years, counts },
    };
  }, [layer1, dateRangeBounds]);

  // Calculate new vs returning donors by year
  const newVsReturningData = useMemo(() => {
    if (!layer1?.donors) return null;

    const yearStats = {};

    layer1.donors.forEach(donor => {
      if (!donor.first_gift) return;

      const firstGiftYear = new Date(donor.first_gift).getFullYear();

      // Track which years this donor gave in
      const yearsActive = new Set();
      if (donor.gifts) {
        donor.gifts.forEach(gift => {
          const year = new Date(gift.date).getFullYear();
          yearsActive.add(year);
        });
      }

      // Classify each year of activity
      yearsActive.forEach(year => {
        if (!yearStats[year]) {
          yearStats[year] = { new: 0, returning: 0 };
        }

        if (year === firstGiftYear) {
          yearStats[year].new++;
        } else {
          yearStats[year].returning++;
        }
      });
    });

    const years = Object.keys(yearStats).sort();
    const newDonors = years.map(year => yearStats[year].new);
    const returningDonors = years.map(year => yearStats[year].returning);

    // BUG FIX: Use opacity to make highlighting OBVIOUS (100% for highlighted, 50% for non-highlighted)
    const returningOpacity = years.map(year => {
      if (!dateRangeBounds) return 1.0; // No filter: full opacity
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      const isHighlighted = yearStart <= dateRangeBounds.end && yearEnd >= dateRangeBounds.start;
      return isHighlighted ? 1.0 : 0.4; // Highlighted: full opacity, non-highlighted: 40% opacity
    });

    const newOpacity = years.map(year => {
      if (!dateRangeBounds) return 1.0; // No filter: full opacity
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      const isHighlighted = yearStart <= dateRangeBounds.end && yearEnd >= dateRangeBounds.start;
      return isHighlighted ? 1.0 : 0.4; // Highlighted: full opacity, non-highlighted: 40% opacity
    });

    // Create background colors with opacity
    const returningBackgroundColors = returningOpacity.map(opacity => {
      const hex = colors.success.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    });

    const newBackgroundColors = newOpacity.map(opacity => {
      const hex = colors.info.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    });

    return {
      labels: years,
      datasets: [
        {
          label: 'Returning Donors',
          data: returningDonors,
          backgroundColor: returningBackgroundColors,
          borderRadius: 4,
          borderWidth: 0,
        },
        {
          label: 'New Donors',
          data: newDonors,
          backgroundColor: newBackgroundColors,
          borderRadius: 4,
          borderWidth: 0,
        }
      ],
      rawData: { years, newDonors, returningDonors, yearStats },
    };
  }, [layer1, dateRangeBounds]);

  // Process cohort retention data from layer2
  const cohortRetentionData = useMemo(() => {
    if (!layer2?.retention_analysis?.cohort_retention) return null;

    const cohorts = layer2.retention_analysis.cohort_retention;
    const cohortYears = Object.keys(cohorts).sort();

    // Build retention table data
    const tableData = cohortYears.map(cohortYear => {
      const cohort = cohorts[cohortYear];
      const acquired = cohort.acquired || 0;
      const retentionRates = cohort.retention_rates || {};

      // Get retention rates for subsequent years
      const rates = {};
      Object.keys(retentionRates).forEach(year => {
        const yearDiff = parseInt(year) - parseInt(cohortYear);
        if (yearDiff > 0) {
          rates[`Year ${yearDiff}`] = retentionRates[year].retention_rate;
        }
      });

      return {
        cohortYear,
        acquired,
        rates,
      };
    });

    return {
      cohorts: tableData,
      cohortYears,
    };
  }, [layer2]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!newVsReturningData || !cohortRetentionData) return null;

    // Best acquisition year (most new donors)
    const { years, yearStats } = newVsReturningData.rawData;
    let bestAcqYear = years[0];
    let bestAcqCount = 0;

    years.forEach(year => {
      if (yearStats[year].new > bestAcqCount) {
        bestAcqCount = yearStats[year].new;
        bestAcqYear = year;
      }
    });

    // Best retention cohort (highest first-year retention)
    let bestRetentionCohort = null;
    let bestRetentionRate = 0;

    cohortRetentionData.cohorts.forEach(cohort => {
      const year1Rate = cohort.rates['Year 1'];
      if (year1Rate && year1Rate > bestRetentionRate) {
        bestRetentionRate = year1Rate;
        bestRetentionCohort = cohort.cohortYear;
      }
    });

    // Calculate average first-year retention
    let totalRetention = 0;
    let cohortCount = 0;
    cohortRetentionData.cohorts.forEach(cohort => {
      const year1Rate = cohort.rates['Year 1'];
      if (year1Rate) {
        totalRetention += year1Rate;
        cohortCount++;
      }
    });
    const avgFirstYearRetention = cohortCount > 0 ? (totalRetention / cohortCount).toFixed(1) : 0;

    return {
      bestAcqYear,
      bestAcqCount,
      bestRetentionCohort,
      bestRetentionRate: bestRetentionRate.toFixed(1),
      avgFirstYearRetention,
    };
  }, [newVsReturningData, cohortRetentionData]);

  // Handle cohort year click
  const handleCohortClick = (cohortYear) => {
    const donors = getDonorsByCohort(cohortYear);
    openDrillDownPanel({
      type: 'cohort',
      filter: cohortYear,
      title: `${cohortYear} Cohort Donors`,
      donors
    });
  };

  // Handle cohort retention cell click
  const handleRetentionCellClick = (cohortYear, yearNum) => {
    const retentionYear = parseInt(cohortYear) + yearNum;
    const donors = getDonorsRetainedInYear(cohortYear, retentionYear);
    openDrillDownPanel({
      type: 'cohortRetention',
      filter: `${cohortYear}-year${yearNum}`,
      title: `${cohortYear} Cohort - Retained in ${retentionYear}`,
      donors
    });
  };

  // Handle new donors click from chart
  const handleNewDonorsClick = (year) => {
    const donors = getNewDonorsByYear(year);
    openDrillDownPanel({
      type: 'newDonors',
      filter: year,
      title: `New Donors in ${year}`,
      donors
    });
  };

  // Handle returning donors click from chart
  const handleReturningDonorsClick = (year) => {
    const donors = getReturningDonorsByYear(year);
    openDrillDownPanel({
      type: 'returningDonors',
      filter: year,
      title: `Returning Donors in ${year}`,
      donors
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading temporal trends...</p>
        </div>
      </div>
    );
  }

  if (!yoyDonorCountsData || !newVsReturningData || !cohortRetentionData || !metrics) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <p className="text-amber-800">Unable to load temporal trends data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Status - Highlighted Mode */}
      <FilterStatus mode="highlighted" />

      {/* Time Filter Notice - Only shown when time filter is active */}
      {filters.dateRange && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              Trend analyses show complete historical data and are not affected by the time period filter. Full history is required to track cohort retention and year-over-year patterns.
            </p>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Best Acquisition Year */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Best Acquisition Year</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {metrics.bestAcqYear}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.bestAcqCount.toLocaleString()} new donors
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Best Retention Cohort */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Best Retention Cohort</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">
                {metrics.bestRetentionCohort || 'N/A'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.bestRetentionRate}% retained year 1
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Average First-Year Retention */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg. First-Year Retention</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {metrics.avgFirstYearRetention}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Across all cohorts
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Year-over-Year Donor Counts */}
        <ChartCard
          title="Year-over-Year Donor Counts"
          subtitle="Number of unique donors who gave each year"
        >
          <LineChart
            labels={yoyDonorCountsData.labels}
            datasets={yoyDonorCountsData.datasets}
            height={300}
            options={{
              scales: {
                y: {
                  ticks: {
                    callback: function(value) {
                      return value.toLocaleString();
                    }
                  }
                }
              }
            }}
          />
        </ChartCard>

        {/* New vs Returning Donors */}
        <ChartCard
          title="New vs Returning Donors"
          subtitle="First-time vs repeat donors by year"
        >
          <div className="relative group">
            <BarChart
              labels={newVsReturningData.labels}
              datasets={newVsReturningData.datasets}
              height={300}
              options={{
                scales: {
                  y: {
                    stacked: true,
                    ticks: {
                      callback: function(value) {
                        return value.toLocaleString();
                      }
                    }
                  },
                  x: {
                    stacked: true,
                  }
                },
                onClick: (event, elements) => {
                  if (elements.length > 0) {
                    const datasetIndex = elements[0].datasetIndex;
                    const index = elements[0].index;
                    const year = newVsReturningData.labels[index];

                    // Dataset 0 is Returning, Dataset 1 is New
                    if (datasetIndex === 1) {
                      handleNewDonorsClick(year);
                    } else if (datasetIndex === 0) {
                      handleReturningDonorsClick(year);
                    }
                  }
                },
                onHover: (event, elements) => {
                  event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
              }}
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow-lg">
                Click segments to view donors
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Cohort Retention Heatmap/Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Cohort Retention Analysis</h3>
            <p className="text-sm text-slate-600 mt-1">
              Read rows left-to-right to see how each cohort retained over time
            </p>
          </div>
          {/* View Toggle */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setRetentionView('heatmap')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                retentionView === 'heatmap'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setRetentionView('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                retentionView === 'table'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table
            </button>
          </div>
        </div>

        {/* Heatmap View */}
        {retentionView === 'heatmap' && (
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="inline-block min-w-full">
              {/* Header Row */}
              <div className="flex items-center mb-2 min-w-max">
                <div className="w-32 px-3 py-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-slate-700 uppercase">Cohort</span>
                </div>
                <div className="w-24 px-3 py-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-slate-700 uppercase">Acquired</span>
                </div>
                {[1, 2, 3, 4, 5].map(yearNum => (
                  <div key={yearNum} className="w-24 px-3 py-2 text-center flex-shrink-0">
                    <span className="text-xs font-semibold text-slate-700 uppercase">Year {yearNum}</span>
                  </div>
                ))}
              </div>

              {/* Data Rows */}
              {cohortRetentionData.cohorts.map((cohort, index) => (
                <div key={cohort.cohortYear} className="flex items-center mb-1 min-w-max">
                  {/* Cohort Year + Size */}
                  <div className="w-32 px-3 py-2 flex-shrink-0">
                    <button
                      onClick={() => handleCohortClick(cohort.cohortYear)}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {cohort.cohortYear}
                    </button>
                  </div>
                  <div className="w-24 px-3 py-2 flex-shrink-0">
                    <span className="text-xs text-slate-600">{cohort.acquired.toLocaleString()}</span>
                  </div>

                  {/* Retention Cells */}
                  {[1, 2, 3, 4, 5].map(yearNum => {
                    const rate = cohort.rates[`Year ${yearNum}`];
                    const colors = getRetentionColor(rate);
                    const retentionYear = parseInt(cohort.cohortYear) + yearNum;

                    return (
                      <div key={yearNum} className="w-24 px-1 py-1 flex-shrink-0">
                        {rate !== undefined ? (
                          <button
                            onClick={() => handleRetentionCellClick(cohort.cohortYear, yearNum)}
                            className={`w-full h-12 ${colors.bg} ${colors.text} ${colors.border} border rounded flex flex-col items-center justify-center hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer group relative`}
                            title={`${cohort.cohortYear} cohort: ${rate.toFixed(1)}% retained in ${retentionYear}`}
                          >
                            <span className="text-sm font-bold">{rate.toFixed(1)}%</span>
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              {cohort.cohortYear} cohort: {rate.toFixed(1)}% retained in Year {yearNum}
                            </div>
                          </button>
                        ) : (
                          <div className={`w-full h-12 ${colors.bg} ${colors.text} ${colors.border} border rounded flex items-center justify-center`}>
                            <span className="text-sm">—</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Color Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs border-t border-slate-200 pt-4">
              <span className="font-semibold text-slate-700">Legend:</span>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-emerald-600 rounded"></span>
                <span className="text-slate-600">60%+ (Excellent)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-emerald-400 rounded"></span>
                <span className="text-slate-600">40-60% (Good)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-yellow-300 rounded"></span>
                <span className="text-slate-600">20-40% (Fair)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-orange-300 rounded"></span>
                <span className="text-slate-600">10-20% (Poor)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-red-400 rounded"></span>
                <span className="text-slate-600">&lt;10% (Critical)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-slate-100 border border-slate-200 rounded"></span>
                <span className="text-slate-600">No data</span>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        {retentionView === 'table' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Cohort Year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Donors Acquired
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Year 1
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Year 2
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Year 3
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Year 4
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Year 5
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {cohortRetentionData.cohorts.map((cohort, index) => (
                  <tr key={cohort.cohortYear} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td
                      className="px-4 py-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer underline"
                      onClick={() => handleCohortClick(cohort.cohortYear)}
                    >
                      {cohort.cohortYear}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {cohort.acquired.toLocaleString()}
                    </td>
                    {[1, 2, 3, 4, 5].map(yearNum => {
                      const rate = cohort.rates[`Year ${yearNum}`];
                      return (
                        <td key={yearNum} className="px-4 py-3 text-sm">
                          {rate !== undefined ? (
                            <button
                              onClick={() => handleRetentionCellClick(cohort.cohortYear, yearNum)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all ${
                                rate >= 30 ? 'bg-emerald-100 text-emerald-800' :
                                rate >= 20 ? 'bg-blue-100 text-blue-800' :
                                rate >= 10 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {rate.toFixed(1)}%
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-xs text-slate-500 italic text-center">
          Click cohort years or retention cells to view donor details
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-3xl mx-auto">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Understanding Cohort Retention</h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              The cohort retention table shows what percentage of donors acquired in each year returned to give again
              in subsequent years. The {metrics.bestRetentionCohort} cohort had the highest first-year retention at {metrics.bestRetentionRate}%.
              Improving first-year retention is critical for long-term donor value—focus on stewardship and engagement
              of new donors in their first 12 months.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalTrends;
