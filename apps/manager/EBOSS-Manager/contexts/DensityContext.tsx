import React, { createContext, useContext, useState, ReactNode } from 'react';

export type DensityLevel = 'compact' | 'normal' | 'comfortable';

interface DensityContextType {
  density: DensityLevel;
  setDensity: (density: DensityLevel) => void;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

export const DensityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [density, setDensity] = useState<DensityLevel>(() => {
    const stored = localStorage.getItem('density-level');
    return (stored as DensityLevel) || 'normal';
  });

  const handleSetDensity = (newDensity: DensityLevel) => {
    setDensity(newDensity);
    localStorage.setItem('density-level', newDensity);
  };

  return (
    <DensityContext.Provider value={{ density, setDensity: handleSetDensity }}>
      {children}
    </DensityContext.Provider>
  );
};

export const useDensity = () => {
  const context = useContext(DensityContext);
  if (!context) {
    throw new Error('useDensity must be used within DensityProvider');
  }
  return context;
};

// Helper to get spacing class names based on density
export const getDensityClass = (density: DensityLevel, compact: string, normal: string, comfortable: string) => {
  switch (density) {
    case 'compact':
      return compact;
    case 'comfortable':
      return comfortable;
    default:
      return normal;
  }
};
