import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 bg-white transition-colors peer-checked:border-brand-600 peer-checked:bg-brand-600 dark:border-dark-600 dark:bg-dark-800',
            props.checked ? 'border-brand-600 bg-brand-600' : '',
            className
          )}
        >
          {props.checked && <Check size={16} className="text-white" />}
        </div>
      </label>
      {label && <label className="text-sm text-slate-700 dark:text-slate-300">{label}</label>}
    </div>
  );
};

export { Checkbox };
