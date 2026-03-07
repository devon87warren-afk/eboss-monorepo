import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TicketPriority, TicketStatus, Ticket } from '../types';
import { AlertCircle, CheckCircle, Clock, PlusCircle } from 'lucide-react';
import { useTickets } from '../hooks/queries/useTickets';
import { useRightPanel } from '../contexts/RightPanelContext';
import { Filter, type FilterField } from './ui/Filter';
import { Skeleton } from './ui/Skeleton';
import { Table, type Column } from './ui/Table';
import TicketDetail from './TicketDetail';

const TicketList: React.FC = () => {
  const { data, isLoading } = useTickets({ pageSize: 100 });
  const { isOpen, content, openPanel, closePanel } = useRightPanel();
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedRows, setSelectedRows] = useState<Ticket[]>([]);

  // Initialize filtered tickets when data loads
  React.useEffect(() => {
    if (data?.data) {
      setFilteredTickets(data.data);
    }
  }, [data]);

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.RESOLVED:
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case TicketStatus.CLOSED:
        return 'bg-slate-100 dark:bg-dark-700 text-slate-800 dark:text-slate-300';
      case TicketStatus.IN_PROGRESS:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.CRITICAL:
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case TicketPriority.HIGH:
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case TicketPriority.MEDIUM:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.RESOLVED:
        return <CheckCircle size={16} className="text-green-600 dark:text-green-400" />;
      case TicketStatus.CLOSED:
        return <CheckCircle size={16} className="text-slate-400" />;
      case TicketStatus.IN_PROGRESS:
        return <Clock size={16} className="text-blue-600 dark:text-blue-400" />;
      default:
        return <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />;
    }
  };

  const columns: Column<Ticket>[] = [
    {
      key: 'id',
      label: 'Ticket ID',
      sortable: true,
      width: '100px',
      render: (value) => (
        <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">{value}</span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      width: '110px',
      render: (value: TicketPriority) => (
        <span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${getPriorityColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Issue',
      sortable: true,
      width: '300px',
      render: (value, row: Ticket) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-slate-900 dark:text-white">{value}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{row.category}</span>
        </div>
      ),
    },
    {
      key: 'unitSerialNumber',
      label: 'Unit',
      sortable: true,
      width: '120px',
      render: (value) => (
        <Link
          to={`/units/${value}`}
          className="font-mono text-sm text-brand-600 dark:text-brand-400 hover:underline"
          onClick={e => e.stopPropagation()}
        >
          {value}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '120px',
      render: (value: TicketStatus) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(value)}
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(value)}`}>
            {value}
          </span>
        </div>
      ),
    },
    {
      key: 'technician',
      label: 'Technician',
      sortable: true,
      width: '120px',
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      width: '100px',
      render: (value) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filterFields: FilterField[] = [
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
      key: 'technician',
      label: 'Technician',
      type: 'text',
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      type: 'date',
    },
  ];

  const handleApplyFilters = (filters: Record<string, any>) => {
    if (!data?.data) return;

    const filtered = data.data.filter(ticket => {
      for (const [key, value] of Object.entries(filters)) {
        if (!value) continue;

        if (key === 'status' && ticket.status !== value) return false;
        if (key === 'priority' && ticket.priority !== value) return false;
        if (key === 'technician' && !ticket.technician.toLowerCase().includes(String(value).toLowerCase()))
          return false;
        if (key === 'createdAt') {
          const ticketDate = new Date(ticket.createdAt).toDateString();
          const filterDate = new Date(value).toDateString();
          if (ticketDate !== filterDate) return false;
        }
      }
      return true;
    });

    setFilteredTickets(filtered);
  };

  const handleOpenDetail = (ticket: Ticket) => {
    openPanel({ type: 'ticket', id: ticket.id });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Service Tickets</h2>
            <p className="text-slate-500 dark:text-slate-400">Track troubleshooting, defects, and maintenance.</p>
          </div>
        </div>
        <Skeleton count={8} height={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Service Tickets</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Track troubleshooting, defects, and maintenance. Total: {data?.total || 0} tickets
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <PlusCircle size={18} />
          Create Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Filter
          fields={filterFields}
          onApply={handleApplyFilters}
          onClear={() => setFilteredTickets(data?.data || [])}
        />
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Showing {filteredTickets.length} of {data?.total || 0} tickets
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden">
        <Table
          columns={columns}
          data={filteredTickets}
          keyField="id"
          onRowClick={handleOpenDetail}
          selectable={true}
          onSelectionChange={setSelectedRows}
          emptyMessage="No tickets found. Create one to get started!"
        />
      </div>

      {/* Right Panel Detail View */}
      {isOpen && content?.type === 'ticket' && (
        <TicketDetail ticketId={content.id} onClose={closePanel} />
      )}
    </div>
  );
};

export default TicketList;
