import { create } from 'zustand';

/**
 * Central data store for donor analytics data
 * Manages layer1 (donors), layer2 (insights), layer3 (benchmarks) data
 * and global filters for the application
 */
const useDataStore = create((set, get) => ({
  // Data state
  layer1: null,
  layer2: null,
  layer3: null,

  // Loading state
  isLoading: false,
  error: null,

  // Filter state
  filters: {
    dateRange: null,  // { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
    segment: null,     // e.g., 'champions', 'at-risk', etc.
    status: null       // e.g., 'active', 'lapsing', 'lapsed'
  },

  // Drill-down panel state
  drillDownPanel: {
    isOpen: false,
    type: null,        // 'segment' | 'lapseRisk' | 'cohort' | 'topDonors' | 'newDonors' | 'returningDonors' | 'cohortRetention'
    filter: null,      // the specific filter value (e.g., 'Champions', 'high', 2023)
    title: null,       // display title for the panel
    donors: []         // pre-filtered array of donors
  },

  /**
   * Load all three layers of donor data from JSON files
   * @returns {Promise<void>}
   */
  loadData: async () => {
    console.log('[DATASTORE] loadData called');
    set({ isLoading: true, error: null });

    try {
      // Fetch all three data layers in parallel
      // Use BASE_URL to ensure paths work in both dev and production (GitHub Pages)
      const baseUrl = import.meta.env.BASE_URL;
      console.log('[DATASTORE] BASE_URL:', baseUrl);

      const [layer1Response, layer2Response, layer3Response] = await Promise.all([
        fetch(`${baseUrl}data/donor_data_layer1.json`),
        fetch(`${baseUrl}data/donor_data_layer2.json`),
        fetch(`${baseUrl}data/donor_data_layer3.json`)
      ]);

      console.log('[DATASTORE] Fetch responses:', {
        layer1: layer1Response.ok,
        layer2: layer2Response.ok,
        layer3: layer3Response.ok
      });

      // Check for fetch errors
      if (!layer1Response.ok) throw new Error('Failed to load layer1 data');
      if (!layer2Response.ok) throw new Error('Failed to load layer2 data');
      if (!layer3Response.ok) throw new Error('Failed to load layer3 data');

      // Parse JSON data
      const [layer1Data, layer2Data, layer3Data] = await Promise.all([
        layer1Response.json(),
        layer2Response.json(),
        layer3Response.json()
      ]);

      console.log('[DATASTORE] Data parsed:', {
        layer1Donors: layer1Data?.donors?.length,
        hasLayer2: !!layer2Data,
        hasLayer3: !!layer3Data
      });

      // Update store with loaded data
      set({
        layer1: layer1Data,
        layer2: layer2Data,
        layer3: layer3Data,
        isLoading: false,
        error: null
      });

      console.log('[DATASTORE] Store updated with data');

    } catch (error) {
      console.error('Error loading data:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to load data'
      });
    }
  },

  /**
   * Update filter state
   * @param {Object} newFilters - Partial filter object to merge with existing filters
   */
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  /**
   * Reset all filters to default state
   */
  resetFilters: () => {
    set({
      filters: {
        dateRange: null,
        segment: null,
        status: null
      }
    });
  },

  /**
   * Get filtered donors based on current filter state
   * Also filters each donor's gifts array to only include gifts within the range
   * @returns {Array} Filtered array of donor objects with filtered gifts
   */
  getFilteredDonors: () => {
    console.log('[DATASTORE] getFilteredDonors called');
    const { layer1, filters } = get();

    console.log('[DATASTORE] getFilteredDonors - layer1:', {
      hasLayer1: !!layer1,
      hasDonors: !!layer1?.donors,
      donorCount: layer1?.donors?.length
    });

    if (!layer1?.donors) {
      console.log('[DATASTORE] getFilteredDonors - no donors, returning []');
      return [];
    }

    let filteredDonors = [...layer1.donors];
    console.log('[DATASTORE] getFilteredDonors - initial count:', filteredDonors.length);

    // Apply date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      const startDate = start ? new Date(start) : new Date('1900-01-01');
      const endDate = end ? new Date(end) : new Date('2100-12-31');

      filteredDonors = filteredDonors
        .filter((donor) => {
          // Filter donors who have at least one gift within the date range
          return donor.gifts?.some((gift) => {
            const giftDate = new Date(gift.date);
            return giftDate >= startDate && giftDate <= endDate;
          });
        })
        .map((donor) => ({
          ...donor,
          // Also filter the gifts array to only include gifts within the range
          gifts: donor.gifts?.filter((gift) => {
            const giftDate = new Date(gift.date);
            return giftDate >= startDate && giftDate <= endDate;
          }) || []
        }));
    }

    // Apply status filter (stub for now - will be enhanced when status field is added)
    if (filters.status) {
      // TODO: Filter by donor status when layer2 segmentation is integrated
      // For now, this is a placeholder
    }

    // Apply segment filter (stub for now - will be enhanced when segments are integrated)
    if (filters.segment) {
      // TODO: Filter by segment (e.g., champions, at-risk) when layer2 integration is complete
      // For now, this is a placeholder
    }

    return filteredDonors;
  },

  /**
   * Get all donors without any date filtering (for sections that need full history)
   * @returns {Array} All donor objects
   */
  getAllDonors: () => {
    console.log('[DATASTORE] getAllDonors called');
    const { layer1 } = get();
    const donors = layer1?.donors || [];
    console.log('[DATASTORE] getAllDonors - returning', donors.length, 'donors');
    return donors;
  },

  /**
   * Get flat array of all gifts within the current date range
   * @returns {Array} Filtered array of gift objects
   */
  getFilteredGifts: () => {
    const { layer1, filters } = get();

    if (!layer1?.donors) {
      return [];
    }

    let gifts = [];

    layer1.donors.forEach(donor => {
      if (donor.gifts) {
        donor.gifts.forEach(gift => {
          gifts.push({ ...gift, donor_id: donor.donor_id });
        });
      }
    });

    // Apply date range filter if active
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      const startDate = start ? new Date(start) : new Date('1900-01-01');
      const endDate = end ? new Date(end) : new Date('2100-12-31');

      gifts = gifts.filter(gift => {
        const giftDate = new Date(gift.date);
        return giftDate >= startDate && giftDate <= endDate;
      });
    }

    return gifts;
  },

  /**
   * Get all gifts without any date filtering
   * @returns {Array} All gift objects
   */
  getAllGifts: () => {
    const { layer1 } = get();

    if (!layer1?.donors) {
      return [];
    }

    let gifts = [];
    layer1.donors.forEach(donor => {
      if (donor.gifts) {
        donor.gifts.forEach(gift => {
          gifts.push({ ...gift, donor_id: donor.donor_id });
        });
      }
    });

    return gifts;
  },

  /**
   * Get human-readable label for the current date filter
   * @returns {string} Date range label (e.g., "Jan 2024 - Dec 2024" or "All Time")
   */
  getDateRangeLabel: () => {
    const { filters } = get();

    if (!filters.dateRange) {
      return 'All Time';
    }

    const { start, end } = filters.dateRange;
    const formatDate = (dateStr) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  },

  /**
   * Get date range bounds for highlighting in charts
   * @returns {Object|null} { start: Date, end: Date } or null if no filter active
   */
  getDateRangeBounds: () => {
    const { filters } = get();

    if (!filters.dateRange) {
      return null;
    }

    const { start, end } = filters.dateRange;
    return {
      start: new Date(start),
      end: new Date(end)
    };
  },

  /**
   * Open drill-down panel with filtered donors
   * @param {Object} params - Panel configuration { type, filter, title, donors }
   */
  openDrillDownPanel: ({ type, filter, title, donors }) => {
    set({
      drillDownPanel: {
        isOpen: true,
        type,
        filter,
        title,
        donors
      }
    });
  },

  /**
   * Close drill-down panel
   */
  closeDrillDownPanel: () => {
    set({
      drillDownPanel: {
        isOpen: false,
        type: null,
        filter: null,
        title: null,
        donors: []
      }
    });
  },

  /**
   * Get donors by RFM segment
   * @param {string} segmentName - RFM segment name (e.g., 'Champions (555)', 'At Risk (2-3 range)')
   * @returns {Array} Filtered array of donor objects with RFM scores
   */
  getDonorsBySegment: (segmentName) => {
    const { layer1, layer2, getFilteredDonors } = get();

    if (!layer1?.donors || !layer2?.rfm_analysis?.scores) {
      return [];
    }

    const filteredDonors = getFilteredDonors();
    const contactableDonors = filteredDonors.filter(donor => donor.is_anonymous !== true);

    // Map RFM scores to donors
    const donorsWithScores = contactableDonors.map(donor => {
      const rfmScore = layer2.rfm_analysis.scores[donor.donor_id];
      return {
        ...donor,
        rfm_score: rfmScore
      };
    }).filter(donor => donor.rfm_score);

    // Filter by segment
    return donorsWithScores.filter(donor => {
      const total = donor.rfm_score.rfm_total || 0;

      if (segmentName.includes('Champions')) {
        return total === 15;
      } else if (segmentName.includes('Loyal')) {
        return total >= 12 && total < 15;
      } else if (segmentName.includes('Potential')) {
        return total >= 9 && total < 12;
      } else if (segmentName.includes('At Risk')) {
        return total >= 6 && total < 9;
      } else if (segmentName.includes('Lost')) {
        return total < 6;
      }

      return false;
    });
  },

  /**
   * Get donors by lapse risk level
   * @param {string} riskLevel - 'low', 'medium', or 'high'
   * @returns {Array} Filtered array of donor objects with risk data
   */
  getDonorsByLapseRisk: (riskLevel) => {
    const { layer1, layer2, getFilteredDonors } = get();

    if (!layer1?.donors || !layer2?.lapse_risk_analysis?.individual_risks) {
      return [];
    }

    const filteredDonors = getFilteredDonors();
    const contactableDonors = filteredDonors.filter(donor => donor.is_anonymous !== true);

    // Map risk data to donors
    return contactableDonors.map(donor => {
      const riskData = layer2.lapse_risk_analysis.individual_risks[donor.donor_id];
      return {
        ...donor,
        risk_data: riskData
      };
    }).filter(donor => {
      return donor.risk_data?.risk_level?.toLowerCase() === riskLevel.toLowerCase();
    });
  },

  /**
   * Get donors by cohort year (year of first gift)
   * @param {number|string} year - Cohort year
   * @returns {Array} Filtered array of donor objects
   */
  getDonorsByCohort: (year) => {
    const { getAllDonors } = get();
    const allDonors = getAllDonors();

    return allDonors.filter(donor => {
      if (!donor.first_gift) return false;
      const firstGiftYear = new Date(donor.first_gift).getFullYear();
      return firstGiftYear === parseInt(year);
    });
  },

  /**
   * Get donors retained in a specific year from a cohort
   * @param {number|string} cohortYear - Year donors were acquired
   * @param {number|string} retentionYear - Year to check retention
   * @returns {Array} Filtered array of donor objects
   */
  getDonorsRetainedInYear: (cohortYear, retentionYear) => {
    const { getAllDonors } = get();
    const allDonors = getAllDonors();

    return allDonors.filter(donor => {
      if (!donor.first_gift || !donor.gifts) return false;

      // Check if donor is from the specified cohort
      const firstGiftYear = new Date(donor.first_gift).getFullYear();
      if (firstGiftYear !== parseInt(cohortYear)) return false;

      // Check if donor gave in the retention year
      const gaveInRetentionYear = donor.gifts.some(gift => {
        const giftYear = new Date(gift.date).getFullYear();
        return giftYear === parseInt(retentionYear);
      });

      return gaveInRetentionYear;
    });
  },

  /**
   * Get top N donors by total giving amount
   * @param {number} n - Number of top donors to return
   * @returns {Array} Filtered array of donor objects sorted by total giving
   */
  getTopDonorsByValue: (n = 10) => {
    const { getFilteredDonors } = get();
    const filteredDonors = getFilteredDonors();

    // Calculate total giving for each donor
    const donorsWithTotals = filteredDonors.map(donor => {
      const totalGiving = donor.gifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0;
      return {
        ...donor,
        total_giving: totalGiving
      };
    });

    // Sort by total giving (descending) and return top N
    return donorsWithTotals
      .sort((a, b) => b.total_giving - a.total_giving)
      .slice(0, n);
  },

  /**
   * Get new donors for a specific year
   * @param {number|string} year - Year to get new donors for
   * @returns {Array} Filtered array of donor objects
   */
  getNewDonorsByYear: (year) => {
    const { getAllDonors } = get();
    const allDonors = getAllDonors();

    return allDonors.filter(donor => {
      if (!donor.first_gift) return false;
      const firstGiftYear = new Date(donor.first_gift).getFullYear();
      return firstGiftYear === parseInt(year);
    });
  },

  /**
   * Get returning donors for a specific year
   * @param {number|string} year - Year to get returning donors for
   * @returns {Array} Filtered array of donor objects
   */
  getReturningDonorsByYear: (year) => {
    const { getAllDonors } = get();
    const allDonors = getAllDonors();

    return allDonors.filter(donor => {
      if (!donor.first_gift || !donor.gifts) return false;

      const firstGiftYear = new Date(donor.first_gift).getFullYear();
      const targetYear = parseInt(year);

      // Must have first gift before the target year
      if (firstGiftYear >= targetYear) return false;

      // Must have given in the target year
      const gaveInTargetYear = donor.gifts.some(gift => {
        const giftYear = new Date(gift.date).getFullYear();
        return giftYear === targetYear;
      });

      return gaveInTargetYear;
    });
  }
}));

export default useDataStore;
