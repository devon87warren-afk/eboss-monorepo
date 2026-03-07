import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../../services/api';

interface UseCustomersOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export const useCustomers = (options: UseCustomersOptions = {}) => {
  const { page = 1, pageSize = 50, enabled = true } = options;

  return useQuery({
    queryKey: ['customers', { page, pageSize }],
    queryFn: () => customersApi.getAll({ page, pageSize }),
    enabled,
  });
};
