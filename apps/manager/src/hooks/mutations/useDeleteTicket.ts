import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../../services/api';
import toast from 'react-hot-toast';

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ticketsApi.delete(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      toast.success('Ticket deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete ticket');
      console.error(error);
    },
  });
};
