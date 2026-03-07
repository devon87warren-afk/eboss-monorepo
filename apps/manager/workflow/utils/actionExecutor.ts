import { NavigateFunction } from 'react-router-dom';
import { ActionConfig } from '../types/WorkflowConfig';

// Execute an action based on its configuration
export const executeAction = (
  action: ActionConfig,
  context: unknown,
  navigate: NavigateFunction
): void => {
  switch (action.type) {
    case 'navigate':
      if (action.handler.to) {
        const path = resolvePathParams(action.handler.to, context);
        navigate(path);
      }
      break;

    case 'api':
      // Will be implemented later with mutation hooks
      console.log('API action:', action.id, context);
      break;

    case 'modal':
    case 'drawer':
      // Will be implemented later with modal/drawer system
      console.log('Modal/Drawer action:', action.id, context);
      break;

    case 'workflow':
      // Will be implemented later with workflow engine
      console.log('Workflow action:', action.id, context);
      break;

    case 'custom':
      // Will look up custom handler from registry
      console.log('Custom action:', action.id, context);
      break;

    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
};

// Replace :params in path with values from context
const resolvePathParams = (path: string, context: unknown): string => {
  if (!context || typeof context !== 'object') return path;

  let resolvedPath = path;
  const params = path.match(/:(\w+)/g);

  if (params) {
    params.forEach(param => {
      const key = param.substring(1); // Remove the ':'
      const value = (context as Record<string, unknown>)[key];
      if (value !== undefined) {
        resolvedPath = resolvedPath.replace(param, String(value));
      }
    });
  }

  return resolvedPath;
};
