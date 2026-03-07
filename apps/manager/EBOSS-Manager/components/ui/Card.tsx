import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={`
        bg-white dark:bg-dark-800
        border border-slate-200 dark:border-dark-700
        rounded-lg
        shadow-sm
        overflow-hidden
        ${className}
      `}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div
      className={`
        px-6 py-4
        border-b border-slate-200 dark:border-dark-700
        ${className}
      `}
    >
      {children}
    </div>
  );
};

const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div
      className={`
        px-6 py-4
        border-t border-slate-200 dark:border-dark-700
        bg-slate-50 dark:bg-dark-900/50
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardContent, CardFooter };
