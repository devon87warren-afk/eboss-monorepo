import { useQuery } from '@tanstack/react-query';
import { unitsApi } from '../../services/api';

interface UseUnitOptions {
  enabled?: boolean;
}

export const useUnit = (serialNumber: string | null, options: UseUnitOptions = {}) => {
  const { enabled = !!serialNumber } = options;

  return useQuery({
    queryKey: ['unit', serialNumber],
    queryFn: () => unitsApi.getById(serialNumber!),
    enabled: enabled && !!serialNumber,
  });
};
