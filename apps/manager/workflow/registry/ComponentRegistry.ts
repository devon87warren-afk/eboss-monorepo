import React, { lazy, ComponentType } from 'react';

export type RegistryCategory =
  | 'page'
  | 'widget'
  | 'field'
  | 'cell'
  | 'action'
  | 'modal'
  | 'drawer';

export interface ComponentRegistration<P = any> {
  component: ComponentType<P> | React.LazyExoticComponent<ComponentType<P>>;
  displayName: string;
  category: RegistryCategory;
  description?: string;
  defaultProps?: Partial<P>;
}

class ComponentRegistryClass {
  private registry: Map<string, ComponentRegistration> = new Map();

  register<P>(key: string, registration: ComponentRegistration<P>): void {
    if (this.registry.has(key)) {
      console.warn(`Component "${key}" is already registered. Overwriting.`);
    }
    this.registry.set(key, registration);
  }

  get<P>(key: string): ComponentRegistration<P> | undefined {
    return this.registry.get(key) as ComponentRegistration<P> | undefined;
  }

  getComponent<P>(key: string): ComponentType<P> | undefined {
    return this.registry.get(key)?.component as ComponentType<P> | undefined;
  }

  has(key: string): boolean {
    return this.registry.has(key);
  }

  getByCategory(category: RegistryCategory): Map<string, ComponentRegistration> {
    const filtered = new Map<string, ComponentRegistration>();
    this.registry.forEach((reg, key) => {
      if (reg.category === category) {
        filtered.set(key, reg);
      }
    });
    return filtered;
  }

  listKeys(): string[] {
    return Array.from(this.registry.keys());
  }

  // Lazy loading helper
  registerLazy<P>(
    key: string,
    importFn: () => Promise<{ default: ComponentType<P> }>,
    meta: Omit<ComponentRegistration<P>, 'component'>
  ): void {
    this.register(key, {
      ...meta,
      component: lazy(importFn)
    });
  }
}

export const ComponentRegistry = new ComponentRegistryClass();

// Initialize with built-in components
export const initializeRegistry = () => {
  // Page templates will be registered lazily as they're built
  // ComponentRegistry.registerLazy('GenericListPage',
  //   () => import('../templates/GenericListPage'),
  //   { displayName: 'Generic List Page', category: 'page' }
  // );
  // ComponentRegistry.registerLazy('GenericDetailPage',
  //   () => import('../templates/GenericDetailPage'),
  //   { displayName: 'Generic Detail Page', category: 'page' }
  // );
  // ComponentRegistry.registerLazy('GenericFormPage',
  //   () => import('../templates/GenericFormPage'),
  //   { displayName: 'Generic Form Page', category: 'page' }
  // );
  // ComponentRegistry.registerLazy('GenericDashboard',
  //   () => import('../templates/GenericDashboard'),
  //   { displayName: 'Generic Dashboard', category: 'page' }
  // );
  // ComponentRegistry.registerLazy('WorkflowWizard',
  //   () => import('../templates/WorkflowWizard'),
  //   { displayName: 'Workflow Wizard', category: 'page' }
  // );

  // Widgets will be registered as they're built
  // ComponentRegistry.registerLazy('StatWidget',
  //   () => import('../widgets/StatWidget'),
  //   { displayName: 'Stat Widget', category: 'widget' }
  // );
  // ComponentRegistry.registerLazy('ChartWidget',
  //   () => import('../widgets/ChartWidget'),
  //   { displayName: 'Chart Widget', category: 'widget' }
  // );

  console.log('Component Registry initialized');
};
