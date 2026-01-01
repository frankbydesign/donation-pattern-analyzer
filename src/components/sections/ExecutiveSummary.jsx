import React, { useMemo } from 'react';
import useDataStore from '../../store/dataStore';
import { ChartCard, BarChart, DoughnutChart } from '../charts';
import { colors } from '../../config/chartDefaults';

/**
 * ExecutiveSummary - Dashboard section displaying key metrics and overview charts
 * Shows total donors, revenue, average gift size, segment distribution, and revenue trends
 */
const ExecutiveSummary = () => {
  const { layer1, layer2, isLoading } = useDataStore();

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!layer1 || !layer2) return null;

    const totalDonors = layer2.executive_summary?.key_metrics?.total_donors || 0;
    const totalRevenue = layer2.executive_summary?.key_metrics?.total_revenue || 0;
    const avgGiftSize = layer2.executive_summary?.key_metrics?.avg_gift_size || 0;

    return {
      totalDonors,
      totalRevenue,
      avgGiftSize,
    };
  }, [layer1, layer2]);

  // Prepare donor segment distribution data for doughnut chart
  const segmentChartData = useMemo(() => {
    if (!layer2) return null;

    const healthIndicators = layer2.executive_summary?.health_indicators || {};
    const champions = healthIndicators.champion_donors || 0;
    const atRisk = healthIndicators.total_at_risk || 0;
    const lapsed = healthIndicators.lapsed_donors || 0;

    // Calculate "active" donors (not champions, not at-risk, not lapsed)
    const total = layer2.executive_summary?.key_metrics?.total_donors || 0;
    const active = Math.max(0, total - champions - atRisk - lapsed);

    return {
      labels: ['Champions', 'Active', 'At Risk', 'Lapsed'],
      datasets: [{
        data: [champions, active, atRisk, lapsed],
        backgroundColor: [
          colors.segments.champions,  // emerald
          colors.segments.loyal,       // blue
          colors.segments.atRisk,      // amber
          colors.segments.lapsed,      // red
        ],
        borderWidth: 0,
      }],
    };
  }, [layer2]);

  // Prepare revenue by year data for bar chart
  const revenueByYearData = useMemo(() => {
    if (!layer1?.donors) return null;

    // Aggregate gifts by year
    const yearlyRevenue = {};

    layer1.donors.forEach(donor => {
      if (!donor.gifts) return;

      donor.gifts.forEach(gift => {
        const year = new Date(gift.date).getFullYear();
        if (!yearlyRevenue[year]) {
          yearlyRevenue[year] = 0;
        }
        yearlyRevenue[year] += gift.amount;
      });
    });

    // Sort years and prepare chart data
    const years = Object.keys(yearlyRevenue).sort();
    const revenues = years.map(year => yearlyRevenue[year]);

    return {
      labels: years,
      datasets: [{
        label: 'Revenue',
        data: revenues,
        backgroundColor: colors.primary,
        borderRadius: 4,
      }],
    };
  }, [layer1]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading executive summary...</p>
        </div>
      </div>
    );
  }

  if (!metrics || !segmentChartData || !revenueByYearData) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <p className="text-amber-800">Unable to load executive summary data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Donors */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Donors</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {metrics.totalDonors.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                ${metrics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Average Gift Size */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Average Gift Size</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                ${metrics.avgGiftSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donor Segments Distribution */}
        <ChartCard
          title="Donor Segments"
          subtitle="Distribution of donors by engagement level"
        >
          <DoughnutChart
            labels={segmentChartData.labels}
            datasets={segmentChartData.datasets}
            height={280}
          />
        </ChartCard>

        {/* Revenue by Year */}
        <ChartCard
          title="Revenue Trends"
          subtitle="Annual revenue over time"
        >
          <BarChart
            labels={revenueByYearData.labels}
            datasets={revenueByYearData.datasets}
            height={280}
            options={{
              scales: {
                y: {
                  ticks: {
                    callback: function(value) {
                      if (value >= 1000000) {
                        return '$' + (value / 1000000).toFixed(1) + 'M';
                      } else if (value >= 1000) {
                        return '$' + (value / 1000).toFixed(0) + 'K';
                      }
                      return '$' + value;
                    }
                  }
                }
              }
            }}
          />
        </ChartCard>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
