import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only"
          {...props}
        />
        <div
          className={`
            w-5 h-5
            border border-slate-300 dark:border-dark-600
            rounded-md
            bg-white dark:bg-dark-800
            flex items-center justify-center
            transition-colors
            peer-checked:bg-brand-600 peer-checked:border-brand-600
            ${props.checked ? 'bg-brand-600 border-brand-600' : ''}
            ${className}
          `}
        >
          {props.checked && <Check size={16} className="text-white" />}
        </div>
      </label>
      {label && <label className="text-sm text-slate-700 dark:text-slate-300">{label}</label>}
    </div>
  );
};

export default Checkbox;
