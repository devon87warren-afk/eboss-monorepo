"use client";

import { CustomerLookup } from "@/components/salesforce/CustomerLookup";
import { useState } from "react";
import { SalesforceSearchResult } from "@/lib/salesforce";

export default function TestSalesforcePage() {
    const [selected, setSelected] = useState<SalesforceSearchResult | null>(null);

    return (
        <div className="min-h-screen bg-neutral-100 p-10 dark:bg-neutral-900">
            <div className="mx-auto max-w-2xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Salesforce Integration Test</h1>
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        Use the lookup component below to search for Accounts and Contacts in Salesforce.
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                    <h2 className="mb-4 text-lg font-semibold">Customer Lookup</h2>

                    <div className="flex flex-col gap-4">
                        <CustomerLookup
                            onSelect={(customer) => {
                                console.log('Selected Customer:', customer);
                                setSelected(customer);
                            }}
                        />

                        {selected && (
                            <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                                <h3 className="font-medium text-green-800 dark:text-green-300">Selected Record:</h3>
                                <pre className="mt-2 text-sm text-green-700 dark:text-green-400 overflow-auto">
                                    {JSON.stringify(selected, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-300">
                    <strong>Note:</strong> Ensure you have added your Salesforce credentials to <code>.env.local</code> for this to work.
                </div>
            </div>
        </div>
    );
}
