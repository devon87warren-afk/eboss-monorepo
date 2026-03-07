import React, { useState } from 'react';
import { Filter as FilterIcon } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { Select } from './Select';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'date-range';
  options?: { value: string | number; label: string }[];
}

interface FilterConfig {
  fields: FilterField[];
  onApply: (filters: Record<string, any>) => void;
  onClear?: () => void;
}

const Filter: React.FC<FilterConfig> = ({ fields, onApply, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeCount, setActiveCount] = useState(0);

  const handleFieldChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    const count = Object.values(newFilters).filter(v => v !== undefined && v !== '').length;
    setActiveCount(count);
  };

  const handleApply = () => {
    onApply(filters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setFilters({});
    setActiveCount(0);
    onClear?.();
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          border border-slate-300 dark:border-dark-700
          transition-colors
          ${
            isOpen
              ? 'bg-slate-100 dark:bg-dark-800'
              : 'bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-800'
          }
        `}
      >
        <FilterIcon size={18} />
        <span className="text-sm font-medium">Filter</span>
        {activeCount > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-brand-600 text-white text-xs rounded-full font-semibold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Filter Dropdown */}
      {isOpen && (
        <div
          className={`
            absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto
            bg-white dark:bg-dark-900
            border border-slate-300 dark:border-dark-700
            rounded-lg shadow-lg z-50
            p-4
          `}
        >
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field.key}>
                {field.type === 'text' && (
                  <div className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      placeholder={`Filter by ${field.label.toLowerCase()}`}
                      value={filters[field.key] || ''}
                      onChange={e => handleFieldChange(field.key, e.target.value)}
                    />
                  </div>
                )}

                {field.type === 'select' && (
                  <div className="space-y-2">
                    <Label>{field.label}</Label>
                    <Select
                      options={field.options || []}
                      value={filters[field.key] || ''}
                      onChange={e => handleFieldChange(field.key, e.target.value)}
                    />
                  </div>
                )}

                {field.type === 'date' && (
                  <div className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      type="date"
                      value={filters[field.key] || ''}
                      onChange={e => handleFieldChange(field.key, e.target.value)}
                    />
                  </div>
                )}

                {field.type === 'date-range' && (
                  <div className="space-y-2">
                    <Label>{field.label}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        placeholder="From"
                        value={filters[`${field.key}_from`] || ''}
                        onChange={e => handleFieldChange(`${field.key}_from`, e.target.value)}
                      />
                      <Input
                        type="date"
                        placeholder="To"
                        value={filters[`${field.key}_to`] || ''}
                        onChange={e => handleFieldChange(`${field.key}_to`, e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-dark-700">
            <Button variant="secondary" size="sm" onClick={handleClear} className="flex-1">
              Clear
            </Button>
            <Button variant="default" size="sm" onClick={handleApply} className="flex-1">
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export { Filter };
