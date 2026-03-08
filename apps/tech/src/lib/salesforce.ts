import * as jsforce from 'jsforce';

// Define interface for search results
export interface SalesforceSearchResult {
    Id: string;
    Name: string;
    Type: string;
    // TODO(EBOSS-111, 2026-03-08): Replace index-signature `any` with a more
    // specific type once the full Salesforce field set is known.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

let conn: jsforce.Connection | null = null;

export const getSalesforceConnection = async (): Promise<jsforce.Connection> => {
    if (conn) {
        return conn;
    }

    const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const username = process.env.SALESFORCE_USERNAME;
    const password = process.env.SALESFORCE_PASSWORD;

    if (!username || !password) {
        throw new Error('Salesforce credentials (USERNAME/PASSWORD) are missing from environment variables.');
    }

    // Initialize connection
    // Optimizing for simple Username-Password flow or OAuth2 Client Credentials if robust structure needed in future
    // For now, using standard login via jsforce which handles OAuth2 flow implicitly or direct login

    // Create Connection options
    // If Client ID/Secret are present, use OAuth2
    if (clientId && clientSecret) {
        conn = new jsforce.Connection({
            oauth2: {
                loginUrl,
                clientId,
                clientSecret,
            }
        });
    } else {
        // Fallback to basic connection (SOAP login usually, but jsforce abstracts this)
        conn = new jsforce.Connection({
            loginUrl
        });
    }

    try {
        await conn.login(username, password);
        console.log('Successfully connected to Salesforce');
        return conn;
    } catch (error) {
        console.error('Failed to connect to Salesforce:', error);
        conn = null;
        throw error;
    }
};

/**
 * Searches for Accounts and Contacts matching the query string.
 * Uses SOSL (Salesforce Object Search Language) for efficient text search.
 */
export const searchSalesforceCustomers = async (query: string): Promise<SalesforceSearchResult[]> => {
    if (!query || query.length < 2) return [];

    const connection = await getSalesforceConnection();

    // Sanitize query to prevent injection (SOSL injection is rare but possible with brace handling)
    const sanitizedQuery = query.replace(/[\{\}\(\)\[\]]/g, '');

    // SOSL Query: FIND {term} IN ALL FIELDS RETURNING Account(Id, Name, Type, BillingCity, BillingState), Contact(Id, Name, Email, Phone, Account.Name)
    const sosl = `FIND {${sanitizedQuery}*} IN ALL FIELDS RETURNING Account(Id, Name, Type, BillingCity, BillingState), Contact(Id, Name, Email, Phone, Account.Name)`;

    try {
        const result = await connection.search(sosl);

        // Flatten results into a single array
        // TODO(EBOSS-111, 2026-03-08): Type the jsforce searchRecord callback
        // once jsforce typings expose the full record shape.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records = result.searchRecords.map((record: { attributes: { type: any; }; }) => ({
            ...record,
            Type: record.attributes.type, // Ensure Type is explicit
        }));

        return records as SalesforceSearchResult[];
    } catch (error) {
        console.error('Salesforce search error:', error);
        throw new Error('Failed to search Salesforce records.');
    }
};
