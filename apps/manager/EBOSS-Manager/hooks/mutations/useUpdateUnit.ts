import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unitsApi } from '../../services/api';
import { Unit } from '../../types';
import toast from 'react-hot-toast';

export const useUpdateUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serialNumber, updates }: { serialNumber: string; updates: Partial<Unit> }) =>
      unitsApi.update(serialNumber, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit', variables.serialNumber] });
      toast.success('Unit updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update unit');
      console.error(error);
    },
  });
};
