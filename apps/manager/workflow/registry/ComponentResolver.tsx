import React, { Suspense } from 'react';
import { ComponentRegistry } from './ComponentRegistry';
import Skeleton from '../../components/ui/Skeleton';

interface DynamicComponentProps {
  componentKey: string;
  fallback?: React.ReactNode;
  [key: string]: unknown;
}

export const DynamicComponent: React.FC<DynamicComponentProps> = ({
  componentKey,
  fallback = <Skeleton count={3} />,
  ...props
}) => {
  const Component = ComponentRegistry.getComponent(componentKey);

  if (!Component) {
    console.error(`Component "${componentKey}" not found in registry`);
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">
          Component "{componentKey}" not found
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};
