import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../../services/api';
import { Ticket } from '../../types';

interface UseTicketsOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export const useTickets = (options: UseTicketsOptions = {}) => {
  const { page = 1, pageSize = 50, enabled = true } = options;

  return useQuery({
    queryKey: ['tickets', { page, pageSize }],
    queryFn: () => ticketsApi.getAll({ page, pageSize }),
    enabled,
  });
};
