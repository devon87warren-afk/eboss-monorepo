import { unitsApi, ticketsApi, customersApi, actionsApi } from '../../services/api';

// Map entity names to their corresponding API
export const resolveDataFetcher = (entity: string) => {
  const apiMap: Record<string, any> = {
    'units': unitsApi,
    'tickets': ticketsApi,
    'customers': customersApi,
    'actions': actionsApi,
  };

  const api = apiMap[entity];

  if (!api) {
    console.warn(`No API found for entity: ${entity}`);
    return {
      getAll: async () => ({ data: [], total: 0, hasMore: false }),
      getById: async () => null,
      create: async () => null,
      update: async () => null,
      delete: async () => null,
    };
  }

  return api;
};
