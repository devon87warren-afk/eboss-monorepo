"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Building2, User } from "lucide-react"
import { useDebounce } from "use-debounce"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { lookupCustomerAction } from "@/app/actions/salesforce-actions"
import { SalesforceSearchResult } from "@/lib/salesforce"

interface CustomerLookupProps {
    onSelect?: (customer: SalesforceSearchResult) => void
}

export function CustomerLookup({ onSelect }: CustomerLookupProps) {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [debouncedQuery] = useDebounce(query, 300)
    const [results, setResults] = React.useState<SalesforceSearchResult[]>([])
    const [loading, setLoading] = React.useState(false)
    const [selectedCustomer, setSelectedCustomer] = React.useState<SalesforceSearchResult | null>(null)

    React.useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults([])
            return
        }

        const fetchCustomers = async () => {
            setLoading(true)
            const res = await lookupCustomerAction(debouncedQuery)
            setLoading(false)
            if (res.success && res.data) {
                setResults(res.data)
            } else {
                setResults([])
            }
        }

        fetchCustomers()
    }, [debouncedQuery])

    const handleSelect = (customer: SalesforceSearchResult) => {
        setSelectedCustomer(customer)
        setOpen(false)
        if (onSelect) {
            onSelect(customer)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[300px] justify-between"
                >
                    {selectedCustomer ? (
                        <span className="flex items-center gap-2 truncate">
                            {selectedCustomer.Type === 'Account' ? <Building2 className="h-4 w-4 opacity-50" /> : <User className="h-4 w-4 opacity-50" />}
                            {selectedCustomer.Name}
                        </span>
                    ) : (
                        "Search customer..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search Salesforce..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {!loading && query.length >= 2 && results.length === 0 && (
                            <CommandEmpty>No customer found.</CommandEmpty>
                        )}
                        {!loading && query.length < 2 && (
                            <CommandEmpty>Type at least 2 characters...</CommandEmpty>
                        )}

                        <CommandGroup heading="Results">
                            {results.map((customer) => (
                                <CommandItem
                                    key={customer.Id}
                                    value={customer.Id} // Note: unique value needed
                                    onSelect={() => handleSelect(customer)}
                                    className="flex items-center gap-2"
                                >
                                    {customer.Type === 'Account' ? <Building2 className="h-4 w-4 opacity-50" /> : <User className="h-4 w-4 opacity-50" />}
                                    <div className="flex flex-col">
                                        <span className="font-medium">{customer.Name}</span>
                                        <span className="text-xs text-muted-foreground">{customer.Type}</span>
                                    </div>
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            selectedCustomer?.Id === customer.Id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
