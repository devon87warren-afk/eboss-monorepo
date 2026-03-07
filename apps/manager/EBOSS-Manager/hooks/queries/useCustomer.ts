import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../../services/api';

interface UseCustomerOptions {
  enabled?: boolean;
}

export const useCustomer = (id: string | null, options: UseCustomerOptions = {}) => {
  const { enabled = !!id } = options;

  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getById(id!),
    enabled: enabled && !!id,
  });
};
