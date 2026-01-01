import React, { useMemo } from 'react';
import useDataStore from '../../store/dataStore';
import { ChartCard, BarChart, DoughnutChart } from '../charts';
import { colors } from '../../config/chartDefaults';
import { FilterStatus } from '../filters';

/**
 * DonorHealth - Dashboard section displaying donor health metrics
 * Shows RFM segment distribution, lapse risk breakdown, and key health indicators
 */
const DonorHealth = () => {
  const {
    layer1,
    layer2,
    isLoading,
    getFilteredDonors,
    getAllDonors,
    filters,
    openDrillDownPanel,
    getDonorsBySegment,
    getDonorsByLapseRisk,
    getDateRangeLabel
  } = useDataStore();

  // Calculate RFM segment distribution from individual donor scores
  // Use filtered donors and exclude anonymous donors from RFM segmentation
  const rfmSegmentData = useMemo(() => {
    if (!layer2?.rfm_analysis?.scores) return null;

    const filteredDonors = getFilteredDonors();
    if (!filteredDonors || filteredDonors.length === 0) return null;

    // Build a set of filtered donor IDs (only contactable donors in the filtered set)
    const filteredDonorIds = new Set(
      filteredDonors
        .filter(donor => donor.is_anonymous !== true)
        .map(donor => donor.donor_id)
    );

    // Count donors by RFM segment, only for filtered contactable donors
    const segments = {
      'Champions (555)': 0,
      'Loyal (4-5 range)': 0,
      'Potential (3-4 range)': 0,
      'At Risk (2-3 range)': 0,
      'Lost (1-2 range)': 0,
    };

    Object.entries(layer2.rfm_analysis.scores).forEach(([donorId, score]) => {
      // Only include donors in the filtered set
      if (!filteredDonorIds.has(donorId)) return;

      const total = score.rfm_total || 0;

      if (total === 15) {
        segments['Champions (555)']++;
      } else if (total >= 12) {
        segments['Loyal (4-5 range)']++;
      } else if (total >= 9) {
        segments['Potential (3-4 range)']++;
      } else if (total >= 6) {
        segments['At Risk (2-3 range)']++;
      } else {
        segments['Lost (1-2 range)']++;
      }
    });

    return {
      labels: Object.keys(segments),
      datasets: [{
        label: 'Donors',
        data: Object.values(segments),
        backgroundColor: [
          colors.segments.champions,  // Champions - emerald
          colors.segments.loyal,       // Loyal - blue
          colors.info,                 // Potential - blue
          colors.segments.atRisk,      // At Risk - amber
          colors.segments.lapsed,      // Lost - red
        ],
        borderRadius: 4,
      }],
    };
  }, [layer2, getFilteredDonors]);

  // Prepare lapse risk breakdown data
  // Use filtered donors and exclude anonymous donors from lapse risk analysis
  const lapseRiskData = useMemo(() => {
    if (!layer2?.lapse_risk_analysis?.individual_risks) return null;

    const filteredDonors = getFilteredDonors();
    if (!filteredDonors || filteredDonors.length === 0) return null;

    // Build a set of filtered donor IDs (only contactable donors in the filtered set)
    const filteredDonorIds = new Set(
      filteredDonors
        .filter(donor => donor.is_anonymous !== true)
        .map(donor => donor.donor_id)
    );

    // Recalculate risk distribution for filtered contactable donors only
    const riskCounts = { low: 0, medium: 0, high: 0 };

    Object.entries(layer2.lapse_risk_analysis.individual_risks).forEach(([donorId, riskData]) => {
      // Only include donors in the filtered set
      if (!filteredDonorIds.has(donorId)) return;

      const riskLevel = riskData.risk_level?.toLowerCase();
      if (riskLevel === 'low') riskCounts.low++;
      else if (riskLevel === 'medium') riskCounts.medium++;
      else if (riskLevel === 'high') riskCounts.high++;
    });

    return {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [{
        data: [
          riskCounts.low,
          riskCounts.medium,
          riskCounts.high,
        ],
        backgroundColor: [
          colors.risk.low,      // emerald
          colors.risk.medium,   // amber
          colors.risk.high,     // red
        ],
        borderWidth: 0,
      }],
    };
  }, [layer2, getFilteredDonors]);

  // Calculate key health metrics from filtered data
  // Exclude anonymous donors from relationship-based metrics
  const healthMetrics = useMemo(() => {
    if (!layer2) return null;

    const filteredDonors = getFilteredDonors();
    const allDonors = getAllDonors();
    const isFiltered = filters.dateRange !== null;

    if (!filteredDonors || filteredDonors.length === 0) return null;

    // Filter out anonymous donors for contactable donor counts (from filtered data)
    const contactableDonors = filteredDonors.filter(donor => donor.is_anonymous !== true);
    const totalContactableDonors = contactableDonors.length;

    // All-time contactable donors for comparison
    const allContactableDonors = allDonors.filter(donor => donor.is_anonymous !== true);
    const allTimeContactable = allContactableDonors.length;

    // Count active contactable donors (gave in last year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const activeContactable = contactableDonors.filter(donor => {
      const lastGiftDate = donor.last_gift ? new Date(donor.last_gift) : null;
      return lastGiftDate && lastGiftDate >= oneYearAgo;
    }).length;

    // Build set of filtered contactable donor IDs
    const filteredContactableIds = new Set(contactableDonors.map(d => d.donor_id));

    // Count at-risk donors in the filtered set
    let atRiskCount = 0;
    if (layer2.lapse_risk_analysis?.individual_risks) {
      atRiskCount = Object.entries(layer2.lapse_risk_analysis.individual_risks)
        .filter(([donorId, riskData]) => {
          const isInFilteredSet = filteredContactableIds.has(donorId);
          const isHighRisk = riskData.risk_level?.toLowerCase() === 'high' ||
                            riskData.risk_level?.toLowerCase() === 'medium';
          return isInFilteredSet && isHighRisk;
        })
        .length;
    }

    // Calculate retention rate (active contactable donors / total contactable donors)
    const retentionRate = totalContactableDonors > 0
      ? ((activeContactable / totalContactableDonors) * 100).toFixed(1)
      : 0;

    return {
      retentionRate,
      atRiskCount,
      activeCount: activeContactable,
      totalDonors: totalContactableDonors,
      allTimeContactable,
      isFiltered
    };
  }, [layer2, getFilteredDonors, getAllDonors, filters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading donor health data...</p>
        </div>
      </div>
    );
  }

  if (!healthMetrics) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <p className="text-amber-800">Unable to load donor health data.</p>
      </div>
    );
  }

  // Handle empty filter results
  if (healthMetrics.totalDonors === 0) {
    return (
      <div className="space-y-6">
        <FilterStatus mode="filtered" />
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-12">
          <div className="text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Donor Data in Selected Period</h3>
            <p className="text-slate-600 mb-4">
              No contactable donors made gifts during the selected time range.
            </p>
            <p className="text-sm text-slate-500">
              Try expanding the date range or resetting to "All Time" to view donor health metrics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle RFM segment click
  const handleSegmentClick = (segmentName) => {
    const donors = getDonorsBySegment(segmentName);
    const dateContext = filters.dateRange ? ` (${getDateRangeLabel()})` : '';
    openDrillDownPanel({
      type: 'segment',
      filter: segmentName,
      title: `${segmentName} Donors${dateContext}`,
      donors
    });
  };

  // Handle lapse risk click
  const handleLapseRiskClick = (riskLevel) => {
    const donors = getDonorsByLapseRisk(riskLevel);
    const dateContext = filters.dateRange ? ` (${getDateRangeLabel()})` : '';
    const riskLabel = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1);
    openDrillDownPanel({
      type: 'lapseRisk',
      filter: riskLevel,
      title: `${riskLabel} Risk Donors${dateContext}`,
      donors
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Status */}
      <FilterStatus
        mode="filtered"
        context={healthMetrics.isFiltered
          ? `Showing ${healthMetrics.totalDonors} of ${healthMetrics.allTimeContactable} contactable donors based on selected period`
          : null
        }
      />

      {/* Key Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Retention Rate */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Retention Rate</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {healthMetrics.retentionRate}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {healthMetrics.activeCount.toLocaleString()} active donors
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Donors at Risk */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Donors at Risk</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {healthMetrics.atRiskCount.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {((healthMetrics.atRiskCount / healthMetrics.totalDonors) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Analyzed */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Contactable Donors</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {healthMetrics.totalDonors.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Excludes anonymous donors
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFM Segment Distribution */}
        <div className="space-y-4">
          <ChartCard
            title="RFM Segment Distribution"
            subtitle="Donors grouped by Recency, Frequency, and Monetary scores"
          >
            {rfmSegmentData ? (
              <div className="relative group">
                <BarChart
                  labels={rfmSegmentData.labels}
                  datasets={rfmSegmentData.datasets}
                  height={300}
                  options={{
                    indexAxis: 'y',
                    scales: {
                      x: {
                        ticks: {
                          callback: function(value) {
                            return value.toLocaleString();
                          }
                        }
                      }
                    },
                    onClick: (event, elements) => {
                      if (elements.length > 0) {
                        const index = elements[0].index;
                        const segmentName = rfmSegmentData.labels[index];
                        handleSegmentClick(segmentName);
                      }
                    },
                    onHover: (event, elements) => {
                      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                    }
                  }}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow-lg">
                    Click to view donors
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                <p>No RFM data available</p>
              </div>
            )}
          </ChartCard>

          {/* RFM Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1 text-sm">Understanding RFM Segments</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  RFM scores donors on Recency, Frequency, and Monetary value. Champions (555) are your best—recent, frequent, generous.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lapse Risk Breakdown */}
        <div className="space-y-4">
          <ChartCard
            title="Lapse Risk Analysis"
            subtitle="Distribution of donors by lapse risk level"
          >
            {lapseRiskData ? (
              <div className="relative group">
                <DoughnutChart
                  labels={lapseRiskData.labels}
                  datasets={lapseRiskData.datasets}
                  height={300}
                  options={{
                    onClick: (event, elements) => {
                      if (elements.length > 0) {
                        const index = elements[0].index;
                        const riskLevels = ['low', 'medium', 'high'];
                        const riskLevel = riskLevels[index];
                        handleLapseRiskClick(riskLevel);
                      }
                    },
                    onHover: (event, elements) => {
                      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                    }
                  }}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow-lg">
                    Click to view donors
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                <p>No lapse risk data available</p>
              </div>
            )}
          </ChartCard>

          {/* Lapse Risk Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1 text-sm">Understanding Lapse Risk</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Lapse risk predicts which donors may stop giving based on recency and frequency patterns. High-risk donors gave consistently before but have gone quiet—they're your best reactivation candidates because they already believe in the mission. Focus personal outreach here, not mass email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorHealth;
