import type { MapSearchItem } from '@/api/maps';
import * as React from 'react';

type MapSearchSelectionContextValue = {
  selectedSearchResult: MapSearchItem | null;
  selectSearchResult: (item: MapSearchItem) => void;
  clearSearchResult: () => void;
};

const MapSearchSelectionContext = React.createContext<MapSearchSelectionContextValue | null>(null);

export function MapSearchSelectionProvider({ children }: React.PropsWithChildren) {
  const [selectedSearchResult, setSelectedSearchResult] = React.useState<MapSearchItem | null>(
    null
  );

  const selectSearchResult = React.useCallback((item: MapSearchItem) => {
    setSelectedSearchResult(item);
  }, []);

  const clearSearchResult = React.useCallback(() => {
    setSelectedSearchResult(null);
  }, []);

  const value = React.useMemo(
    () => ({ selectedSearchResult, selectSearchResult, clearSearchResult }),
    [clearSearchResult, selectSearchResult, selectedSearchResult]
  );

  return (
    <MapSearchSelectionContext.Provider value={value}>
      {children}
    </MapSearchSelectionContext.Provider>
  );
}

export function useMapSearchSelection() {
  const context = React.useContext(MapSearchSelectionContext);
  if (!context) {
    throw new Error('useMapSearchSelection must be used within MapSearchSelectionProvider');
  }
  return context;
}
