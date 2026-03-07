import { Unit, Ticket, SalesforceCustomer, UserProfile, Territory, Action, CustomerInteraction, TerritoryReminder, Expense, WeeklyDigest, VerificationQueueItem, AuditLog } from '../types';
import { MOCK_UNITS, MOCK_TICKETS, MOCK_CUSTOMERS, MOCK_TERRITORIES, MOCK_USERS, MOCK_ACTIONS, MOCK_INTERACTIONS, MOCK_TERRITORY_REMINDERS, MOCK_EXPENSES, MOCK_WEEKLY_DIGESTS, MOCK_VERIFICATION_QUEUE, MOCK_AUDIT_LOGS } from '../mockData';
import { supabaseClient } from '../supabaseClient';

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

interface FetchOptions {
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Helper to apply filters and pagination to array data
const paginateArray = <T,>(
  data: T[],
  page = 1,
  pageSize = 50
): { data: T[]; total: number; hasMore: boolean } => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    data: data.slice(start, end),
    total: data.length,
    hasMore: end < data.length,
  };
};

// UNITS API
export const unitsApi = {
  getAll: async (pagination?: PaginationParams, options?: FetchOptions) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('units')
          .select('*');
        if (error) throw error;
        return paginateArray(data || [], pagination?.page || 1, pagination?.pageSize || 50);
      }
    } catch (error) {
      console.error('Failed to fetch units from Supabase:', error);
    }
    // Fallback to mock data
    return paginateArray(MOCK_UNITS, pagination?.page || 1, pagination?.pageSize || 50);
  },

  getById: async (serialNumber: string) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('units')
          .select('*')
          .eq('serialNumber', serialNumber)
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch unit from Supabase:', error);
    }
    return MOCK_UNITS.find(u => u.serialNumber === serialNumber);
  },

  update: async (serialNumber: string, updates: Partial<Unit>) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('units')
          .update(updates)
          .eq('serialNumber', serialNumber)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Failed to update unit in Supabase:', error);
    }
    // Mock: return updated unit
    const unit = MOCK_UNITS.find(u => u.serialNumber === serialNumber);
    return unit ? { ...unit, ...updates } : null;
  },
};

// TICKETS API
export const ticketsApi = {
  getAll: async (pagination?: PaginationParams, options?: FetchOptions) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('tickets')
          .select('*');
        if (error) throw error;
        return paginateArray(data || [], pagination?.page || 1, pagination?.pageSize || 50);
      }
    } catch (error) {
      console.error('Failed to fetch tickets from Supabase:', error);
    }
    return paginateArray(MOCK_TICKETS, pagination?.page || 1, pagination?.pageSize || 50);
  },

  getById: async (id: string) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('tickets')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch ticket from Supabase:', error);
    }
    return MOCK_TICKETS.find(t => t.id === id);
  },

  create: async (ticket: Ticket) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('tickets')
          .insert([ticket])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Failed to create ticket in Supabase:', error);
    }
    return ticket;
  },

  update: async (id: string, updates: Partial<Ticket>) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('tickets')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Failed to update ticket in Supabase:', error);
    }
    const ticket = MOCK_TICKETS.find(t => t.id === id);
    return ticket ? { ...ticket, ...updates } : null;
  },

  delete: async (id: string) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { error } = await supabaseClient.client
          .from('tickets')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to delete ticket in Supabase:', error);
    }
  },
};

// CUSTOMERS API
export const customersApi = {
  getAll: async (pagination?: PaginationParams, options?: FetchOptions) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('customers')
          .select('*');
        if (error) throw error;
        return paginateArray(data || [], pagination?.page || 1, pagination?.pageSize || 50);
      }
    } catch (error) {
      console.error('Failed to fetch customers from Supabase:', error);
    }
    return paginateArray(MOCK_CUSTOMERS, pagination?.page || 1, pagination?.pageSize || 50);
  },

  getById: async (id: string) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch customer from Supabase:', error);
    }
    return MOCK_CUSTOMERS.find(c => c.id === id);
  },

  update: async (id: string, updates: Partial<SalesforceCustomer>) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('customers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Failed to update customer in Supabase:', error);
    }
    const customer = MOCK_CUSTOMERS.find(c => c.id === id);
    return customer ? { ...customer, ...updates } : null;
  },
};

// ACTIONS API
export const actionsApi = {
  getAll: async (pagination?: PaginationParams) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('actions')
          .select('*');
        if (error) throw error;
        return paginateArray(data || [], pagination?.page || 1, pagination?.pageSize || 50);
      }
    } catch (error) {
      console.error('Failed to fetch actions from Supabase:', error);
    }
    return paginateArray(MOCK_ACTIONS, pagination?.page || 1, pagination?.pageSize || 50);
  },

  getById: async (id: string) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('actions')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch action from Supabase:', error);
    }
    return MOCK_ACTIONS.find(a => a.id === id);
  },

  update: async (id: string, updates: Partial<Action>) => {
    try {
      if (supabaseClient.isSupabaseConfigured) {
        const { data, error } = await supabaseClient.client
          .from('actions')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Failed to update action in Supabase:', error);
    }
    const action = MOCK_ACTIONS.find(a => a.id === id);
    return action ? { ...action, ...updates } : null;
  },
};
