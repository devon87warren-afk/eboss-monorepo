import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkflowEngine, WorkflowContext } from '../engine/WorkflowEngine';
import { WorkflowTransitionConfig } from '../types/WorkflowConfig';
import { useAppContext } from '../../App';
import toast from 'react-hot-toast';

interface UseWorkflowOptions {
  workflowId: string;
  entity: unknown;
  queryKey: string[];
  onTransitionSuccess?: (newState: string) => void;
}

export const useWorkflow = ({
  workflowId,
  entity,
  queryKey,
  onTransitionSuccess,
}: UseWorkflowOptions) => {
  const { currentUser } = useAppContext();
  const queryClient = useQueryClient();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const context: WorkflowContext = useMemo(
    () => ({
      entity,
      currentUser: { id: currentUser.id, role: currentUser.role },
    }),
    [entity, currentUser]
  );

  const currentState = useMemo(
    () => WorkflowEngine.getCurrentState(workflowId, entity),
    [workflowId, entity]
  );

  const availableTransitions = useMemo(
    () => WorkflowEngine.getAvailableTransitions(workflowId, entity, currentUser.role),
    [workflowId, entity, currentUser.role]
  );

  const transitionMutation = useMutation({
    mutationFn: async (transitionId: string) => {
      setIsTransitioning(true);
      const result = await WorkflowEngine.executeTransition(
        workflowId,
        transitionId,
        context
      );
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`Status changed to ${result.newState}`);
      onTransitionSuccess?.(result.newState!);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Transition failed');
    },
    onSettled: () => {
      setIsTransitioning(false);
    },
  });

  const executeTransition = useCallback(
    (transitionId: string) => {
      transitionMutation.mutate(transitionId);
    },
    [transitionMutation]
  );

  const canExecuteTransition = useCallback(
    async (transitionId: string) => {
      return WorkflowEngine.canTransition(workflowId, transitionId, context);
    },
    [workflowId, context]
  );

  return {
    currentState,
    availableTransitions,
    executeTransition,
    canExecuteTransition,
    isTransitioning,
  };
};
