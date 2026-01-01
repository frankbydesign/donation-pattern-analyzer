import React, { useMemo, useState } from 'react';
import useDataStore from '../../store/dataStore';
import { ChartCard, LineChart } from '../charts';
import { FilterStatus } from '../filters';
import { colors } from '../../config/chartDefaults';

/**
 * ConcentrationRisk - Dashboard section for analyzing donor concentration and simulating donor loss
 * Shows revenue concentration, top donors, and "what if" scenarios
 */
const ConcentrationRisk = () => {
  const {
    layer1,
    isLoading,
    getFilteredDonors,
    filters,
    openDrillDownPanel,
    getDateRangeLabel
  } = useDataStore();

  // State for donor loss simulation
  const [excludedDonorIds, setExcludedDonorIds] = useState(new Set());

  // Calculate top donors and metrics
  const topDonorsData = useMemo(() => {
    if (!layer1) return null;

    const filteredDonors = getFilteredDonors();

    // Calculate total giving for each donor
    const donorsWithTotals = filteredDonors.map(donor => {
      const totalGiving = donor.gifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0;
      const giftCount = donor.gifts?.length || 0;
      const avgGift = giftCount > 0 ? totalGiving / giftCount : 0;
      const lastGiftDate = donor.gifts?.length > 0
        ? new Date(Math.max(...donor.gifts.map(g => new Date(g.date))))
        : null;

      return {
        ...donor,
        total_giving: totalGiving,
        gift_count: giftCount,
        avg_gift: avgGift,
        last_gift_date: lastGiftDate
      };
    });

    // Sort by total giving (descending)
    const sortedDonors = donorsWithTotals
      .filter(d => d.total_giving > 0)
      .sort((a, b) => b.total_giving - a.total_giving);

    // Calculate total revenue
    const totalRevenue = sortedDonors.reduce((sum, d) => sum + d.total_giving, 0);

    // Calculate cumulative revenue percentages for top N donors
    const concentrationPoints = [1, 5, 10, 20, 50, 100];
    const concentrationData = concentrationPoints.map(n => {
      const topN = sortedDonors.slice(0, n);
      const topNRevenue = topN.reduce((sum, d) => sum + d.total_giving, 0);
      const percentage = totalRevenue > 0 ? (topNRevenue / totalRevenue) * 100 : 0;
      return {
        n,
        percentage,
        revenue: topNRevenue
      };
    });

    return {
      sortedDonors,
      totalRevenue,
      concentrationData,
      totalDonors: sortedDonors.length
    };
  }, [layer1, getFilteredDonors]);

  // Calculate simulated metrics (with excluded donors removed)
  const simulatedMetrics = useMemo(() => {
    if (!topDonorsData) return null;

    // Filter out excluded donors
    const activeDonors = topDonorsData.sortedDonors.filter(
      d => !excludedDonorIds.has(d.donor_id)
    );

    const simulatedRevenue = activeDonors.reduce((sum, d) => sum + d.total_giving, 0);
    const excludedRevenue = topDonorsData.totalRevenue - simulatedRevenue;
    const revenueLoss = topDonorsData.totalRevenue > 0
      ? (excludedRevenue / topDonorsData.totalRevenue) * 100
      : 0;

    // Find new top donor after simulation
    const newTopDonor = activeDonors.length > 0 ? activeDonors[0] : null;

    // Calculate how many average donors would be needed to replace the lost revenue
    const avgGiftSize = activeDonors.length > 0
      ? activeDonors.reduce((sum, d) => sum + d.avg_gift, 0) / activeDonors.length
      : 0;
    const donorsToRecover = avgGiftSize > 0 ? Math.ceil(excludedRevenue / avgGiftSize) : 0;

    return {
      activeDonors,
      simulatedRevenue,
      excludedRevenue,
      revenueLoss,
      excludedCount: excludedDonorIds.size,
      newTopDonor,
      donorsToRecover,
      avgGiftSize
    };
  }, [topDonorsData, excludedDonorIds]);

  // Calculate concentration risk level and narrative
  const riskAssessment = useMemo(() => {
    if (!topDonorsData) return null;

    const top3 = topDonorsData.concentrationData.find(d => d.n === 5); // Using top 5 as proxy for top 3
    const top10 = topDonorsData.concentrationData.find(d => d.n === 10);

    let level = 'low';
    let color = 'emerald';
    let narrative = '';
    let recommendation = '';

    if (top10 && top10.percentage > 50) {
      level = 'high';
      color = 'red';
      narrative = `Your revenue is highly concentrated. Top 10 donors represent ${top10.percentage.toFixed(1)}% of total revenue.`;
      recommendation = 'Priority: Cultivate 10-15 mid-level donors ($1,000-$5,000) to reduce single-donor dependency. Consider creating a mid-level donor society to deepen engagement with donors ranked 11-30.';
    } else if (top10 && top10.percentage > 30) {
      level = 'moderate';
      color = 'amber';
      narrative = `Moderate concentration risk. Top 10 donors represent ${top10.percentage.toFixed(1)}% of total revenue.`;
      recommendation = 'Consider deepening relationships with donors ranked 10-25 to build your next tier of major donors. Focus on moving $500-$1,000 donors to $1,000-$2,500 range.';
    } else {
      level = 'low';
      color = 'emerald';
      narrative = `Healthy donor diversification. Top 10 donors represent ${top10 ? top10.percentage.toFixed(1) : 0}% of total revenue.`;
      recommendation = 'Continue broad-based cultivation while stewarding major donors. Monitor for shifts in concentration as your program grows.';
    }

    return {
      level,
      color,
      narrative,
      recommendation
    };
  }, [topDonorsData]);

  // Prepare concentration chart data
  const concentrationChartData = useMemo(() => {
    if (!topDonorsData) return null;

    return {
      labels: topDonorsData.concentrationData.map(d => `Top ${d.n}`),
      datasets: [{
        label: 'Cumulative Revenue %',
        data: topDonorsData.concentrationData.map(d => d.percentage),
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    };
  }, [topDonorsData]);

  // Handle toggling individual donors
  const toggleDonor = (donorId) => {
    setExcludedDonorIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(donorId)) {
        newSet.delete(donorId);
      } else {
        newSet.add(donorId);
      }
      return newSet;
    });
  };

  // Handle preset scenarios
  const handlePreset = (topN) => {
    if (!topDonorsData) return;

    const topNDonorIds = topDonorsData.sortedDonors
      .slice(0, topN)
      .map(d => d.donor_id);

    setExcludedDonorIds(new Set(topNDonorIds));
  };

  // Handle reset
  const handleReset = () => {
    setExcludedDonorIds(new Set());
  };

  // Handle select/deselect all
  const handleToggleAll = () => {
    if (!topDonorsData) return;

    if (excludedDonorIds.size > 0) {
      // Clear all
      setExcludedDonorIds(new Set());
    } else {
      // Select all top 20
      const top20Ids = topDonorsData.sortedDonors
        .slice(0, 20)
        .map(d => d.donor_id);
      setExcludedDonorIds(new Set(top20Ids));
    }
  };

  // Handle clicking on a donor to see details
  const handleDonorClick = (donor) => {
    const dateContext = filters.dateRange ? ` (${getDateRangeLabel()})` : '';
    openDrillDownPanel({
      type: 'topDonors',
      filter: 'single',
      title: `Donor ${donor.donor_id}${dateContext}`,
      donors: [donor]
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading concentration risk analysis...</p>
        </div>
      </div>
    );
  }

  if (!topDonorsData || topDonorsData.totalDonors === 0) {
    return (
      <div className="space-y-6">
        <FilterStatus mode="filtered" />
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-12">
          <div className="text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Donor Data Available</h3>
            <p className="text-slate-600">No donors found in the selected period.</p>
          </div>
        </div>
      </div>
    );
  }

  const isSimulating = excludedDonorIds.size > 0;

  return (
    <div className="space-y-6">
      {/* Filter Status */}
      <FilterStatus mode="filtered" />

      {/* Risk Assessment Banner */}
      {riskAssessment && (
        <div className={`bg-${riskAssessment.color}-50 border border-${riskAssessment.color}-200 rounded-lg p-6`}>
          <div className="flex items-start gap-3">
            <div className={`w-2 h-2 bg-${riskAssessment.color}-500 rounded-full mt-2 flex-shrink-0`}></div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold text-${riskAssessment.color}-900 mb-2`}>
                {riskAssessment.level === 'high' ? 'High Concentration Risk' :
                 riskAssessment.level === 'moderate' ? 'Moderate Concentration Risk' :
                 'Healthy Diversification'}
              </h3>
              <p className={`text-sm text-${riskAssessment.color}-800 mb-2`}>
                {riskAssessment.narrative}
              </p>
              <p className={`text-sm text-${riskAssessment.color}-700`}>
                <span className="font-semibold">→ </span>
                {riskAssessment.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* What-If Preset Buttons */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Quick Scenarios</h3>
          <p className="text-sm text-slate-600 mt-1">
            Instantly model the impact of losing your top donors
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handlePreset(1)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
          >
            What if we lose our #1 donor?
          </button>
          <button
            onClick={() => handlePreset(3)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
          >
            What if we lose our top 3 donors?
          </button>
          <button
            onClick={() => handlePreset(10)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
          >
            What if we lose our top 10 donors?
          </button>

          {isSimulating && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm ml-auto"
            >
              Reset Simulation
            </button>
          )}
        </div>
      </div>

      {/* Impact Summary (shown when simulating) */}
      {isSimulating && simulatedMetrics && (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-red-900">Simulated Impact</h3>
            <p className="text-sm text-red-700 mt-1">
              Showing projected revenue impact of losing {simulatedMetrics.excludedCount} donor{simulatedMetrics.excludedCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Revenue Impact */}
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <p className="text-sm font-medium text-slate-600 mb-2">Projected Revenue</p>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-slate-500 line-through">
                    ${topDonorsData.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    ${simulatedMetrics.simulatedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-red-600">
                    −${simulatedMetrics.excludedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} (−{simulatedMetrics.revenueLoss.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Remaining Donors */}
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <p className="text-sm font-medium text-slate-600 mb-2">Remaining Donors</p>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-slate-900">
                  {simulatedMetrics.activeDonors.length}
                </div>
                <div className="text-sm text-slate-600">
                  of {topDonorsData.totalDonors} total donors
                </div>
              </div>
            </div>

            {/* New Top Donor */}
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <p className="text-sm font-medium text-slate-600 mb-2">New Top Donor</p>
              <div className="space-y-1">
                {simulatedMetrics.newTopDonor ? (
                  <>
                    <div className="text-lg font-bold text-slate-900">
                      {simulatedMetrics.newTopDonor.donor_id}
                    </div>
                    <div className="text-sm text-slate-600">
                      ${simulatedMetrics.newTopDonor.total_giving.toLocaleString(undefined, { maximumFractionDigits: 0 })} total
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-500">No donors remaining</div>
                )}
              </div>
            </div>
          </div>

          {/* Recovery Analysis */}
          <div className="mt-4 p-4 bg-white rounded-lg border border-red-200">
            <p className="text-sm font-medium text-slate-700 mb-1">Time to Recover</p>
            <p className="text-sm text-slate-600">
              Approximately <span className="font-semibold text-slate-900">{simulatedMetrics.donorsToRecover} new donors</span> at
              average gift of <span className="font-semibold">${simulatedMetrics.avgGiftSize.toFixed(0)}</span> would be needed to replace the lost revenue.
            </p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Concentration Chart */}
        <ChartCard
          title="Revenue Concentration Curve"
          subtitle="Cumulative % of total revenue by top N donors"
        >
          {concentrationChartData ? (
            <LineChart
              labels={concentrationChartData.labels}
              datasets={concentrationChartData.datasets}
              height={300}
              options={{
                scales: {
                  y: {
                    min: 0,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  }
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return context.parsed.y.toFixed(1) + '% of total revenue';
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-400">
              <p>No data available</p>
            </div>
          )}
        </ChartCard>

        {/* Key Metrics with Progress Bars */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Concentration Metrics</h3>
          <div className="space-y-4">
            {topDonorsData.concentrationData.slice(0, 4).map((point, idx) => {
              const percentage = point.percentage;
              const indicator = percentage > 50 ? 'red' : percentage > 30 ? 'amber' : 'emerald';
              const barColor = percentage > 50 ? 'bg-red-500' : percentage > 30 ? 'bg-amber-500' : 'bg-emerald-500';
              const bgColor = percentage > 50 ? 'bg-red-100' : percentage > 30 ? 'bg-amber-100' : 'bg-emerald-100';

              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Top {point.n} donors</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {point.percentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-500">
                        (${point.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className={`w-full h-2 ${bgColor} rounded-full overflow-hidden`}>
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Donors Table */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Top 20 Donors</h3>
              <p className="text-sm text-slate-600 mt-1">
                Toggle donors to simulate loss and see revenue impact
              </p>
            </div>
            <button
              onClick={handleToggleAll}
              className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              {excludedDonorIds.size > 0 ? 'Clear All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Inline Impact Summary (sticky when donors are selected) */}
        {isSimulating && simulatedMetrics && (
          <div className="sticky top-0 z-10 bg-gradient-to-r from-red-50 to-orange-50 border-b-2 border-red-300 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-red-700 font-medium">Selected Donors</p>
                  <p className="text-lg font-bold text-red-900">{simulatedMetrics.excludedCount}</p>
                </div>
                <div className="h-8 w-px bg-red-300"></div>
                <div>
                  <p className="text-xs text-red-700 font-medium">Revenue Impact</p>
                  <p className="text-lg font-bold text-red-900">
                    −${simulatedMetrics.excludedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="h-8 w-px bg-red-300"></div>
                <div>
                  <p className="text-xs text-red-700 font-medium">% of Total</p>
                  <p className="text-lg font-bold text-red-900">
                    −{simulatedMetrics.revenueLoss.toFixed(1)}%
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white text-red-700 font-medium text-sm rounded-lg hover:bg-red-50 border border-red-300 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={excludedDonorIds.size > 0}
                    onChange={handleToggleAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Donor ID
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Given
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  # Gifts
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Avg Gift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Last Gift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {topDonorsData.sortedDonors.slice(0, 20).map((donor, index) => {
                const isExcluded = excludedDonorIds.has(donor.donor_id);
                const rowClass = isExcluded
                  ? 'bg-red-50 opacity-60'
                  : 'hover:bg-slate-50';

                return (
                  <tr key={donor.donor_id} className={rowClass}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isExcluded}
                        onChange={() => toggleDonor(donor.donor_id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDonorClick(donor)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {donor.donor_id}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-slate-900">
                      ${donor.total_giving.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600">
                      {donor.gift_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600">
                      ${donor.avg_gift.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {donor.last_gift_date
                        ? donor.last_gift_date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isExcluded ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Excluded
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConcentrationRisk;
