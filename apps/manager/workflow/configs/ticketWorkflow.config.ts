import { WorkflowDefinition, PageConfig } from '../types/WorkflowConfig';
import { TicketPriority, TicketStatus, UserRole } from '../../types';

// Ticket workflow state machine
export const ticketWorkflow: WorkflowDefinition = {
  id: 'ticket-workflow',
  name: 'Service Ticket Workflow',
  entity: 'tickets',
  statusField: 'status',
  initialState: 'Open',
  states: [
    {
      id: 'Open',
      label: 'Open',
      type: 'initial',
      color: 'blue',
      icon: 'Circle',
    },
    {
      id: 'In Progress',
      label: 'In Progress',
      type: 'intermediate',
      color: 'amber',
      icon: 'Clock',
    },
    {
      id: 'Resolved',
      label: 'Resolved',
      type: 'intermediate',
      color: 'emerald',
      icon: 'CheckCircle',
    },
    {
      id: 'Closed',
      label: 'Closed',
      type: 'final',
      color: 'slate',
      icon: 'Archive',
    },
  ],
  transitions: [
    {
      id: 'start-work',
      from: 'Open',
      to: 'In Progress',
      label: 'Start Work',
      trigger: 'manual',
      roles: [UserRole.TECH, UserRole.MANAGER, UserRole.ADMIN],
    },
    {
      id: 'resolve',
      from: 'In Progress',
      to: 'Resolved',
      label: 'Resolve',
      trigger: 'manual',
      requiredFields: ['actualFaults'],
      roles: [UserRole.TECH, UserRole.MANAGER, UserRole.ADMIN],
    },
    {
      id: 'close',
      from: 'Resolved',
      to: 'Closed',
      label: 'Close Ticket',
      trigger: 'manual',
      roles: [UserRole.MANAGER, UserRole.ADMIN],
    },
    {
      id: 'reopen',
      from: ['Resolved', 'Closed'],
      to: 'Open',
      label: 'Reopen',
      trigger: 'manual',
      roles: [UserRole.ADMIN],
    },
  ],
  hooks: [
    {
      event: 'onTransition',
      handler: 'createAuditLog',
    },
  ],
};

// Ticket list page configuration
export const ticketListPage: PageConfig = {
  id: 'ticket-list',
  type: 'list',
  title: 'Service Tickets',
  subtitle: 'View and manage service tickets across the fleet',
  dataSource: {
    entity: 'tickets',
    queryKey: ['tickets'],
    defaultSort: { field: 'createdAt', direction: 'desc' },
  },
  layout: {
    type: 'list',
    viewModes: ['table'],
    defaultView: 'table',
    columns: [
      {
        key: 'id',
        label: 'Ticket ID',
        type: 'link',
        sortable: true,
        width: '120px',
      },
      {
        key: 'title',
        label: 'Title',
        type: 'text',
        sortable: true,
      },
      {
        key: 'unitSerialNumber',
        label: 'Unit',
        type: 'link',
        sortable: true,
        width: '140px',
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'badge',
        sortable: true,
        width: '120px',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'status',
        sortable: true,
        width: '130px',
      },
      {
        key: 'createdAt',
        label: 'Created',
        type: 'date',
        sortable: true,
        width: '120px',
        format: { type: 'date' },
      },
      {
        key: 'technician',
        label: 'Technician',
        type: 'text',
        width: '150px',
      },
    ],
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: Object.values(TicketStatus).map(s => ({ value: s, label: s })),
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: Object.values(TicketPriority).map(p => ({ value: p, label: p })),
      },
      {
        key: 'createdAt',
        label: 'Date Range',
        type: 'date-range',
      },
    ],
    searchFields: ['id', 'title', 'description', 'unitSerialNumber'],
    pagination: { defaultPageSize: 20, pageSizes: [10, 20, 50, 100] },
    selectable: true,
    rowActions: [
      {
        id: 'view',
        label: 'View',
        icon: 'Eye',
        type: 'navigate',
        handler: { to: '/tickets/:id' },
      },
    ],
    bulkActions: [
      {
        id: 'bulk-assign',
        label: 'Assign Technician',
        icon: 'UserPlus',
        type: 'modal',
        handler: { component: 'BulkAssignModal' },
        roles: [UserRole.ADMIN, UserRole.MANAGER],
      },
    ],
  },
  actions: [
    {
      id: 'create',
      label: 'New Ticket',
      icon: 'Plus',
      type: 'navigate',
      variant: 'primary',
      handler: { to: '/tickets/new' },
    },
  ],
};
