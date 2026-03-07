import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    MOCK_UNITS, MOCK_TICKETS, MOCK_CUSTOMERS, MOCK_TERRITORIES, MOCK_USERS,
    MOCK_ACTIONS, MOCK_INTERACTIONS, MOCK_TERRITORY_REMINDERS, MOCK_EXPENSES,
    MOCK_WEEKLY_DIGESTS, MOCK_VERIFICATION_QUEUE, MOCK_AUDIT_LOGS
} from '../mockData';
import { loadEbossData, loadCurrentUserProfile, subscribeToAuthChanges, upsertTicket, upsertUnit, upsertCustomers } from '../data/ebossData';
import {
    Unit, Ticket, SalesforceCustomer, UserProfile, Territory, Action,
    CustomerInteraction, TerritoryReminder, Expense, WeeklyDigest,
    VerificationQueueItem, AuditLog
} from '../types';

interface AppContextType {
    currentUser: UserProfile;
    users: UserProfile[];
    territories: Territory[];
    syncSalesforce: () => Promise<void>;
    isSyncing: boolean;
    units: Unit[];
    tickets: Ticket[];
    customers: SalesforceCustomer[];
    actions: Action[];
    interactions: CustomerInteraction[];
    territoryReminders: TerritoryReminder[];
    expenses: Expense[];
    weeklyDigests: WeeklyDigest[];
    verificationQueue: VerificationQueueItem[];
    auditLogs: AuditLog[];
    addTicket: (ticket: Ticket) => void;
    updateTicket: (ticket: Ticket) => void;
    updateUnit: (unit: Unit) => void;
    updateUnitStatus: (serialNumber: string, status: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within AppProvider");
    return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[0]);
    const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
    const [territories, setTerritories] = useState<Territory[]>(MOCK_TERRITORIES);
    const [units, setUnits] = useState<Unit[]>(MOCK_UNITS);
    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
    const [customers, setCustomers] = useState<SalesforceCustomer[]>(MOCK_CUSTOMERS);
    const [actions, setActions] = useState<Action[]>(MOCK_ACTIONS);
    const [interactions, setInteractions] = useState<CustomerInteraction[]>(MOCK_INTERACTIONS);
    const [territoryReminders, setTerritoryReminders] = useState<TerritoryReminder[]>(MOCK_TERRITORY_REMINDERS);
    const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
    const [weeklyDigests, setWeeklyDigests] = useState<WeeklyDigest[]>(MOCK_WEEKLY_DIGESTS);
    const [verificationQueue, setVerificationQueue] = useState<VerificationQueueItem[]>(MOCK_VERIFICATION_QUEUE);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            const data = await loadEbossData({
                units: MOCK_UNITS,
                tickets: MOCK_TICKETS,
                customers: MOCK_CUSTOMERS,
                territories: MOCK_TERRITORIES,
                users: MOCK_USERS,
                actions: MOCK_ACTIONS,
                interactions: MOCK_INTERACTIONS,
                territoryReminders: MOCK_TERRITORY_REMINDERS,
                expenses: MOCK_EXPENSES,
                weeklyDigests: MOCK_WEEKLY_DIGESTS,
                verificationQueue: MOCK_VERIFICATION_QUEUE,
                auditLogs: MOCK_AUDIT_LOGS
            });

            if (!isMounted) return;

            setUnits(data.units);
            setTickets(data.tickets);
            setCustomers(data.customers);
            setTerritories(data.territories);
            setUsers(data.users);
            setActions(data.actions);
            setInteractions(data.interactions);
            setTerritoryReminders(data.territoryReminders);
            setExpenses(data.expenses);
            setWeeklyDigests(data.weeklyDigests);
            setVerificationQueue(data.verificationQueue);
            setAuditLogs(data.auditLogs);
            const fallbackUser = data.users.find(user => user.isActive) ?? data.users[0] ?? MOCK_USERS[0];
            const resolvedUser = await loadCurrentUserProfile(data.users, fallbackUser);
            setCurrentUser(resolvedUser);
        };

        loadData();

        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        const fallbackUser = users.find(user => user.isActive) ?? users[0] ?? MOCK_USERS[0];
        return subscribeToAuthChanges(users, fallbackUser, setCurrentUser);
    }, [users]);

    const addTicket = (ticket: Ticket) => {
        setTickets(prev => [ticket, ...prev]);
        void upsertTicket(ticket);
    };

    const updateTicket = (updatedTicket: Ticket) => {
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        void upsertTicket(updatedTicket);
    };

    const updateUnit = (updatedUnit: Unit) => {
        setUnits(prev => prev.map(u => u.serialNumber === updatedUnit.serialNumber ? updatedUnit : u));
        void upsertUnit(updatedUnit);
    };

    const updateUnitStatus = (serialNumber: string, status: any) => {
        setUnits(prev => {
            const next = prev.map(u => u.serialNumber === serialNumber ? { ...u, status } : u);
            const updatedUnit = next.find(u => u.serialNumber === serialNumber);
            if (updatedUnit) void upsertUnit(updatedUnit);
            return next;
        });
    };

    const syncSalesforce = async () => {
        setIsSyncing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setCustomers(prev => {
            const updated = prev.map(c => ({ ...c, lastSync: new Date().toISOString() }));
            void upsertCustomers(updated);
            return updated;
        });
        setIsSyncing(false);
        alert("Salesforce Sync Complete");
    };

    useEffect(() => {
        const autoSync = async () => {
            setIsSyncing(true);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsSyncing(false);
            console.log("Auto-synced with Salesforce");
        };
        autoSync();
    }, []);

    return (
        <AppContext.Provider
            value={{
                currentUser, users, territories, units, tickets, customers, actions,
                interactions, territoryReminders, expenses, weeklyDigests, verificationQueue,
                auditLogs, addTicket, updateTicket, updateUnit, updateUnitStatus,
                syncSalesforce, isSyncing
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
