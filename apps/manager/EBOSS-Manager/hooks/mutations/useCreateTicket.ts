import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../../services/api';
import { Ticket } from '../../types';
import toast from 'react-hot-toast';

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticket: Ticket) => ticketsApi.create(ticket),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create ticket');
      console.error(error);
    },
  });
};
