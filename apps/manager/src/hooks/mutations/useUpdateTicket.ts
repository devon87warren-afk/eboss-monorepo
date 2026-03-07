import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../../services/api';
import { Ticket } from '../../types';
import toast from 'react-hot-toast';

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Ticket> }) =>
      ticketsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });
      toast.success('Ticket updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update ticket');
      console.error(error);
    },
  });
};
