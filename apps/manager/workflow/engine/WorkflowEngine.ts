import {
  WorkflowDefinition,
  WorkflowTransitionConfig,
  WorkflowStateConfig,
} from '../types/WorkflowConfig';
import { UserRole } from '../../types';

export interface WorkflowContext {
  entity: unknown;
  currentUser: { id: string; role: UserRole };
  metadata?: Record<string, unknown>;
}

export interface TransitionResult {
  success: boolean;
  newState?: string;
  error?: string;
}

type GuardFunction = (
  context: WorkflowContext,
  transition: WorkflowTransitionConfig
) => boolean | Promise<boolean>;

type ActionFunction = (
  context: WorkflowContext,
  transition: WorkflowTransitionConfig
) => void | Promise<void>;

class WorkflowEngineClass {
  private definitions: Map<string, WorkflowDefinition> = new Map();
  private guards: Map<string, GuardFunction> = new Map();
  private actions: Map<string, ActionFunction> = new Map();

  registerDefinition(definition: WorkflowDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  registerGuard(key: string, guard: GuardFunction): void {
    this.guards.set(key, guard);
  }

  registerAction(key: string, action: ActionFunction): void {
    this.actions.set(key, action);
  }

  getDefinition(workflowId: string): WorkflowDefinition | undefined {
    return this.definitions.get(workflowId);
  }

  getCurrentState(
    workflowId: string,
    entity: unknown
  ): WorkflowStateConfig | undefined {
    const definition = this.definitions.get(workflowId);
    if (!definition) return undefined;

    const currentStatus = (entity as any)[definition.statusField];
    return definition.states.find(s => s.id === currentStatus);
  }

  getAvailableTransitions(
    workflowId: string,
    entity: unknown,
    userRole: UserRole
  ): WorkflowTransitionConfig[] {
    const definition = this.definitions.get(workflowId);
    if (!definition) return [];

    const currentStatus = (entity as any)[definition.statusField];

    return definition.transitions.filter(transition => {
      // Check if transition is from current state
      const fromStates = Array.isArray(transition.from)
        ? transition.from
        : [transition.from];
      if (!fromStates.includes(currentStatus)) return false;

      // Check role permissions
      if (transition.roles && !transition.roles.includes(userRole)) return false;

      // Only manual transitions are directly available
      if (transition.trigger !== 'manual') return false;

      return true;
    });
  }

  async canTransition(
    workflowId: string,
    transitionId: string,
    context: WorkflowContext
  ): Promise<{ allowed: boolean; reason?: string }> {
    const definition = this.definitions.get(workflowId);
    if (!definition) {
      return { allowed: false, reason: 'Workflow not found' };
    }

    const transition = definition.transitions.find(t => t.id === transitionId);
    if (!transition) {
      return { allowed: false, reason: 'Transition not found' };
    }

    // Check role
    if (
      transition.roles &&
      !transition.roles.includes(context.currentUser.role)
    ) {
      return { allowed: false, reason: 'Insufficient permissions' };
    }

    // Check required fields
    if (transition.requiredFields) {
      const entity = context.entity as Record<string, unknown>;
      const missingFields = transition.requiredFields.filter(
        field => !entity[field] || entity[field] === ''
      );
      if (missingFields.length > 0) {
        return {
          allowed: false,
          reason: `Missing required fields: ${missingFields.join(', ')}`,
        };
      }
    }

    // Check guard
    if (transition.guard) {
      const guard = this.guards.get(transition.guard);
      if (guard) {
        const allowed = await guard(context, transition);
        if (!allowed) {
          return { allowed: false, reason: 'Guard condition not met' };
        }
      }
    }

    return { allowed: true };
  }

  async executeTransition(
    workflowId: string,
    transitionId: string,
    context: WorkflowContext
  ): Promise<TransitionResult> {
    const canTransitionResult = await this.canTransition(
      workflowId,
      transitionId,
      context
    );
    if (!canTransitionResult.allowed) {
      return { success: false, error: canTransitionResult.reason };
    }

    const definition = this.definitions.get(workflowId)!;
    const transition = definition.transitions.find(t => t.id === transitionId)!;
    const fromState = definition.states.find(
      s => s.id === (context.entity as any)[definition.statusField]
    );
    const toState = definition.states.find(s => s.id === transition.to);

    try {
      // Execute onExit hook
      if (fromState?.onExit) {
        await this.executeHook(fromState.onExit, context);
      }

      // Execute transition action
      if (transition.action) {
        const action = this.actions.get(transition.action);
        if (action) {
          await action(context, transition);
        }
      }

      // Execute onEnter hook
      if (toState?.onEnter) {
        await this.executeHook(toState.onEnter, context);
      }

      // Execute workflow-level hooks
      for (const hook of definition.hooks || []) {
        if (hook.event === 'onTransition') {
          await this.executeHook(hook.handler, context);
        }
      }

      return { success: true, newState: transition.to };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transition failed',
      };
    }
  }

  private async executeHook(
    handlerKey: string,
    context: WorkflowContext
  ): Promise<void> {
    const handler = this.actions.get(handlerKey);
    if (handler) {
      await handler(context, {} as WorkflowTransitionConfig);
    }
  }
}

export const WorkflowEngine = new WorkflowEngineClass();

// Initialize with common guards and actions
export const initializeWorkflowEngine = () => {
  // Guards
  WorkflowEngine.registerGuard('pmChecklistComplete', context => {
    const ticket = context.entity as any;
    return (
      ticket.pmData &&
      ticket.pmData.batteryStatus === 'Pass' &&
      ticket.pmData.driveStatus === 'Pass'
    );
  });

  // Actions
  WorkflowEngine.registerAction('notifyManager', async context => {
    console.log('Notifying manager about transition');
    // Implementation would send notification
  });

  WorkflowEngine.registerAction('createAuditLog', async context => {
    console.log('Creating audit log entry');
    // Implementation would create audit log
  });

  console.log('Workflow Engine initialized');
};
