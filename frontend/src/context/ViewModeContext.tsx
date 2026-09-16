import React, { createContext, useContext, useState, useEffect } from 'react';

export type ViewMode = 'simple' | 'advanced';

interface ViewModeContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  toggleMode: () => void;
  isAdvanced: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('kavach_view_mode');
    return (saved === 'advanced' || saved === 'simple') ? saved : 'simple';
  });

  useEffect(() => {
    localStorage.setItem('kavach_view_mode', mode);
  }, [mode]);

  const setMode = (newMode: ViewMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState((prev) => (prev === 'simple' ? 'advanced' : 'simple'));
  };

  return (
    <ViewModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isAdvanced: mode === 'advanced',
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = (): ViewModeContextType => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};
