import React from 'react';
import { X } from 'lucide-react';
import { useRightPanel } from '../../contexts/RightPanelContext';

interface RightPanelProps {
  children: React.ReactNode;
}

const RightPanel: React.FC<RightPanelProps> = ({ children }) => {
  const { isOpen, closePanel } = useRightPanel();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={closePanel}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[500px] lg:w-[600px] bg-white dark:bg-dark-900 shadow-2xl z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-dark-700">
          <div className="flex-1" />
          <button
            onClick={closePanel}
            className="p-2 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto h-[calc(100%-60px)]">
          {children}
        </div>
      </div>
    </>
  );
};

export default RightPanel;
