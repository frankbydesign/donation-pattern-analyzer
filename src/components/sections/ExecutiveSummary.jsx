import React, { useMemo } from 'react';
import useDataStore from '../../store/dataStore';
import { ChartCard, BarChart, DoughnutChart } from '../charts';
import { colors } from '../../config/chartDefaults';
import { FilterStatus } from '../filters';

/**
 * ExecutiveSummary - Dashboard section displaying key metrics and overview charts
 * Shows total donors, revenue, average gift size, segment distribution, and revenue trends
 */
const ExecutiveSummary = () => {
  const {
    layer1,
    layer2,
    isLoading,
    getFilteredDonors,
    getAllDonors,
    filters,
    openDrillDownPanel,
    getDonorsByLapseRisk,
    getTopDonorsByValue,
    getDateRangeLabel
  } = useDataStore();

  // Calculate metrics for both filtered and all-time data
  const metrics = useMemo(() => {
    if (!layer1 || !layer2) {
      return null;
    }

    const filteredDonors = getFilteredDonors();
    const allDonors = getAllDonors();

    const isFiltered = filters.dateRange !== null;

    // Calculate filtered metrics
    const totalDonors = filteredDonors.length;
    const totalRevenue = filteredDonors.reduce((sum, donor) => {
      return sum + (donor.gifts?.reduce((giftSum, gift) => giftSum + gift.amount, 0) || 0);
    }, 0);
    const totalGifts = filteredDonors.reduce((sum, donor) => sum + (donor.gifts?.length || 0), 0);
    const avgGiftSize = totalGifts > 0 ? totalRevenue / totalGifts : 0;

    // Calculate all-time metrics for comparison
    const allTimeDonors = allDonors.length;
    const allTimeRevenue = layer2.executive_summary?.key_metrics?.total_revenue || 0;
    const allTimeAvgGift = layer2.executive_summary?.key_metrics?.avg_gift_size || 0;

    // Calculate anonymous donor statistics (from filtered data)
    const anonymousDonors = filteredDonors.filter(donor => donor.is_anonymous === true);
    const anonymousRevenue = anonymousDonors.reduce((sum, donor) => {
      return sum + (donor.gifts?.reduce((giftSum, gift) => giftSum + gift.amount, 0) || 0);
    }, 0);
    const anonymousCount = anonymousDonors.length;

    // Calculate contactable donors (excluding anonymous)
    const contactableDonors = filteredDonors.filter(donor => donor.is_anonymous !== true);
    const contactableCount = contactableDonors.length;

    return {
      totalDonors,
      totalRevenue,
      avgGiftSize,
      anonymousRevenue,
      anonymousCount,
      contactableCount,
      allTimeDonors,
      allTimeRevenue,
      allTimeAvgGift,
      isFiltered
    };
  }, [layer1, layer2, getFilteredDonors, getAllDonors, filters]);

  // Helper function to determine filter type and calculate YoY comparison
  const calculateYoYComparison = useMemo(() => {
    if (!filters.dateRange) {
      // All Time: Compare most recent complete calendar year vs prior year
      const allDonors = getAllDonors();
      const currentYear = new Date().getFullYear();
      const lastCompleteYear = currentYear - 1;
      const priorYear = lastCompleteYear - 1;

      const getYearRevenue = (year) => {
        return allDonors.reduce((sum, donor) => {
          const yearGifts = donor.gifts?.filter(gift => {
            const giftYear = new Date(gift.date).getFullYear();
            return giftYear === year;
          }) || [];
          return sum + yearGifts.reduce((giftSum, gift) => giftSum + gift.amount, 0);
        }, 0);
      };

      const lastYearRevenue = getYearRevenue(lastCompleteYear);
      const priorYearRevenue = getYearRevenue(priorYear);

      return {
        type: 'all_time',
        currentRevenue: lastYearRevenue,
        priorRevenue: priorYearRevenue,
        currentLabel: lastCompleteYear.toString(),
        priorLabel: priorYear.toString(),
        label: 'year-over-year'
      };
    }

    const { start, end } = filters.dateRange;
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Check if it's a calendar year (e.g., 2024-01-01 to 2024-12-31)
    if (start.match(/^\d{4}-01-01$/) && end.match(/^\d{4}-12-31$/)) {
      const currentYear = parseInt(start.substring(0, 4));
      const priorYear = currentYear - 1;

      const allDonors = getAllDonors();
      const getYearRevenue = (year) => {
        return allDonors.reduce((sum, donor) => {
          const yearGifts = donor.gifts?.filter(gift => {
            const giftYear = new Date(gift.date).getFullYear();
            return giftYear === year;
          }) || [];
          return sum + yearGifts.reduce((giftSum, gift) => giftSum + gift.amount, 0);
        }, 0);
      };

      return {
        type: 'calendar_year',
        currentRevenue: getYearRevenue(currentYear),
        priorRevenue: getYearRevenue(priorYear),
        currentLabel: currentYear.toString(),
        priorLabel: priorYear.toString(),
        label: 'year-over-year'
      };
    }

    // Rolling period: Calculate equivalent prior period
    const periodDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    const priorStartDate = new Date(startDate);
    priorStartDate.setDate(priorStartDate.getDate() - periodDays - 1);
    const priorEndDate = new Date(endDate);
    priorEndDate.setDate(priorEndDate.getDate() - periodDays - 1);

    const allDonors = getAllDonors();
    const getPeriodRevenue = (rangeStart, rangeEnd) => {
      return allDonors.reduce((sum, donor) => {
        const periodGifts = donor.gifts?.filter(gift => {
          const giftDate = new Date(gift.date);
          return giftDate >= rangeStart && giftDate <= rangeEnd;
        }) || [];
        return sum + periodGifts.reduce((giftSum, gift) => giftSum + gift.amount, 0);
      }, 0);
    };

    const currentRevenue = getPeriodRevenue(startDate, endDate);
    const priorRevenue = getPeriodRevenue(priorStartDate, priorEndDate);

    const monthsDiff = Math.round(periodDays / 30);
    const periodLabel = monthsDiff >= 12 ? `${monthsDiff}-month period` : 'selected period';

    return {
      type: 'rolling',
      currentRevenue,
      priorRevenue,
      currentLabel: `${start} to ${end}`,
      priorLabel: `${priorStartDate.toISOString().split('T')[0]} to ${priorEndDate.toISOString().split('T')[0]}`,
      label: `vs. prior ${periodLabel}`
    };
  }, [filters, getAllDonors]);

  // Generate actionable insights based on data
  const insights = useMemo(() => {
    if (!layer1 || !layer2 || !metrics) {
      return [];
    }

    const generatedInsights = [];
    const filteredDonors = getFilteredDonors();

    // Calculate retention rate: donors from prior period who also gave in current period
    // This is the TRUE retention calculation (prior -> current, not just "active")
    let retentionRate = null;
    let retentionDetails = null;
    let allTimeRetention = null;

    const calculateRetentionForPeriod = (currentStart, currentEnd) => {
      const allDonors = getAllDonors();
      const currentStartDate = new Date(currentStart);
      const currentEndDate = new Date(currentEnd);

      // Calculate prior period (same length, immediately before current period)
      const periodDays = Math.round((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24));
      const priorEndDate = new Date(currentStartDate);
      priorEndDate.setDate(priorEndDate.getDate() - 1);
      const priorStartDate = new Date(priorEndDate);
      priorStartDate.setDate(priorStartDate.getDate() - periodDays);

      // Get contactable donors (exclude anonymous)
      const contactableDonors = allDonors.filter(donor => donor.is_anonymous !== true);

      // Find donors who gave in prior period
      const priorDonors = new Set();
      contactableDonors.forEach(donor => {
        const gaveInPrior = donor.gifts?.some(gift => {
          const giftDate = new Date(gift.date);
          return giftDate >= priorStartDate && giftDate <= priorEndDate;
        });
        if (gaveInPrior) {
          priorDonors.add(donor.donor_id);
        }
      });

      // Find donors who gave in current period
      const currentDonors = new Set();
      contactableDonors.forEach(donor => {
        const gaveInCurrent = donor.gifts?.some(gift => {
          const giftDate = new Date(gift.date);
          return giftDate >= currentStartDate && giftDate <= currentEndDate;
        });
        if (gaveInCurrent) {
          currentDonors.add(donor.donor_id);
        }
      });

      // Find donors who gave in BOTH periods (retained donors)
      const retainedDonors = [...priorDonors].filter(donorId => currentDonors.has(donorId));

      // Calculate retention rate
      const priorCount = priorDonors.size;
      const retainedCount = retainedDonors.length;
      const rate = priorCount > 0 ? (retainedCount / priorCount) * 100 : null;

      return {
        rate,
        retainedCount,
        priorCount,
        priorStart: priorStartDate.toISOString().split('T')[0],
        priorEnd: priorEndDate.toISOString().split('T')[0]
      };
    };

    // Calculate retention based on current filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      const result = calculateRetentionForPeriod(start, end);
      retentionRate = result.rate;
      retentionDetails = result;
    } else {
      // All Time: Calculate retention for most recent complete year vs prior year
      const currentYear = new Date().getFullYear();
      const lastCompleteYear = currentYear - 1;
      const currentStart = `${lastCompleteYear}-01-01`;
      const currentEnd = `${lastCompleteYear}-12-31`;
      const result = calculateRetentionForPeriod(currentStart, currentEnd);
      retentionRate = result.rate;
      retentionDetails = result;
      allTimeRetention = retentionRate; // For "All Time" mode, this is the retention
    }

    // Sanity check: If retention exceeds 95%, flag as potentially erroneous
    const isRetentionSuspicious = retentionRate !== null && retentionRate > 95;

    // Calculate top 10 donor concentration from filtered data
    const sortedDonors = [...filteredDonors].sort((a, b) => {
      const aTotal = a.gifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0;
      const bTotal = b.gifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0;
      return bTotal - aTotal;
    });
    const top10Revenue = sortedDonors.slice(0, 10).reduce((sum, donor) => {
      return sum + (donor.gifts?.reduce((giftSum, gift) => giftSum + gift.amount, 0) || 0);
    }, 0);
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
    const lapseRiskPct = metrics.contactableCount > 0 ? (highRiskCount / metrics.contactableCount) * 100 : 0;

    // Calculate revenue by month/year from filtered data
    const revenueByMonth = {};
    filteredDonors.forEach(donor => {
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

    // Calculate YoY revenue growth using the appropriate comparison
    const yoyComparison = calculateYoYComparison;
    let yoyGrowth = 0;
    let yoyLabel = '';
    let hasValidYoY = false;

    if (yoyComparison.priorRevenue > 0) {
      yoyGrowth = ((yoyComparison.currentRevenue - yoyComparison.priorRevenue) / yoyComparison.priorRevenue) * 100;
      yoyLabel = yoyComparison.label;

      // Sanity check: If percentage exceeds ±500%, flag as data anomaly
      hasValidYoY = Math.abs(yoyGrowth) <= 500;
    }

    // RED (Critical) Insights
    // Only show retention insights if we have valid data and it's not suspiciously high
    if (retentionRate !== null && !isRetentionSuspicious) {
      const retentionDisplay = `${retentionDetails.retainedCount} of ${retentionDetails.priorCount} donors retained (${retentionRate.toFixed(1)}%)`;

      if (retentionRate < 35) {
        generatedInsights.push({
          severity: 'critical',
          finding: `Retention rate: ${retentionDisplay} is critically low (sector benchmark: 40-45%).`,
          action: 'Urgent: Implement thank-you calls within 48 hours of first gift, launch a monthly giving program, and send personalized impact updates to recent donors.',
          priority: 1
        });
      }
    } else if (isRetentionSuspicious) {
      // Flag suspicious retention rates instead of displaying them
      generatedInsights.push({
        severity: 'warning',
        finding: `Retention calculation shows unusually high rate (>95%) - possible data quality issue.`,
        action: 'Review donor data for the current and prior periods to ensure completeness and accuracy.',
        priority: 2
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

    if (lapseRiskPct > 40) {
      generatedInsights.push({
        severity: 'critical',
        finding: `${highRiskCount} donors (${lapseRiskPct.toFixed(1)}% of contactable base) at high lapse risk.`,
        action: 'Critical: These donors gave consistently before but have gone quiet. Launch immediate personalized reactivation campaign—phone calls, not email.',
        priority: 1
      });
    }

    // YELLOW (Warning) Insights
    if (retentionRate !== null && !isRetentionSuspicious && retentionRate >= 35 && retentionRate < 45) {
      const retentionDisplay = `${retentionDetails.retainedCount} of ${retentionDetails.priorCount} donors retained (${retentionRate.toFixed(1)}%)`;
      generatedInsights.push({
        severity: 'warning',
        finding: `Retention rate: ${retentionDisplay} is below sector benchmark (40-45%).`,
        action: 'Focus on repeat donation strategies: thank-you calls, monthly giving program promotion, and personalized impact updates.',
        priority: 2
      });
    }

    if (concentrationPct > 30 && concentrationPct <= 50) {
      generatedInsights.push({
        severity: 'warning',
        finding: `Top 10 donors account for ${concentrationPct.toFixed(1)}% of total revenue.`,
        action: 'Consider diversifying your donor base by cultivating mid-level donors ($500-$1,000) to reduce concentration risk.',
        priority: 2
      });
    }

    if (lapseRiskPct > 25 && lapseRiskPct <= 40) {
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
    if (retentionRate !== null && !isRetentionSuspicious && retentionRate >= 45 && retentionRate <= 70) {
      const retentionDisplay = `${retentionDetails.retainedCount} of ${retentionDetails.priorCount} donors retained (${retentionRate.toFixed(1)}%)`;
      generatedInsights.push({
        severity: 'positive',
        finding: `Retention rate: ${retentionDisplay} exceeds sector benchmark (40-45%).`,
        action: 'Strong donor retention! Continue current stewardship practices and document what\'s working for future scaling.',
        priority: 3
      });
    }

    if (hasValidYoY && yoyGrowth > 0) {
      generatedInsights.push({
        severity: 'positive',
        finding: `Revenue grew ${yoyGrowth.toFixed(1)}% ${yoyLabel} (${yoyComparison.currentLabel} vs. ${yoyComparison.priorLabel}).`,
        action: 'Continue monitoring trends and donor engagement strategies that are working.',
        priority: 3
      });
    }

    // YELLOW (Warning) - Significant YoY Decline
    if (hasValidYoY && yoyGrowth < -10) {
      generatedInsights.push({
        severity: 'warning',
        finding: `Revenue declined ${Math.abs(yoyGrowth).toFixed(1)}% ${yoyLabel} (${yoyComparison.currentLabel} vs. ${yoyComparison.priorLabel}).`,
        action: 'Investigate causes of revenue decline. Review donor retention rates and major gift patterns from the prior period.',
        priority: 2
      });
    }

    // Handle insufficient data
    if (!hasValidYoY && yoyComparison.priorRevenue === 0) {
      // Don't show an insight - just skip it
    } else if (!hasValidYoY) {
      // Data anomaly (>500% growth)
      generatedInsights.push({
        severity: 'warning',
        finding: `Data anomaly detected in ${yoyLabel} comparison. Extreme variance suggests data quality issue.`,
        action: 'Review data for the periods being compared to ensure accuracy and completeness.',
        priority: 2
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

    // Sort by priority (no limit - show all relevant insights)
    return generatedInsights
      .sort((a, b) => a.priority - b.priority);
  }, [layer1, layer2, metrics, getFilteredDonors, getAllDonors, calculateYoYComparison]);

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

  // Prepare revenue by year data for bar chart (using filtered data)
  const revenueByYearData = useMemo(() => {
    const filteredDonors = getFilteredDonors();
    if (!filteredDonors || filteredDonors.length === 0) return null;

    // Aggregate gifts by year from filtered donors
    const yearlyRevenue = {};

    filteredDonors.forEach(donor => {
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
  }, [filters, getFilteredDonors]);

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

  if (!metrics || !segmentChartData) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <p className="text-amber-800">Unable to load executive summary data.</p>
      </div>
    );
  }

  // Handle empty filter results
  if (metrics.isFiltered && metrics.totalDonors === 0) {
    return (
      <div className="space-y-6">
        <FilterStatus mode="filtered" />
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-12">
          <div className="text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Donation Data in Selected Period</h3>
            <p className="text-slate-600 mb-4">
              No donors made gifts during the selected time range.
            </p>
            <p className="text-sm text-slate-500">
              Try expanding the date range or resetting to "All Time" to view your donor data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle clicking on high-risk donors
  const handleHighRiskClick = () => {
    const highRiskDonors = getDonorsByLapseRisk('high');
    const mediumRiskDonors = getDonorsByLapseRisk('medium');
    const allAtRiskDonors = [...highRiskDonors, ...mediumRiskDonors];
    const dateContext = filters.dateRange ? ` (${getDateRangeLabel()})` : '';
    openDrillDownPanel({
      type: 'lapseRisk',
      filter: 'high-medium',
      title: `At-Risk Donors${dateContext}`,
      donors: allAtRiskDonors
    });
  };

  // Handle clicking on top donors
  const handleTopDonorsClick = () => {
    const topDonors = getTopDonorsByValue(10);
    const dateContext = filters.dateRange ? ` (${getDateRangeLabel()})` : '';
    openDrillDownPanel({
      type: 'topDonors',
      filter: 'top-10',
      title: `Top 10 Donors${dateContext}`,
      donors: topDonors
    });
  };

  // Make insight text clickable
  const makeInsightClickable = (text, finding) => {
    // Check for high-risk donor count pattern
    const highRiskMatch = text.match(/(\d+)\s+donors.*elevated lapse risk/);
    if (highRiskMatch) {
      const count = highRiskMatch[1];
      return text.replace(
        count,
        `<button class="text-indigo-600 hover:text-indigo-800 underline font-semibold cursor-pointer" data-action="high-risk">${count}</button>`
      );
    }

    // Check for top donors pattern
    const topDonorsMatch = text.match(/Top\s+(\d+)\s+donors/);
    if (topDonorsMatch) {
      return text.replace(
        /Top\s+\d+\s+donors/,
        `<button class="text-indigo-600 hover:text-indigo-800 underline font-semibold cursor-pointer" data-action="top-donors">Top 10 donors</button>`
      );
    }

    return text;
  };

  return (
    <div className="space-y-6">
      {/* Filter Status */}
      <FilterStatus mode="filtered" context={metrics.isFiltered ? `Showing ${metrics.totalDonors} of ${metrics.allTimeDonors} donors based on selected period` : null} />

      {/* Key Insights Section */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Key Findings & Recommendations</h3>
            <p className="text-sm text-slate-600 mt-1">Auto-generated insights based on your donor data</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  onClick={(e) => {
                    const action = e.target.getAttribute('data-action');
                    if (action === 'high-risk') {
                      handleHighRiskClick();
                    } else if (action === 'top-donors') {
                      handleTopDonorsClick();
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 ${config.dotColor} rounded-full mt-2 flex-shrink-0`}></div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${config.textColor} mb-1`}
                        dangerouslySetInnerHTML={{ __html: makeInsightClickable(insight.finding, insight) }}
                      />
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
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">Total Donors</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {metrics.totalDonors.toLocaleString()}
              </p>
              {metrics.isFiltered && metrics.allTimeDonors !== metrics.totalDonors && (
                <p className="text-xs text-slate-500 mt-1">
                  vs. {metrics.allTimeDonors.toLocaleString()} all-time
                </p>
              )}
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
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                ${metrics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              {metrics.isFiltered && metrics.allTimeRevenue > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {((metrics.totalRevenue / metrics.allTimeRevenue) * 100).toFixed(1)}% of all-time
                </p>
              )}
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
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">Average Gift Size</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                ${metrics.avgGiftSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              {metrics.isFiltered && metrics.allTimeAvgGift > 0 && Math.abs(metrics.avgGiftSize - metrics.allTimeAvgGift) > 1 && (
                <p className="text-xs text-slate-500 mt-1">
                  vs. ${metrics.allTimeAvgGift.toLocaleString(undefined, { maximumFractionDigits: 2 })} all-time
                </p>
              )}
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
          {revenueByYearData ? (
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
          ) : (
            <div className="flex items-center justify-center h-[280px] text-slate-400">
              <p>No revenue data available</p>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
