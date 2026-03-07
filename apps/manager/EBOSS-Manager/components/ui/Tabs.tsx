import React, { useState } from 'react';

export interface Tab {
  label: string;
  content: React.ReactNode;
  id?: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: number;
  onChange?: (tabIndex: number) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab = 0, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    onChange?.(index);
  };

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex border-b border-slate-200 dark:border-dark-700 overflow-x-auto">
        {tabs.map((tab, index) => (
          <button
            key={tab.id || index}
            onClick={() => handleTabChange(index)}
            className={`
              px-4 py-3
              font-medium
              text-sm
              transition-colors
              border-b-2
              whitespace-nowrap
              ${
                activeTab === index
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

export default Tabs;
