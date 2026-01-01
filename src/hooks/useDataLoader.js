import { useEffect } from 'react';
import useDataStore from '../store/dataStore';

/**
 * Hook to load donor data on component mount
 * Automatically fetches all three data layers when used
 *
 * @returns {Object} { isLoading, error, data }
 * - isLoading: boolean indicating if data is currently being fetched
 * - error: error message string if fetch failed, null otherwise
 * - data: object containing { layer1, layer2, layer3 } or null if not loaded
 */
const useDataLoader = () => {
  const {
    layer1,
    layer2,
    layer3,
    isLoading,
    error,
    loadData
  } = useDataStore();

  useEffect(() => {
    // Only load data if it hasn't been loaded yet
    if (!layer1 && !layer2 && !layer3 && !isLoading) {
      loadData();
    }
  }, [layer1, layer2, layer3, isLoading, loadData]);

  return {
    isLoading,
    error,
    data: layer1 && layer2 && layer3
      ? { layer1, layer2, layer3 }
      : null
  };
};

export default useDataLoader;
