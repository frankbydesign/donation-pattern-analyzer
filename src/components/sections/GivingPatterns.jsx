import React, { useMemo } from 'react';
import useDataStore from '../../store/dataStore';
import { ChartCard, BarChart } from '../charts';
import { colors } from '../../config/chartDefaults';
import { FilterStatus } from '../filters';

/**
 * GivingPatterns - Dashboard section displaying giving behavior patterns
 * Shows monthly trends, day of week patterns, and gift amount distribution
 */
const GivingPatterns = () => {
  const { isLoading, getFilteredGifts, getAllGifts, filters } = useDataStore();

  // Calculate monthly giving patterns from filtered gifts
  const monthlyPatternsData = useMemo(() => {
    const gifts = getFilteredGifts();
    if (!gifts || gifts.length === 0) return null;

    // Initialize counts for all 12 months
    const monthCounts = Array(12).fill(0);
    const monthlyRevenue = Array(12).fill(0);

    // Aggregate filtered gifts by month
    gifts.forEach(gift => {
      const date = new Date(gift.date);
      const month = date.getMonth(); // 0-11
      monthCounts[month]++;
      monthlyRevenue[month] += gift.amount;
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      labels: monthNames,
      datasets: [{
        label: 'Number of Gifts',
        data: monthCounts,
        backgroundColor: colors.primary,
        borderRadius: 4,
      }],
      rawData: monthCounts,
      monthlyRevenue,
    };
  }, [filters, getFilteredGifts]);

  // Calculate day of week patterns from filtered gifts
  const dayOfWeekData = useMemo(() => {
    const gifts = getFilteredGifts();
    if (!gifts || gifts.length === 0) return null;

    // Initialize counts for all 7 days
    const dayCounts = Array(7).fill(0);

    // Aggregate filtered gifts by day of week
    gifts.forEach(gift => {
      const date = new Date(gift.date);
      const day = date.getDay(); // 0-6 (Sunday-Saturday)
      dayCounts[day]++;
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Only return if there's meaningful data (not all zeros)
    const hasData = dayCounts.some(count => count > 0);
    if (!hasData) return null;

    return {
      labels: dayNames,
      datasets: [{
        label: 'Number of Gifts',
        data: dayCounts,
        backgroundColor: colors.info,
        borderRadius: 4,
      }],
      rawData: dayCounts,
    };
  }, [getFilteredGifts, filters]);

  // Calculate gift amount distribution from filtered gifts
  const amountDistributionData = useMemo(() => {
    const gifts = getFilteredGifts();
    if (!gifts || gifts.length === 0) return null;

    // Define amount ranges
    const ranges = [
      { label: '$1-$50', min: 0.01, max: 50 },
      { label: '$51-$100', min: 51, max: 100 },
      { label: '$101-$250', min: 101, max: 250 },
      { label: '$251-$500', min: 251, max: 500 },
      { label: '$501-$1,000', min: 501, max: 1000 },
      { label: '$1,000+', min: 1001, max: Infinity },
    ];

    const rangeCounts = ranges.map(() => 0);

    // Count filtered gifts in each range
    gifts.forEach(gift => {
      const amount = gift.amount;
      const rangeIndex = ranges.findIndex(
        range => amount >= range.min && amount <= range.max
      );
      if (rangeIndex !== -1) {
        rangeCounts[rangeIndex]++;
      }
    });

    return {
      labels: ranges.map(r => r.label),
      datasets: [{
        label: 'Number of Gifts',
        data: rangeCounts,
        backgroundColor: colors.success,
        borderRadius: 4,
      }],
      rawData: rangeCounts,
      ranges,
    };
  }, [getFilteredGifts, filters]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!monthlyPatternsData || !amountDistributionData) return null;

    // Find peak giving month
    const peakMonthIndex = monthlyPatternsData.rawData.indexOf(
      Math.max(...monthlyPatternsData.rawData)
    );
    const peakMonth = monthlyPatternsData.labels[peakMonthIndex];
    const peakMonthGifts = monthlyPatternsData.rawData[peakMonthIndex];

    // Find most common gift amount range
    const mostCommonRangeIndex = amountDistributionData.rawData.indexOf(
      Math.max(...amountDistributionData.rawData)
    );
    const mostCommonRange = amountDistributionData.labels[mostCommonRangeIndex];
    const mostCommonRangeCount = amountDistributionData.rawData[mostCommonRangeIndex];

    // Calculate total gifts
    const totalGifts = monthlyPatternsData.rawData.reduce((sum, count) => sum + count, 0);

    return {
      peakMonth,
      peakMonthGifts,
      peakMonthPercentage: totalGifts > 0 ? ((peakMonthGifts / totalGifts) * 100).toFixed(1) : 0,
      mostCommonRange,
      mostCommonRangeCount,
      mostCommonRangePercentage: totalGifts > 0 ? ((mostCommonRangeCount / totalGifts) * 100).toFixed(1) : 0,
      totalGifts,
    };
  }, [monthlyPatternsData, amountDistributionData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading giving patterns...</p>
        </div>
      </div>
    );
  }

  if (!monthlyPatternsData || !amountDistributionData || !metrics) {
    return (
      <div className="space-y-6">
        <FilterStatus mode="filtered" />
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-12">
          <div className="text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Gift Data in Selected Period</h3>
            <p className="text-slate-600 mb-4">
              No gifts were made during the selected time range.
            </p>
            <p className="text-sm text-slate-500">
              Try expanding the date range or resetting to "All Time" to view giving patterns.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total gifts for context
  const isFiltered = filters.dateRange !== null;
  const allGifts = getAllGifts();
  const totalFilteredGifts = metrics.totalGifts;
  const totalAllTimeGifts = allGifts.length;

  return (
    <div className="space-y-6">
      {/* Filter Status */}
      <FilterStatus
        mode="filtered"
        context={isFiltered
          ? `Based on ${totalFilteredGifts.toLocaleString()} gifts in selected period (vs. ${totalAllTimeGifts.toLocaleString()} all-time)`
          : null
        }
      />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Gifts */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Gifts</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {metrics.totalGifts.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Across all donors
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Peak Giving Month */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Peak Giving Month</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {metrics.peakMonth.substring(0, 3)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.peakMonthGifts.toLocaleString()} gifts ({metrics.peakMonthPercentage}%)
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Most Common Gift Range */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Most Common Range</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {metrics.mostCommonRange}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.mostCommonRangeCount.toLocaleString()} gifts ({metrics.mostCommonRangePercentage}%)
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Giving Patterns */}
        <ChartCard
          title="Monthly Giving Patterns"
          subtitle="Distribution of gifts across months of the year"
        >
          <BarChart
            labels={monthlyPatternsData.labels}
            datasets={monthlyPatternsData.datasets}
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

        {/* Gift Amount Distribution */}
        <ChartCard
          title="Gift Amount Distribution"
          subtitle="Number of gifts by dollar amount range"
        >
          <BarChart
            labels={amountDistributionData.labels}
            datasets={amountDistributionData.datasets}
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
      </div>

      {/* Bottom Row: Understanding Giving Patterns + Day of Week Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Understanding Giving Patterns - Left Column */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Understanding Giving Patterns</h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                {metrics.peakMonth} is your peak giving month, accounting for {metrics.peakMonthPercentage}% of all gifts.
                Most donors give in the {metrics.mostCommonRange} range. Use these insights to time fundraising campaigns
                and set realistic gift amount targets for different donor segments.
              </p>
            </div>
          </div>
        </div>

        {/* Day of Week Patterns - Right Column */}
        {dayOfWeekData && (
          <ChartCard
            title="Day of Week Patterns"
            subtitle="Distribution of gifts by day of the week"
          >
            <BarChart
              labels={dayOfWeekData.labels}
              datasets={dayOfWeekData.datasets}
              height={280}
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
        )}
      </div>
    </div>
  );
};

export default GivingPatterns;
