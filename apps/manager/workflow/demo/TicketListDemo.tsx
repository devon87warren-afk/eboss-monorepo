import React from 'react';
import GenericListPage from '../templates/GenericListPage';
import { ticketListPage } from '../configs/ticketWorkflow.config';

/**
 * Demo component showing how to use GenericListPage with configuration
 *
 * To use this in your app:
 * 1. Import this component in App.tsx
 * 2. Add a route: <Route path="/tickets-demo" element={<TicketListDemo />} />
 * 3. Navigate to /tickets-demo to see the dynamic list page in action
 *
 * This demonstrates how pages can be rendered entirely from configuration
 * without writing custom components for each entity.
 */
const TicketListDemo: React.FC = () => {
  return <GenericListPage config={ticketListPage} />;
};

export default TicketListDemo;
