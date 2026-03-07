'use server';

import { searchSalesforceCustomers, SalesforceSearchResult } from '@/lib/salesforce';

export interface ActionState {
    success: boolean;
    data?: SalesforceSearchResult[];
    error?: string;
}

export async function lookupCustomerAction(query: string): Promise<ActionState> {
    try {
        if (!query || query.trim().length < 2) {
            return {
                success: true,
                data: []
            };
        }

        const results = await searchSalesforceCustomers(query);

        return {
            success: true,
            data: results
        };

    } catch (error) {
        console.error('Error in lookupCustomerAction:', error);
        // Do not expose raw error details to client in production
        return {
            success: false,
            error: 'Failed to retrieve customers. Please check system logs.'
        };
    }
}
