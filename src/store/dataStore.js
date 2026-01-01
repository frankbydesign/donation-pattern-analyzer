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

  /**
   * Load all three layers of donor data from JSON files
   * @returns {Promise<void>}
   */
  loadData: async () => {
    set({ isLoading: true, error: null });

    try {
      // Fetch all three data layers in parallel
      const [layer1Response, layer2Response, layer3Response] = await Promise.all([
        fetch('/data/donor_data_layer1.json'),
        fetch('/data/donor_data_layer2.json'),
        fetch('/data/donor_data_layer3.json')
      ]);

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

      // Update store with loaded data
      set({
        layer1: layer1Data,
        layer2: layer2Data,
        layer3: layer3Data,
        isLoading: false,
        error: null
      });

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
   * @returns {Array} Filtered array of donor objects
   */
  getFilteredDonors: () => {
    const { layer1, filters } = get();

    if (!layer1?.donors) {
      return [];
    }

    let filteredDonors = [...layer1.donors];

    // Apply date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filteredDonors = filteredDonors.filter((donor) => {
        // Filter donors who have at least one gift within the date range
        return donor.gifts?.some((gift) => {
          const giftDate = new Date(gift.date);
          const startDate = start ? new Date(start) : new Date('1900-01-01');
          const endDate = end ? new Date(end) : new Date('2100-12-31');
          return giftDate >= startDate && giftDate <= endDate;
        });
      });
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
  }
}));

export default useDataStore;
