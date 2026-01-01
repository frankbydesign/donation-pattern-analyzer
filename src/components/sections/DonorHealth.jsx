import React, { useMemo } from 'react';
import useDataStore from '../../store/dataStore';
import { ChartCard, BarChart, DoughnutChart } from '../charts';
import { colors } from '../../config/chartDefaults';

/**
 * DonorHealth - Dashboard section displaying donor health metrics
 * Shows RFM segment distribution, lapse risk breakdown, and key health indicators
 */
const DonorHealth = () => {
  const { layer1, layer2, isLoading } = useDataStore();

  // Calculate RFM segment distribution from individual donor scores
  const rfmSegmentData = useMemo(() => {
    if (!layer2?.rfm_analysis?.scores) return null;

    // Count donors by RFM segment
    const segments = {
      'Champions (555)': 0,
      'Loyal (4-5 range)': 0,
      'Potential (3-4 range)': 0,
      'At Risk (2-3 range)': 0,
      'Lost (1-2 range)': 0,
    };

    Object.values(layer2.rfm_analysis.scores).forEach(score => {
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
  }, [layer2]);

  // Prepare lapse risk breakdown data
  const lapseRiskData = useMemo(() => {
    if (!layer2?.lapse_risk_analysis?.risk_distribution) return null;

    const riskDist = layer2.lapse_risk_analysis.risk_distribution;

    return {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [{
        data: [
          riskDist.low || 0,
          riskDist.medium || 0,
          riskDist.high || 0,
        ],
        backgroundColor: [
          colors.risk.low,      // emerald
          colors.risk.medium,   // amber
          colors.risk.high,     // red
        ],
        borderWidth: 0,
      }],
    };
  }, [layer2]);

  // Calculate key health metrics
  const healthMetrics = useMemo(() => {
    if (!layer1 || !layer2) return null;

    const totalDonors = layer2.executive_summary?.key_metrics?.total_donors || 0;
    const atRiskCount = layer2.executive_summary?.health_indicators?.total_at_risk || 0;
    const activeCount = layer1.summary?.status_breakdown?.active || 0;

    // Calculate retention rate (active donors / total donors who have given before)
    const retentionRate = totalDonors > 0 ? ((activeCount / totalDonors) * 100).toFixed(1) : 0;

    return {
      retentionRate,
      atRiskCount,
      activeCount,
      totalDonors,
    };
  }, [layer1, layer2]);

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

  if (!rfmSegmentData || !lapseRiskData || !healthMetrics) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <p className="text-amber-800">Unable to load donor health data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              <p className="text-sm font-medium text-slate-600">Total Donors</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {healthMetrics.totalDonors.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Analyzed in this report
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
        <ChartCard
          title="RFM Segment Distribution"
          subtitle="Donors grouped by Recency, Frequency, and Monetary scores"
        >
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
              }
            }}
          />
        </ChartCard>

        {/* Lapse Risk Breakdown */}
        <ChartCard
          title="Lapse Risk Analysis"
          subtitle="Distribution of donors by lapse risk level"
        >
          <DoughnutChart
            labels={lapseRiskData.labels}
            datasets={lapseRiskData.datasets}
            height={300}
          />
        </ChartCard>
      </div>

      {/* Additional Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Understanding RFM Segments</h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              RFM analysis scores donors based on Recency (how recently they gave),
              Frequency (how often they give), and Monetary value (how much they give).
              Champions (555) are your best donors—recent, frequent, and generous.
              Focus retention efforts on "At Risk" and "Lost" segments to prevent further lapse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorHealth;
