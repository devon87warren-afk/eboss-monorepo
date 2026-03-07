import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../../services/api';

interface UseTicketOptions {
  enabled?: boolean;
}

export const useTicket = (id: string | null, options: UseTicketOptions = {}) => {
  const { enabled = !!id } = options;

  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getById(id!),
    enabled: enabled && !!id,
  });
};
