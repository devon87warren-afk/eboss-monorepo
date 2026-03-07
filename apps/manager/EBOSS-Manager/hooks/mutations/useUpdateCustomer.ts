import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../../services/api';
import { SalesforceCustomer } from '../../types';
import toast from 'react-hot-toast';

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SalesforceCustomer> }) =>
      customersApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
      toast.success('Customer updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update customer');
      console.error(error);
    },
  });
};
