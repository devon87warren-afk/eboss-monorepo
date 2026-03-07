import { useQuery } from '@tanstack/react-query';
import { unitsApi } from '../../services/api';

interface UseUnitsOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export const useUnits = (options: UseUnitsOptions = {}) => {
  const { page = 1, pageSize = 50, enabled = true } = options;

  return useQuery({
    queryKey: ['units', { page, pageSize }],
    queryFn: () => unitsApi.getAll({ page, pageSize }),
    enabled,
  });
};
