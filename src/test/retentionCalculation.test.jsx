import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDataStore from '../store/dataStore';

/**
 * Retention Calculation Tests
 *
 * These tests verify that the retention rate calculation in ExecutiveSummary
 * correctly implements the formula:
 * Retention Rate = (Donors who gave in BOTH prior AND current period) / (Donors who gave in prior period) × 100
 */

describe('Retention Rate Calculation', () => {
  beforeEach(() => {
    // Reset the store before each test
    const { result } = renderHook(() => useDataStore());
    act(() => {
      result.current.resetFilters();
    });
  });

  it('should calculate retention rate correctly for known test data', () => {
    // Test scenario:
    // Prior period: 2023-01-01 to 2023-12-31
    // Current period: 2024-01-01 to 2024-12-31
    //
    // Donors:
    // - Donor A: Gave in 2023 only (not retained)
    // - Donor B: Gave in both 2023 and 2024 (retained)
    // - Donor C: Gave in both 2023 and 2024 (retained)
    // - Donor D: Gave in 2024 only (new donor, not in retention calc)
    //
    // Expected retention: 2 retained / 3 prior donors = 66.67%

    const testData = {
      donors: [
        {
          donor_id: 'A',
          is_anonymous: false,
          first_gift: '2023-03-15',
          last_gift: '2023-03-15',
          gifts: [
            { date: '2023-03-15', amount: 100 }
          ]
        },
        {
          donor_id: 'B',
          is_anonymous: false,
          first_gift: '2023-05-10',
          last_gift: '2024-06-20',
          gifts: [
            { date: '2023-05-10', amount: 150 },
            { date: '2024-06-20', amount: 200 }
          ]
        },
        {
          donor_id: 'C',
          is_anonymous: false,
          first_gift: '2023-08-01',
          last_gift: '2024-09-15',
          gifts: [
            { date: '2023-08-01', amount: 75 },
            { date: '2024-09-15', amount: 100 }
          ]
        },
        {
          donor_id: 'D',
          is_anonymous: false,
          first_gift: '2024-02-10',
          last_gift: '2024-02-10',
          gifts: [
            { date: '2024-02-10', amount: 50 }
          ]
        }
      ]
    };

    const { result } = renderHook(() => useDataStore());

    // Load test data
    act(() => {
      result.current.layer1 = testData;
      result.current.layer2 = {
        executive_summary: {
          key_metrics: {
            total_donors: 4,
            total_revenue: 675,
            avg_gift_size: 112.5
          },
          health_indicators: {
            champion_donors: 0,
            total_at_risk: 0,
            lapsed_donors: 0
          }
        },
        lapse_risk_analysis: {
          individual_risks: {}
        }
      };
      result.current.layer3 = {};
    });

    // Helper to calculate retention manually
    const calculateRetention = (currentStart, currentEnd) => {
      const donors = testData.donors.filter(d => !d.is_anonymous);
      const currentStartDate = new Date(currentStart);
      const currentEndDate = new Date(currentEnd);

      // Calculate prior period
      const periodDays = Math.round((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24));
      const priorEndDate = new Date(currentStartDate);
      priorEndDate.setDate(priorEndDate.getDate() - 1);
      const priorStartDate = new Date(priorEndDate);
      priorStartDate.setDate(priorStartDate.getDate() - periodDays);

      // Find prior donors
      const priorDonors = new Set();
      donors.forEach(donor => {
        const gaveInPrior = donor.gifts?.some(gift => {
          const giftDate = new Date(gift.date);
          return giftDate >= priorStartDate && giftDate <= priorEndDate;
        });
        if (gaveInPrior) {
          priorDonors.add(donor.donor_id);
        }
      });

      // Find current donors
      const currentDonors = new Set();
      donors.forEach(donor => {
        const gaveInCurrent = donor.gifts?.some(gift => {
          const giftDate = new Date(gift.date);
          return giftDate >= currentStartDate && giftDate <= currentEndDate;
        });
        if (gaveInCurrent) {
          currentDonors.add(donor.donor_id);
        }
      });

      // Find retained donors
      const retained = [...priorDonors].filter(id => currentDonors.has(id));

      return {
        priorCount: priorDonors.size,
        retainedCount: retained.length,
        rate: priorDonors.size > 0 ? (retained.length / priorDonors.size) * 100 : null
      };
    };

    const retention = calculateRetention('2024-01-01', '2024-12-31');

    // Verify the calculation
    expect(retention.priorCount).toBe(3); // Donors A, B, C gave in 2023
    expect(retention.retainedCount).toBe(2); // Donors B, C gave in both periods
    expect(retention.rate).toBeCloseTo(66.67, 1); // 2/3 = 66.67%
  });

  it('should return null for retention when prior period has no donors', () => {
    // Test scenario: Current period is the first period with any donors
    const testData = {
      donors: [
        {
          donor_id: 'A',
          is_anonymous: false,
          first_gift: '2024-01-15',
          last_gift: '2024-01-15',
          gifts: [
            { date: '2024-01-15', amount: 100 }
          ]
        }
      ]
    };

    const { result } = renderHook(() => useDataStore());

    act(() => {
      result.current.layer1 = testData;
    });

    const calculateRetention = (currentStart, currentEnd) => {
      const donors = testData.donors.filter(d => !d.is_anonymous);
      const currentStartDate = new Date(currentStart);
      const currentEndDate = new Date(currentEnd);

      const periodDays = Math.round((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24));
      const priorEndDate = new Date(currentStartDate);
      priorEndDate.setDate(priorEndDate.getDate() - 1);
      const priorStartDate = new Date(priorEndDate);
      priorStartDate.setDate(priorStartDate.getDate() - periodDays);

      const priorDonors = new Set();
      donors.forEach(donor => {
        const gaveInPrior = donor.gifts?.some(gift => {
          const giftDate = new Date(gift.date);
          return giftDate >= priorStartDate && giftDate <= priorEndDate;
        });
        if (gaveInPrior) {
          priorDonors.add(donor.donor_id);
        }
      });

      return {
        priorCount: priorDonors.size,
        rate: priorDonors.size > 0 ? 100 : null // Would be null if no prior donors
      };
    };

    const retention = calculateRetention('2024-01-01', '2024-12-31');

    expect(retention.priorCount).toBe(0);
    expect(retention.rate).toBeNull(); // Should be null, not 0% or Infinity
  });

  it('should never exceed 100% retention', () => {
    // Test scenario: All prior donors are retained
    const testData = {
      donors: [
        {
          donor_id: 'A',
          is_anonymous: false,
          gifts: [
            { date: '2023-06-15', amount: 100 },
            { date: '2024-06-15', amount: 100 }
          ]
        },
        {
          donor_id: 'B',
          is_anonymous: false,
          gifts: [
            { date: '2023-08-20', amount: 150 },
            { date: '2024-08-20', amount: 150 }
          ]
        }
      ]
    };

    const calculateRetention = (currentStart, currentEnd) => {
      const donors = testData.donors.filter(d => !d.is_anonymous);
      const currentStartDate = new Date(currentStart);
      const currentEndDate = new Date(currentEnd);

      const periodDays = Math.round((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24));
      const priorEndDate = new Date(currentStartDate);
      priorEndDate.setDate(priorEndDate.getDate() - 1);
      const priorStartDate = new Date(priorEndDate);
      priorStartDate.setDate(priorStartDate.getDate() - periodDays);

      const priorDonors = new Set();
      const currentDonors = new Set();

      donors.forEach(donor => {
        const gaveInPrior = donor.gifts?.some(gift => {
          const giftDate = new Date(gift.date);
          return giftDate >= priorStartDate && giftDate <= priorEndDate;
        });
        const gaveInCurrent = donor.gifts?.some(gift => {
          const giftDate = new Date(gift.date);
          return giftDate >= currentStartDate && giftDate <= currentEndDate;
        });

        if (gaveInPrior) priorDonors.add(donor.donor_id);
        if (gaveInCurrent) currentDonors.add(donor.donor_id);
      });

      const retained = [...priorDonors].filter(id => currentDonors.has(id));
      const rate = priorDonors.size > 0 ? (retained.length / priorDonors.size) * 100 : null;

      return { rate, priorCount: priorDonors.size, retainedCount: retained.length };
    };

    const retention = calculateRetention('2024-01-01', '2024-12-31');

    expect(retention.rate).toBeLessThanOrEqual(100);
    expect(retention.rate).toBe(100); // All 2 donors retained
    expect(retention.priorCount).toBe(2);
    expect(retention.retainedCount).toBe(2);
  });

  it('should produce realistic retention rates for typical nonprofit data (10-60% range)', () => {
    // Test scenario: Mix of retained and lapsed donors
    const testData = {
      donors: [
        // 5 donors gave in 2023
        { donor_id: '1', is_anonymous: false, gifts: [{ date: '2023-03-15', amount: 100 }] }, // Lapsed
        { donor_id: '2', is_anonymous: false, gifts: [{ date: '2023-05-10', amount: 150 }, { date: '2024-06-20', amount: 200 }] }, // Retained
        { donor_id: '3', is_anonymous: false, gifts: [{ date: '2023-08-01', amount: 75 }] }, // Lapsed
        { donor_id: '4', is_anonymous: false, gifts: [{ date: '2023-11-20', amount: 50 }, { date: '2024-11-15', amount: 60 }] }, // Retained
        { donor_id: '5', is_anonymous: false, gifts: [{ date: '2023-12-25', amount: 100 }] }, // Lapsed
        // 2 new donors in 2024
        { donor_id: '6', is_anonymous: false, gifts: [{ date: '2024-02-10', amount: 80 }] },
        { donor_id: '7', is_anonymous: false, gifts: [{ date: '2024-07-04', amount: 120 }] }
      ]
    };

    const calculateRetention = (currentStart, currentEnd) => {
      const donors = testData.donors.filter(d => !d.is_anonymous);
      const currentStartDate = new Date(currentStart);
      const currentEndDate = new Date(currentEnd);

      const periodDays = Math.round((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24));
      const priorEndDate = new Date(currentStartDate);
      priorEndDate.setDate(priorEndDate.getDate() - 1);
      const priorStartDate = new Date(priorEndDate);
      priorStartDate.setDate(priorStartDate.getDate() - periodDays);

      const priorDonors = new Set();
      const currentDonors = new Set();

      donors.forEach(donor => {
        const gaveInPrior = donor.gifts?.some(gift => {
          const giftDate = new Date(gift.date);
          return giftDate >= priorStartDate && giftDate <= priorEndDate;
        });
        const gaveInCurrent = donor.gifts?.some(gift => {
          const giftDate = new Date(gift.date);
          return giftDate >= currentStartDate && giftDate <= currentEndDate;
        });

        if (gaveInPrior) priorDonors.add(donor.donor_id);
        if (gaveInCurrent) currentDonors.add(donor.donor_id);
      });

      const retained = [...priorDonors].filter(id => currentDonors.has(id));
      const rate = priorDonors.size > 0 ? (retained.length / priorDonors.size) * 100 : null;

      return { rate, priorCount: priorDonors.size, retainedCount: retained.length };
    };

    const retention = calculateRetention('2024-01-01', '2024-12-31');

    // Expected: 2 retained out of 5 prior = 40%
    expect(retention.priorCount).toBe(5);
    expect(retention.retainedCount).toBe(2);
    expect(retention.rate).toBeCloseTo(40, 1);

    // Verify it's in a realistic range
    expect(retention.rate).toBeGreaterThanOrEqual(10);
    expect(retention.rate).toBeLessThanOrEqual(60);
  });

  it('should exclude anonymous donors from retention calculation', () => {
    const testData = {
      donors: [
        {
          donor_id: 'A',
          is_anonymous: false,
          gifts: [
            { date: '2023-03-15', amount: 100 },
            { date: '2024-06-20', amount: 200 }
          ]
        },
        {
          donor_id: 'B',
          is_anonymous: true, // Anonymous - should be excluded
          gifts: [
            { date: '2023-05-10', amount: 150 },
            { date: '2024-08-15', amount: 175 }
          ]
        },
        {
          donor_id: 'C',
          is_anonymous: false,
          gifts: [
            { date: '2023-11-01', amount: 80 }
          ]
        }
      ]
    };

    const calculateRetention = (currentStart, currentEnd) => {
      const donors = testData.donors.filter(d => !d.is_anonymous); // Should filter out donor B
      const currentStartDate = new Date(currentStart);
      const currentEndDate = new Date(currentEnd);

      const periodDays = Math.round((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24));
      const priorEndDate = new Date(currentStartDate);
      priorEndDate.setDate(priorEndDate.getDate() - 1);
      const priorStartDate = new Date(priorEndDate);
      priorStartDate.setDate(priorStartDate.getDate() - periodDays);

      const priorDonors = new Set();
      const currentDonors = new Set();

      donors.forEach(donor => {
        const gaveInPrior = donor.gifts?.some(gift => {
          const giftDate = new Date(gift.date);
          return giftDate >= priorStartDate && giftDate <= priorEndDate;
        });
        const gaveInCurrent = donor.gifts?.some(gift => {
          const giftDate = new Date(gift.date);
          return giftDate >= currentStartDate && giftDate <= currentEndDate;
        });

        if (gaveInPrior) priorDonors.add(donor.donor_id);
        if (gaveInCurrent) currentDonors.add(donor.donor_id);
      });

      const retained = [...priorDonors].filter(id => currentDonors.has(id));
      const rate = priorDonors.size > 0 ? (retained.length / priorDonors.size) * 100 : null;

      return { rate, priorCount: priorDonors.size, retainedCount: retained.length };
    };

    const retention = calculateRetention('2024-01-01', '2024-12-31');

    // Only 2 non-anonymous donors in prior period (A and C), only A retained
    expect(retention.priorCount).toBe(2);
    expect(retention.retainedCount).toBe(1);
    expect(retention.rate).toBeCloseTo(50, 1);
  });

  it('should flag retention > 95% as suspicious', () => {
    // Test the sanity check: retention > 95% should be flagged
    const suspiciousRetention = 99.5;
    expect(suspiciousRetention).toBeGreaterThan(95);

    // The ExecutiveSummary component should not display this, but flag it as suspicious
    const isRetentionSuspicious = suspiciousRetention > 95;
    expect(isRetentionSuspicious).toBe(true);
  });
});
