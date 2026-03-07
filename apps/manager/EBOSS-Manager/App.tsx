import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './components/Dashboard';
import UnitList from './components/UnitList';
import UnitDetail from './components/UnitDetail';
import TicketList from './components/TicketList';
import Analytics from './components/Analytics';
import CreateTicket from './components/CreateTicket';
import PMChecklistForm from './components/PMChecklistForm';
import Resources from './components/Resources';
import TechLounge from './components/TechLounge';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import WorkflowCenter from './components/WorkflowCenter';
import MainLayout from './components/Layout/MainLayout';
import { RightPanelProvider } from './contexts/RightPanelContext';
import { DensityProvider } from './contexts/DensityContext';
import { queryClient } from './data/queryClient';
import {
  MOCK_UNITS,
  MOCK_TICKETS,
  MOCK_CUSTOMERS,
  MOCK_TERRITORIES,
  MOCK_USERS,
  MOCK_ACTIONS,
  MOCK_INTERACTIONS,
  MOCK_TERRITORY_REMINDERS,
  MOCK_EXPENSES,
  MOCK_WEEKLY_DIGESTS,
  MOCK_VERIFICATION_QUEUE,
  MOCK_AUDIT_LOGS
} from './mockData';
import { loadEbossData, loadCurrentUserProfile, subscribeToAuthChanges, upsertTicket, upsertUnit, upsertCustomers } from './data/ebossData';
import {
  Unit,
  Ticket,
  SalesforceCustomer,
  UserProfile,
  Territory,
  Action,
  CustomerInteraction,
  TerritoryReminder,
  Expense,
  WeeklyDigest,
  VerificationQueueItem,
  AuditLog
} from './types';

// --- Dark Mode Context ---
interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

// --- Global App Data Context (Slimmed down for UI state only) ---
interface AppContextType {
  currentUser: UserProfile;
  users: UserProfile[];
  territories: Territory[];
  syncSalesforce: () => Promise<void>;
  isSyncing: boolean;
  // Legacy: kept for backward compatibility, will be removed after migration
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

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

  // Dark Mode Logic
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

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

      if (!isMounted) {
        return;
      }

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

    return () => {
      isMounted = false;
    };
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
      if (updatedUnit) {
        void upsertUnit(updatedUnit);
      }
      return next;
    });
  };

  const syncSalesforce = async () => {
    setIsSyncing(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Simulate update logic (in real app this would fetch from API)
    setCustomers(prev => {
      const updated = prev.map(c => ({ ...c, lastSync: new Date().toISOString() }));
      void upsertCustomers(updated);
      return updated;
    });
    setIsSyncing(false);
    alert("Salesforce Sync Complete");
  };

  // Simulate auto-sync on mount
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
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <AppContext.Provider
        value={{
          currentUser,
          users,
          territories,
          units,
          tickets,
          customers,
          actions,
          interactions,
          territoryReminders,
          expenses,
          weeklyDigests,
          verificationQueue,
          auditLogs,
          addTicket,
          updateTicket,
          updateUnit,
          updateUnitStatus,
          syncSalesforce,
          isSyncing
        }}
      >
        {children}
      </AppContext.Provider>
    </ThemeContext.Provider>
  );
};

// --- Layout Components ---

const SidebarLink = ({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick?: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 group ${isActive
          ? 'bg-brand-600 text-white shadow-md'
          : 'text-slate-400 hover:bg-dark-800 hover:text-white'
        }`}
    >
      <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Logo = () => {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      <img
        src="https://cdn.builder.io/api/v1/image/assets%2F30d905344c494c688ebb5f3b3e1505cb%2F30b1f12ddfe04ccbad9e410b0a9ac54f"
        alt="ANA Energy"
        className="w-full max-w-[180px] h-auto object-contain"
      />
    </div>
  );
};

const MobileLogo = () => {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/logo-mobile.png"
        alt="ANA Energy"
        className="h-8 w-auto object-contain"
      />
    </div>
  );
};

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const { syncSalesforce, isSyncing } = useAppContext();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-dark-950 transition-colors duration-200">
      <aside className="hidden md:flex flex-col w-64 bg-dark-900 text-white shadow-xl z-20 border-r border-dark-800">
        <div className="border-b border-dark-800 flex flex-col items-center text-center">
          <Logo />
          <div className="pb-4 w-full">
            <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase opacity-70">EBOSS Manager v2.1</p>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink to="/units" icon={Package} label="Units" />
          <SidebarLink to="/customers" icon={Users} label="Customers" />
          <SidebarLink to="/tickets" icon={ClipboardList} label="Service Tickets" />
          <SidebarLink to="/tech-lounge" icon={MessageSquare} label="App Tech Lounge" />
          <SidebarLink to="/analytics" icon={BarChart3} label="Quality Analytics" />
          <SidebarLink to="/resources" icon={BookOpen} label="Technical Library" />
        </nav>

        <div className="p-4 bg-dark-800 border-t border-dark-700">
          <div className="flex flex-col gap-4">
            <button
              onClick={syncSalesforce}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Syncing..." : "Sync Salesforce"}
            </button>

            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Appearance</span>
              <button
                onClick={toggleDarkMode}
                className="p-1.5 rounded-full bg-dark-700 text-slate-300 hover:text-white hover:bg-dark-600 transition-colors"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            <div className="flex items-center gap-3 px-2 pt-2 border-t border-dark-700">
              <div className="w-9 h-9 rounded-full bg-brand-600 border border-dark-600 flex items-center justify-center text-xs font-bold shadow-lg text-white">JD</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">John Doe</p>
                <p className="text-xs text-slate-400 truncate">Field Technician</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden bg-dark-900 text-white p-4 flex justify-between items-center shadow-md z-30 border-b border-dark-800">
          <MobileLogo />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full h-[calc(100%-4rem)] bg-dark-900/95 backdrop-blur-md z-40 p-4 flex flex-col md:hidden">
            <nav className="flex-1">
              <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/units" icon={Package} label="Units" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/customers" icon={Users} label="Customers" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/tickets" icon={ClipboardList} label="Service Tickets" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/tech-lounge" icon={MessageSquare} label="App Tech Lounge" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/analytics" icon={BarChart3} label="Quality Analytics" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/resources" icon={BookOpen} label="Technical Library" onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-8 dark:bg-dark-950">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

// Role-based redirect component for default "*" route
const RoleBasedRedirect: React.FC = () => {
  const { roleLevel } = useAuth();
  const target = roleLevel >= ROLE_LEVELS.Manager ? "/dashboard" : "/cockpit";
  return <Navigate to={target} replace />;
};

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppProvider>
          <RightPanelProvider>
            <DensityProvider>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/units" element={<UnitList />} />
                  <Route path="/units/:serialNumber" element={<UnitDetail />} />
                  <Route path="/customers" element={<CustomerList />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/workflow" element={<WorkflowCenter />} />
                  <Route path="/tickets" element={<TicketList />} />
                  <Route path="/tickets/new" element={<CreateTicket />} />
                  <Route path="/tickets/pm/:unitSerialNumber" element={<PMChecklistForm />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/tech-lounge" element={<TechLounge />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            </DensityProvider>
          </RightPanelProvider>
        </AppProvider>
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;
