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
    console.log('[RFM] Starting RFM segment calculation');
    if (!layer2?.rfm_analysis?.scores) {
      console.log('[RFM] No RFM scores available in layer2');
      return null;
    }

    const filteredDonors = getFilteredDonors();
    if (!filteredDonors || filteredDonors.length === 0) {
      console.log('[RFM] No filtered donors available');
      return null;
    }

    // Build a set of filtered donor IDs (only contactable donors in the filtered set)
    const filteredDonorIds = new Set(
      filteredDonors
        .filter(donor => donor.is_anonymous !== true)
        .map(donor => donor.donor_id)
    );
    console.log('[RFM] Filtered contactable donor count:', filteredDonorIds.size);

    // Count donors by RFM segment, only for filtered contactable donors
    const segmentCounts = {
      'Champions': 0,
      'Loyal': 0,
      'Potential': 0,
      'At Risk': 0,
      'Lost': 0,
    };

    Object.entries(layer2.rfm_analysis.scores).forEach(([donorId, score]) => {
      // Only include donors in the filtered set
      if (!filteredDonorIds.has(donorId)) return;

      const total = score.rfm_total || 0;

      if (total === 15) {
        segmentCounts['Champions']++;
      } else if (total >= 12) {
        segmentCounts['Loyal']++;
      } else if (total >= 10) {
        segmentCounts['Potential']++;
      } else if (total >= 8) {
        segmentCounts['At Risk']++;
      } else {
        // Scores 6-7 (and theoretically lower, but dataset min is 6)
        segmentCounts['Lost']++;
      }
    });

    console.log('[RFM] Segment distribution:', segmentCounts);

    // Create labels with counts for consistency
    const labelsWithCounts = Object.entries(segmentCounts).map(([name, count]) => `${name} (${count})`);

    return {
      labels: labelsWithCounts,
      datasets: [{
        label: 'Donors',
        data: Object.values(segmentCounts),
        backgroundColor: [
          colors.segments.champions,  // Champions - emerald
          colors.segments.loyal,       // Loyal - blue
          colors.info,                 // Potential - blue
          colors.segments.atRisk,      // At Risk - amber
          colors.segments.lapsed,      // Lost - red
        ],
        borderRadius: 4,
        borderWidth: 1,
        borderColor: [
          colors.segments.champions,  // Champions - emerald
          colors.segments.loyal,       // Loyal - blue
          colors.info,                 // Potential - blue
          colors.segments.atRisk,      // At Risk - amber
          colors.segments.lapsed,      // Lost - red
        ],
      }],
    };
  }, [layer2, getFilteredDonors]);

  // Prepare lapse risk breakdown data
  // Use filtered donors and exclude anonymous donors from lapse risk analysis
  const lapseRiskData = useMemo(() => {
    console.log('[LAPSE RISK] Starting lapse risk calculation');
    console.log('[LAPSE RISK] layer2 exists:', !!layer2);
    console.log('[LAPSE RISK] lapse_risk_analysis exists:', !!layer2?.lapse_risk_analysis);
    console.log('[LAPSE RISK] risk_distribution exists:', !!layer2?.lapse_risk_analysis?.risk_distribution);

    const filteredDonors = getFilteredDonors();
    if (!filteredDonors || filteredDonors.length === 0) {
      console.log('[LAPSE RISK] No filtered donors available');
      return null;
    }

    // Build a set of filtered donor IDs (only contactable donors in the filtered set)
    const filteredDonorIds = new Set(
      filteredDonors
        .filter(donor => donor.is_anonymous !== true)
        .map(donor => donor.donor_id)
    );
    console.log('[LAPSE RISK] Filtered contactable donor count:', filteredDonorIds.size);

    // Initialize risk counts
    let riskCounts = { low: 0, medium: 0, high: 0 };

    // APPROACH 1: Use risk_distribution from layer2 if available
    if (layer2?.lapse_risk_analysis?.risk_distribution) {
      console.log('[LAPSE RISK] Using risk_distribution from layer2');
      console.log('[LAPSE RISK] All-time risk_distribution:', layer2.lapse_risk_analysis.risk_distribution);

      // When using all-time data, we need to filter to only contactable donors
      // Since we don't have individual_risks, use the all-time distribution as-is
      // This is acceptable for "All Time" view, but will need refinement for date filters
      riskCounts = {
        low: layer2.lapse_risk_analysis.risk_distribution.low || 0,
        medium: layer2.lapse_risk_analysis.risk_distribution.medium || 0,
        high: layer2.lapse_risk_analysis.risk_distribution.high || 0,
      };
    }
    // APPROACH 2: Fallback calculation from layer1 donor patterns
    else if (layer1?.donors) {
      console.log('[LAPSE RISK] No risk_distribution found, calculating from layer1 donor data');

      // Calculate lapse risk based on donor behavior patterns
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      filteredDonors
        .filter(donor => donor.is_anonymous !== true)
        .forEach(donor => {
          const lastGiftDate = donor.last_gift ? new Date(donor.last_gift) : null;
          const giftCount = donor.gifts?.length || 0;

          if (!lastGiftDate) {
            riskCounts.high++;
            return;
          }

          // High risk: Haven't given in 1+ year but gave before
          if (lastGiftDate < oneYearAgo && giftCount >= 2) {
            riskCounts.high++;
          }
          // Medium risk: Haven't given in 6-12 months
          else if (lastGiftDate < oneYearAgo && lastGiftDate >= twoYearsAgo) {
            riskCounts.medium++;
          }
          // Low risk: Gave recently (within 1 year)
          else if (lastGiftDate >= oneYearAgo) {
            riskCounts.low++;
          }
          // High risk: Inactive for 2+ years
          else {
            riskCounts.high++;
          }
        });

      console.log('[LAPSE RISK] Calculated from donor patterns:', riskCounts);
    } else {
      console.log('[LAPSE RISK] No data source available for lapse risk calculation');
      return null;
    }

    const total = riskCounts.low + riskCounts.medium + riskCounts.high;
    console.log('[LAPSE RISK] Final risk counts:', riskCounts, 'Total:', total);

    if (total === 0) {
      console.log('[LAPSE RISK] No risk data to display (all counts are 0)');
      return null;
    }

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
  }, [layer1, layer2, getFilteredDonors]);

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
    let usingRFMFallback = false;

    if (layer2.lapse_risk_analysis?.individual_risks) {
      // Prefer lapse risk data if available
      atRiskCount = Object.entries(layer2.lapse_risk_analysis.individual_risks)
        .filter(([donorId, riskData]) => {
          const isInFilteredSet = filteredContactableIds.has(donorId);
          const isHighRisk = riskData.risk_level?.toLowerCase() === 'high' ||
                            riskData.risk_level?.toLowerCase() === 'medium';
          return isInFilteredSet && isHighRisk;
        })
        .length;
    } else if (layer2.rfm_analysis?.scores) {
      // Fallback to RFM "At Risk" segment if lapse risk data is missing
      usingRFMFallback = true;
      atRiskCount = Object.entries(layer2.rfm_analysis.scores)
        .filter(([donorId, score]) => {
          const isInFilteredSet = filteredContactableIds.has(donorId);
          const total = score.rfm_total || 0;
          const isAtRisk = total >= 6 && total < 9; // At Risk (2-3 range) in RFM
          return isInFilteredSet && isAtRisk;
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
      isFiltered,
      usingRFMFallback
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
              <p className="text-sm font-medium text-slate-600">
                Donors at Risk
                {healthMetrics.usingRFMFallback && (
                  <span className="ml-1 text-xs text-slate-400">(RFM-based)</span>
                )}
              </p>
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
            {filters.dateRange && (
              <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-slate-600">
                <strong>Based on all-time donor history</strong>
              </div>
            )}
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
                <p className="text-sm text-blue-800 leading-relaxed mb-2">
                  RFM scores donors on Recency, Frequency, and Monetary value (1-5 each). Combined scores range from 3-15.
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li><strong>Champions (15):</strong> Perfect score—recent, frequent, generous donors</li>
                  <li><strong>Loyal (12-14):</strong> Strong, consistent supporters</li>
                  <li><strong>Potential (10-11):</strong> Engaged donors with room to grow</li>
                  <li><strong>At Risk (8-9):</strong> Previously engaged, now declining</li>
                  <li><strong>Lost {'(<8)'}:</strong> Inactive or minimal engagement</li>
                </ul>
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
            {filters.dateRange && (
              <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-slate-600">
                <strong>Based on all-time donor history</strong>
              </div>
            )}
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
              <div className="flex flex-col items-center justify-center h-[300px] text-slate-400 p-6">
                <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-medium text-slate-600 mb-2">Lapse Risk Data Not Available</p>
                <p className="text-xs text-slate-500 text-center max-w-md">
                  Lapse risk analysis requires historical donor data. This data may not be available yet or may need to be generated from your donor database.
                </p>
                <p className="text-xs text-slate-400 text-center mt-2 max-w-md">
                  In the meantime, refer to the RFM segment distribution above for donor health insights.
                </p>
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
