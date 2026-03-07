// Types
export * from './types/WorkflowConfig';

// Component Registry
export { ComponentRegistry, initializeRegistry } from './registry/ComponentRegistry';
export { DynamicComponent } from './registry/ComponentResolver';

// Templates
export { default as GenericListPage } from './templates/GenericListPage';

// Workflow Engine
export { WorkflowEngine, initializeWorkflowEngine } from './engine/WorkflowEngine';
export type { WorkflowContext, TransitionResult } from './engine/WorkflowEngine';

// Hooks
export { useRoleAccess } from './hooks/useRoleAccess';
export { useWorkflow } from './hooks/useWorkflow';

// Utilities
export { resolveDataFetcher } from './utils/dataResolver';
export { renderCellValue } from './utils/cellRenderers';
export { executeAction } from './utils/actionExecutor';

// Configurations
export { ticketWorkflow, ticketListPage } from './configs/ticketWorkflow.config';

// Initialize the workflow system
export const initializeWorkflowSystem = () => {
  initializeRegistry();
  initializeWorkflowEngine();
  console.log('Workflow system initialized');
};
