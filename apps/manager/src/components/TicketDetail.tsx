import React, { useState, useEffect } from 'react';
import { useTicket } from '../hooks/queries/useTicket';
import { useUpdateTicket } from '../hooks/mutations/useUpdateTicket';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import { Save, Clock, User, AlertTriangle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';

interface TicketDetailProps {
  ticketId: string;
  onClose: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onClose }) => {
  const { data: ticket, isLoading } = useTicket(ticketId);
  const updateMutation = useUpdateTicket();
  const [formData, setFormData] = useState<Ticket | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (ticket) {
      setFormData(ticket);
    }
  }, [ticket]);

  if (isLoading || !formData) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton height={30} width="80%" />
        <Skeleton count={5} height={20} />
      </div>
    );
  }

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.RESOLVED:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case TicketStatus.CLOSED:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
      case TicketStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.CRITICAL:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case TicketPriority.HIGH:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case TicketPriority.MEDIUM:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const handleChange = (field: keyof Ticket, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!formData) return;
    const updatedTicket = {
      ...formData,
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: 'John Doe',
    };
    updateMutation.mutate(
      { id: formData.id, updates: updatedTicket },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <span className="font-mono text-sm text-slate-500 dark:text-slate-400 font-bold">
              {formData.id}
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {formData.title}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as TicketStatus)}
            className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border-none focus:ring-2 focus:ring-brand-500 cursor-pointer ${getStatusColor(formData.status)}`}
          >
            {Object.values(TicketStatus).map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value as TicketPriority)}
            className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border-none focus:ring-2 focus:ring-brand-500 cursor-pointer ${getPriorityColor(formData.priority)}`}
          >
            {Object.values(TicketPriority).map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
          Unit: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{formData.unitSerialNumber}</span> •{' '}
          {formData.category}
        </p>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Technician */}
              <div className="flex items-center gap-4 bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 p-4 rounded-lg">
                <div className="w-10 h-10 bg-white dark:bg-dark-800 rounded-full flex items-center justify-center text-brand-600 shadow-sm">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-800 dark:text-brand-300 uppercase tracking-wider">
                    Assigned To
                  </p>
                  <p className="text-base font-bold text-brand-900 dark:text-white">{formData.technician}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[100px] text-slate-800 dark:text-slate-200"
                  placeholder="Ticket description..."
                />
              </div>

              {/* Troubleshooting */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Troubleshooting Steps
                </label>
                <textarea
                  value={formData.troubleshootingSteps || ''}
                  onChange={(e) => handleChange('troubleshootingSteps', e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[100px] text-slate-800 dark:text-slate-200"
                  placeholder="Steps taken..."
                />
              </div>

              {/* Actual Faults */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Actual Faults
                </label>
                <textarea
                  value={formData.actualFaults || ''}
                  onChange={(e) => handleChange('actualFaults', e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[80px] text-slate-800 dark:text-slate-200"
                  placeholder="Root cause found..."
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attachments">
            <div>
              {formData.photos && formData.photos.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <ImageIcon size={16} /> {formData.photos.length} attachment(s)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {formData.photos.map((photo, i) => (
                      <div
                        key={i}
                        className="rounded-lg overflow-hidden border border-slate-200 dark:border-dark-700 aspect-square"
                      >
                        <img
                          src={photo}
                          alt={`Evidence ${i}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No attachments</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <Clock size={20} className="text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">Ticket Created</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(formData.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {formData.lastUpdated && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={20} className="text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">Last Updated</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(formData.lastUpdated).toLocaleString()} by {formData.lastUpdatedBy}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900/50 flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="default"
          onClick={handleSave}
          disabled={!isEditing || updateMutation.isPending}
          isLoading={updateMutation.isPending}
        >
          <Save size={16} /> {isEditing ? 'Save Changes' : 'Saved'}
        </Button>
      </div>
    </div>
  );
};

export default TicketDetail;
