import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <input
        className={`
          px-3 py-2
          border border-slate-300 dark:border-dark-700
          rounded-lg
          bg-white dark:bg-dark-800
          text-slate-900 dark:text-white
          placeholder-slate-500 dark:placeholder-slate-400
          focus:outline-none
          focus:ring-2
          focus:ring-brand-500
          focus:border-transparent
          transition-colors
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Input;
