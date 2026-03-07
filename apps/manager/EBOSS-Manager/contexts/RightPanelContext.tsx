import React, { createContext, useContext, useState, ReactNode } from 'react';

export type RightPanelContentType = 
  | { type: 'ticket'; id: string }
  | { type: 'unit'; id: string }
  | { type: 'customer'; id: string }
  | null;

interface RightPanelContextType {
  isOpen: boolean;
  content: RightPanelContentType;
  openPanel: (content: RightPanelContentType) => void;
  closePanel: () => void;
}

const RightPanelContext = createContext<RightPanelContextType | undefined>(undefined);

export const RightPanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<RightPanelContentType>(null);

  const openPanel = (newContent: RightPanelContentType) => {
    setContent(newContent);
    setIsOpen(true);
  };

  const closePanel = () => {
    setIsOpen(false);
    // Delay clearing content to allow close animation
    setTimeout(() => setContent(null), 300);
  };

  return (
    <RightPanelContext.Provider value={{ isOpen, content, openPanel, closePanel }}>
      {children}
    </RightPanelContext.Provider>
  );
};

export const useRightPanel = () => {
  const context = useContext(RightPanelContext);
  if (!context) {
    throw new Error('useRightPanel must be used within RightPanelProvider');
  }
  return context;
};
