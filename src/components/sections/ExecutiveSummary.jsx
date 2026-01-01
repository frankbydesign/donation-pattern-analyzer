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

    // Calculate anonymous donor statistics
    const anonymousDonors = layer1.donors?.filter(donor => donor.is_anonymous === true) || [];
    const anonymousRevenue = anonymousDonors.reduce((sum, donor) => sum + (donor.total_amount || 0), 0);
    const anonymousCount = anonymousDonors.length;

    // Calculate contactable donors (excluding anonymous)
    const contactableDonors = layer1.donors?.filter(donor => donor.is_anonymous !== true) || [];
    const contactableCount = contactableDonors.length;

    return {
      totalDonors,
      totalRevenue,
      avgGiftSize,
      anonymousRevenue,
      anonymousCount,
      contactableCount,
    };
  }, [layer1, layer2]);

  // Generate actionable insights based on data
  const insights = useMemo(() => {
    if (!layer1 || !layer2 || !metrics) return [];

    const generatedInsights = [];

    // Calculate retention rate (contactable donors only)
    const contactableDonors = layer1.donors?.filter(donor => donor.is_anonymous !== true) || [];
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const activeContactable = contactableDonors.filter(donor => {
      const lastGiftDate = donor.last_gift ? new Date(donor.last_gift) : null;
      return lastGiftDate && lastGiftDate >= oneYearAgo;
    }).length;
    const retentionRate = contactableDonors.length > 0
      ? (activeContactable / contactableDonors.length) * 100
      : 0;

    // Calculate top 10 donor concentration
    const sortedDonors = [...(layer1.donors || [])].sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));
    const top10Revenue = sortedDonors.slice(0, 10).reduce((sum, donor) => sum + (donor.total_amount || 0), 0);
    const concentrationPct = metrics.totalRevenue > 0 ? (top10Revenue / metrics.totalRevenue) * 100 : 0;

    // Calculate lapse risk percentage (contactable donors only)
    const anonymousDonorIds = new Set(
      layer1.donors?.filter(donor => donor.is_anonymous === true).map(donor => donor.donor_id) || []
    );
    let highRiskCount = 0;
    if (layer2.lapse_risk_analysis?.individual_risks) {
      highRiskCount = Object.entries(layer2.lapse_risk_analysis.individual_risks)
        .filter(([donorId, riskData]) => {
          const isAnonymous = anonymousDonorIds.has(donorId);
          const isHighRisk = riskData.risk_level?.toLowerCase() === 'high';
          return !isAnonymous && isHighRisk;
        })
        .length;
    }
    const lapseRiskPct = contactableDonors.length > 0 ? (highRiskCount / contactableDonors.length) * 100 : 0;

    // Calculate revenue by month/year
    const revenueByMonth = {};
    layer1.donors?.forEach(donor => {
      donor.gifts?.forEach(gift => {
        const date = new Date(gift.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + gift.amount;
      });
    });

    // Find December revenue
    const decemberRevenue = Object.entries(revenueByMonth)
      .filter(([month]) => month.endsWith('-12'))
      .reduce((sum, [, amount]) => sum + amount, 0);
    const decemberPct = metrics.totalRevenue > 0 ? (decemberRevenue / metrics.totalRevenue) * 100 : 0;

    // Calculate YoY revenue growth
    const revenueByYear = {};
    layer1.donors?.forEach(donor => {
      donor.gifts?.forEach(gift => {
        const year = new Date(gift.date).getFullYear();
        revenueByYear[year] = (revenueByYear[year] || 0) + gift.amount;
      });
    });
    const years = Object.keys(revenueByYear).sort();
    let yoyGrowth = 0;
    if (years.length >= 2) {
      const lastYear = revenueByYear[years[years.length - 1]];
      const prevYear = revenueByYear[years[years.length - 2]];
      yoyGrowth = prevYear > 0 ? ((lastYear - prevYear) / prevYear) * 100 : 0;
    }

    // RED (Critical) Insights
    if (retentionRate < 40) {
      generatedInsights.push({
        severity: 'critical',
        finding: `Retention rate (${retentionRate.toFixed(1)}%) is significantly below sector benchmark (40-45%).`,
        action: 'Consider focusing on repeat donation strategies such as thank-you calls within 48 hours of first gift, monthly giving program promotion, or personalized impact updates to recent donors.',
        priority: 1
      });
    }

    if (concentrationPct > 50) {
      generatedInsights.push({
        severity: 'critical',
        finding: `Top 10 donors account for ${concentrationPct.toFixed(1)}% of total revenue.`,
        action: 'This concentration creates risk if any major donor lapses. Consider cultivating 5-10 mid-level donors ($500-$1,000) to reduce dependency on your largest gifts.',
        priority: 1
      });
    }

    // YELLOW (Warning) Insights
    if (lapseRiskPct > 30) {
      generatedInsights.push({
        severity: 'warning',
        finding: `${highRiskCount} donors (${lapseRiskPct.toFixed(1)}% of contactable base) show elevated lapse risk.`,
        action: 'These donors gave consistently before but have gone quiet. A targeted reactivation campaign—personal outreach, not mass email—could recover 10-20% before they fully lapse.',
        priority: 2
      });
    }

    if (decemberPct > 30) {
      generatedInsights.push({
        severity: 'warning',
        finding: `December accounts for ${decemberPct.toFixed(1)}% of annual giving.`,
        action: 'Ensure your year-end campaign is adequately resourced, and consider whether a mid-year campaign could reduce seasonal dependency.',
        priority: 2
      });
    }

    // GREEN (Positive) Insights
    if (yoyGrowth > 0) {
      const donorChange = years.length >= 2 ?
        ((layer1.donors?.length || 0) - (layer1.donors?.filter(d => d.first_gift && new Date(d.first_gift).getFullYear() >= parseInt(years[years.length - 2])).length || 0)) : 0;

      let context = '';
      if (donorChange < 0) {
        context = ' despite donor decline';
      } else if (metrics.avgGiftSize > 100) {
        context = ', driven by increased average gift size';
      }

      generatedInsights.push({
        severity: 'positive',
        finding: `Revenue grew ${yoyGrowth.toFixed(1)}% year-over-year${context}.`,
        action: 'Continue monitoring trends and donor engagement strategies that are working.',
        priority: 3
      });
    }

    if (metrics.anonymousCount > 0) {
      const anonymousPct = (metrics.anonymousRevenue / metrics.totalRevenue) * 100;
      generatedInsights.push({
        severity: 'positive',
        finding: `${anonymousPct.toFixed(1)}% of revenue ($${metrics.anonymousRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}) comes from ${metrics.anonymousCount} anonymous donors.`,
        action: 'This giving cannot be cultivated through traditional stewardship—these donors give despite no relationship-building.',
        priority: 3
      });
    }

    // Sort by priority and limit to 5
    return generatedInsights
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5);
  }, [layer1, layer2, metrics]);

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
      {/* Key Insights Section */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Key Findings & Recommendations</h3>
            <p className="text-sm text-slate-600 mt-1">Auto-generated insights based on your donor data</p>
          </div>

          <div className="space-y-3">
            {insights.map((insight, index) => {
              const severityConfig = {
                critical: {
                  bgColor: 'bg-red-50',
                  borderColor: 'border-red-200',
                  dotColor: 'bg-red-500',
                  textColor: 'text-red-900',
                  labelColor: 'text-red-700'
                },
                warning: {
                  bgColor: 'bg-amber-50',
                  borderColor: 'border-amber-200',
                  dotColor: 'bg-amber-500',
                  textColor: 'text-amber-900',
                  labelColor: 'text-amber-700'
                },
                positive: {
                  bgColor: 'bg-emerald-50',
                  borderColor: 'border-emerald-200',
                  dotColor: 'bg-emerald-500',
                  textColor: 'text-emerald-900',
                  labelColor: 'text-emerald-700'
                }
              };

              const config = severityConfig[insight.severity];

              return (
                <div
                  key={index}
                  className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 ${config.dotColor} rounded-full mt-2 flex-shrink-0`}></div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${config.textColor} mb-1`}>
                        {insight.finding}
                      </p>
                      <p className={`text-sm ${config.labelColor}`}>
                        <span className="font-semibold">→ </span>
                        {insight.action}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
