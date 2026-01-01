/**
 * Scenario Utilities - Calculate baseline metrics for What-If Analysis
 * Provides real data-driven baselines instead of hardcoded values
 */

/**
 * Calculate baseline metrics from layer1 donor data
 * @param {Object} layer1Data - The layer1 donor data
 * @param {Object} layer2Data - The layer2 analysis data
 * @param {string} period - The baseline period ('last_year', 'last_two_years', 'all_time')
 * @returns {Object} Baseline metrics for scenario modeling
 */
export function calculateBaselineMetrics(layer1Data, layer2Data, period = 'last_year') {
  if (!layer1Data || !layer1Data.donors) {
    return null;
  }

  // Determine the date range for the baseline period
  const today = new Date();
  const currentYear = today.getFullYear();

  let startDate, endDate, periodLabel;

  switch (period) {
    case 'last_year':
      // Last full calendar year (2025 if we're in 2026)
      startDate = new Date(currentYear - 1, 0, 1); // Jan 1 of last year
      endDate = new Date(currentYear - 1, 11, 31, 23, 59, 59); // Dec 31 of last year
      periodLabel = `${currentYear - 1}`;
      break;

    case 'last_two_years':
      // Last two full calendar years
      startDate = new Date(currentYear - 2, 0, 1);
      endDate = new Date(currentYear - 1, 11, 31, 23, 59, 59);
      periodLabel = `${currentYear - 2}-${currentYear - 1}`;
      break;

    case 'all_time':
      // All available data
      startDate = new Date('2000-01-01'); // Far in the past
      endDate = new Date();
      periodLabel = 'All Time';
      break;

    default:
      startDate = new Date(currentYear - 1, 0, 1);
      endDate = new Date(currentYear - 1, 11, 31, 23, 59, 59);
      periodLabel = `${currentYear - 1}`;
  }

  // Filter contactable donors (non-anonymous)
  const contactableDonors = layer1Data.donors.filter(donor => !donor.is_anonymous);

  // Calculate metrics for the baseline period
  let totalRevenue = 0;
  let totalGifts = 0;
  const donorsInPeriod = new Set();
  const monthlyDonors = new Set();
  const giftsByDonor = new Map();

  contactableDonors.forEach(donor => {
    if (!donor.gifts) return;

    const giftsInPeriod = donor.gifts.filter(gift => {
      const giftDate = new Date(gift.date);
      return giftDate >= startDate && giftDate <= endDate;
    });

    if (giftsInPeriod.length > 0) {
      donorsInPeriod.add(donor.donor_id);
      giftsByDonor.set(donor.donor_id, giftsInPeriod);

      giftsInPeriod.forEach(gift => {
        totalRevenue += gift.amount;
        totalGifts++;
      });

      // Check if donor is a monthly giver (3+ gifts in period with avg ~30 days apart)
      if (giftsInPeriod.length >= 3) {
        const dates = giftsInPeriod.map(g => new Date(g.date)).sort((a, b) => a - b);
        const intervals = [];
        for (let i = 1; i < dates.length; i++) {
          const daysDiff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
          intervals.push(daysDiff);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

        // Consider monthly if average interval is 20-40 days
        if (avgInterval >= 20 && avgInterval <= 40) {
          monthlyDonors.add(donor.donor_id);
        }
      }
    }
  });

  const donorCount = donorsInPeriod.size;
  const monthlyDonorCount = monthlyDonors.size;

  // Calculate average gift and monthly gift amounts
  const avgGift = donorCount > 0 ? totalRevenue / totalGifts : 0;

  // Calculate average monthly gift amount
  let monthlyGiftTotal = 0;
  let monthlyGiftCount = 0;
  monthlyDonors.forEach(donorId => {
    const gifts = giftsByDonor.get(donorId);
    gifts.forEach(gift => {
      monthlyGiftTotal += gift.amount;
      monthlyGiftCount++;
    });
  });
  const avgMonthlyGift = monthlyGiftCount > 0 ? monthlyGiftTotal / monthlyGiftCount : avgGift;

  // Calculate retention metrics
  let currentRetention = 0;
  if (layer2Data?.retention_analysis?.overall_metrics) {
    currentRetention = layer2Data.retention_analysis.overall_metrics.overall_retention_rate || 0;
  }

  // Calculate current recurring percentage
  const currentRecurringPct = donorCount > 0 ? (monthlyDonorCount / donorCount) * 100 : 0;

  // Calculate lapsed donors (donors who gave in previous periods but not in baseline period)
  let lapsedDonorCount = 0;
  if (period === 'last_year') {
    // Count donors who gave before the baseline period but not during it
    const priorStartDate = new Date(startDate);
    priorStartDate.setFullYear(priorStartDate.getFullYear() - 1);

    const donorsInPriorPeriod = new Set();
    contactableDonors.forEach(donor => {
      if (!donor.gifts) return;

      const giftsInPrior = donor.gifts.filter(gift => {
        const giftDate = new Date(gift.date);
        return giftDate >= priorStartDate && giftDate < startDate;
      });

      if (giftsInPrior.length > 0) {
        donorsInPriorPeriod.add(donor.donor_id);

        // Check if they didn't give in the baseline period
        if (!donorsInPeriod.has(donor.donor_id)) {
          lapsedDonorCount++;
        }
      }
    });
  }

  return {
    period: periodLabel,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    totalRevenue: Math.round(totalRevenue),
    donorCount,
    monthlyDonorCount,
    avgGift: Math.round(avgGift * 100) / 100,
    avgMonthlyGift: Math.round(avgMonthlyGift * 100) / 100,
    currentRetention: Math.round(currentRetention * 10) / 10,
    currentRecurringPct: Math.round(currentRecurringPct * 10) / 10,
    lapsedDonorCount,
    totalGifts
  };
}

/**
 * Calculate scenario impact with detailed explanations
 * @param {Object} baseline - Baseline metrics from calculateBaselineMetrics
 * @param {number} targetRetention - Target retention rate (%)
 * @param {number} targetRecurringPct - Target recurring donor percentage (%)
 * @returns {Object} Detailed scenario results with explanations
 */
export function calculateScenarioImpact(baseline, targetRetention, targetRecurringPct) {
  if (!baseline) {
    return null;
  }

  // Retention Impact Calculation
  // Additional retained donors = lapsed donors * (improvement in retention rate / 100)
  const retentionImprovement = targetRetention - baseline.currentRetention;
  const additionalRetainedDonors = Math.round((retentionImprovement / 100) * baseline.lapsedDonorCount);
  const retentionImpact = additionalRetainedDonors * baseline.avgGift;

  // Recurring Giving Impact Calculation
  // Additional recurring donors = current donors * (improvement in recurring % / 100)
  const recurringImprovement = targetRecurringPct - baseline.currentRecurringPct;
  const additionalRecurringDonors = Math.round((recurringImprovement / 100) * baseline.donorCount);
  // Assume monthly donors give 12 times per year
  const recurringImpact = additionalRecurringDonors * baseline.avgMonthlyGift * 12;

  // Total projected revenue
  const projectedRevenue = baseline.totalRevenue + retentionImpact + recurringImpact;

  return {
    baseRevenue: baseline.totalRevenue,
    retentionImpact: Math.round(retentionImpact),
    recurringImpact: Math.round(recurringImpact),
    projectedRevenue: Math.round(projectedRevenue),

    // Detailed explanations
    details: {
      retention: {
        currentRate: baseline.currentRetention,
        targetRate: targetRetention,
        improvement: Math.round(retentionImprovement * 10) / 10,
        additionalDonors: additionalRetainedDonors,
        avgGift: baseline.avgGift,
        lapsedDonors: baseline.lapsedDonorCount
      },
      recurring: {
        currentPct: baseline.currentRecurringPct,
        targetPct: targetRecurringPct,
        improvement: Math.round(recurringImprovement * 10) / 10,
        additionalDonors: additionalRecurringDonors,
        avgMonthlyGift: baseline.avgMonthlyGift,
        currentMonthlyDonors: baseline.monthlyDonorCount,
        totalDonors: baseline.donorCount
      }
    }
  };
}

/**
 * Get available baseline periods
 * @returns {Array} Array of period options
 */
export function getBaselinePeriodOptions() {
  const today = new Date();
  const currentYear = today.getFullYear();

  return [
    {
      value: 'last_year',
      label: `Last Year (${currentYear - 1})`,
      description: `Full calendar year ${currentYear - 1}`
    },
    {
      value: 'last_two_years',
      label: `Last Two Years (${currentYear - 2}-${currentYear - 1})`,
      description: `Combined data from ${currentYear - 2} and ${currentYear - 1}`
    },
    {
      value: 'all_time',
      label: 'All Time',
      description: 'All available historical data'
    }
  ];
}
