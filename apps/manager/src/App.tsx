import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

// Components
import Dashboard from './components/legacy/Dashboard';
import Cockpit from './components/legacy/Cockpit';
import TravelPage from './components/TravelPage';
import UnitList from './components/UnitList';
import UnitDetail from './components/UnitDetail';
import TicketList from './components/TicketList';
import Analytics from './components/Analytics';
import TerritoryAnalytics from './components/legacy/TerritoryAnalytics';
import CreateTicket from './components/CreateTicket';
import PMChecklistForm from './components/PMChecklistForm';
import Resources from './components/Resources';
import TechLounge from './components/TechLounge';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import ImportManager from './components/ImportManager';
import ExpenseManager from './components/ExpenseManager';
import AdminDashboard from './components/AdminDashboard';
import EnergyBossCommand from './components/legacy/EnergyBossCommand';
import OperationsHub from './components/dashboard/OperationsHub';

// Auth & Layout
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './components/Auth/LoginPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { ToastContainer } from './components/NotificationCenter';

// Contexts
import { PermissionProvider } from './contexts/PermissionContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { RightPanelProvider } from './contexts/RightPanelContext';
import { DensityProvider } from './contexts/DensityContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AppProvider, useAppContext } from './contexts/DataProvider';

// Data
import { queryClient } from './data/queryClient';

// Re-export hooks for backward compatibility
export { useTheme, useAppContext };

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <AppProvider>
            <ThemeProvider>
              <RightPanelProvider>
                <DensityProvider>
                  <PermissionProvider>
                    <NotificationProvider>
                      <Routes>
                        {/* Public route */}
                        <Route path="/login" element={<LoginPage />} />

                        {/* Protected routes */}
                        <Route
                          path="/*"
                          element={
                            <ProtectedRoute>
                              <MainLayout>
                                <Routes>
                                  <Route path="/" element={<Navigate to="/operations" replace />} />
                                  <Route path="/operations" element={<OperationsHub />} />
                                  <Route path="/legacy-dashboard" element={<Dashboard />} />
                                  <Route path="/cockpit" element={<Cockpit />} />
                                  <Route path="/travel" element={<TravelPage />} />
                                  <Route path="/command" element={<EnergyBossCommand />} />
                                  <Route path="/units" element={<UnitList />} />
                                  <Route path="/units/:serialNumber" element={<UnitDetail />} />
                                  <Route path="/customers" element={<CustomerList />} />
                                  <Route path="/customers/:id" element={<CustomerDetail />} />
                                  <Route path="/workflow" element={<ImportManager />} />
                                  <Route path="/tickets" element={<TicketList />} />
                                  <Route path="/tickets/new" element={<CreateTicket />} />
                                  <Route path="/tickets/pm/:unitSerialNumber" element={<PMChecklistForm />} />
                                  <Route path="/analytics" element={<TerritoryAnalytics />} />
                                  <Route path="/expenses" element={<ExpenseManager />} />
                                  <Route path="/admin" element={<AdminDashboard />} />
                                  <Route path="/resources" element={<Resources />} />
                                  <Route path="/tech-lounge" element={<TechLounge />} />
                                  <Route path="*" element={<Navigate to="/operations" replace />} />
                                </Routes>
                              </MainLayout>
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                      <ToastContainer />
                    </NotificationProvider>
                  </PermissionProvider>
                </DensityProvider>
              </RightPanelProvider>
            </ThemeProvider>
          </AppProvider>
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;
