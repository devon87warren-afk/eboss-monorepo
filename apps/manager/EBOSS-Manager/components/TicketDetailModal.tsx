
import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import { X, Save, User, Clock, FileText, AlertTriangle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../App';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, onClose }) => {
  const { updateTicket } = useAppContext();
  const [formData, setFormData] = useState<Ticket>({ ...ticket });
  const [isEditing, setIsEditing] = useState(false);

  // Sync state if ticket prop changes
  useEffect(() => {
    setFormData({ ...ticket });
  }, [ticket]);

  const handleChange = (field: keyof Ticket, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedTicket = {
      ...formData,
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: 'John Doe' // Mock current user
    };
    updateTicket(updatedTicket);
    onClose();
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.RESOLVED: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case TicketStatus.CLOSED: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
      case TicketStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-dark-700 flex justify-between items-start bg-slate-50 dark:bg-dark-900/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm text-slate-500 dark:text-slate-400 font-bold">{formData.id}</span>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider border-none focus:ring-2 focus:ring-brand-500 cursor-pointer ${getStatusColor(formData.status)}`}
              >
                {Object.values(TicketStatus).map(s => (
                  <option key={s} value={s} className="bg-white dark:bg-dark-800 text-slate-800 dark:text-slate-200">{s}</option>
                ))}
              </select>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{formData.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Unit: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{formData.unitSerialNumber}</span> • {formData.category}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-dark-700 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Assigned Technician - Prominent */}
          <div className="flex items-center gap-4 bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 p-4 rounded-xl">
             <div className="w-12 h-12 bg-white dark:bg-dark-800 rounded-full flex items-center justify-center text-brand-600 shadow-sm border border-brand-100 dark:border-brand-900/50">
               <User size={24} />
             </div>
             <div>
               <p className="text-xs font-bold text-brand-800 dark:text-brand-300 uppercase tracking-wider">Assigned Technician</p>
               <p className="text-lg font-bold text-brand-900 dark:text-white">{formData.technician}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[100px] text-slate-800 dark:text-slate-200"
                  placeholder="Ticket description..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-800 dark:text-slate-200"
                >
                  {Object.values(TicketPriority).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
               <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Troubleshooting Notes</label>
                <textarea
                  value={formData.troubleshootingSteps || ''}
                  onChange={(e) => handleChange('troubleshootingSteps', e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[100px] text-slate-800 dark:text-slate-200"
                  placeholder="Steps taken..."
                />
              </div>

               <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Actual Faults</label>
                <textarea
                  value={formData.actualFaults || ''}
                  onChange={(e) => handleChange('actualFaults', e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[80px] text-slate-800 dark:text-slate-200"
                  placeholder="Root cause found..."
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          {formData.photos.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <ImageIcon size={14} /> Attached Evidence
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {formData.photos.map((photo, i) => (
                  <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-dark-700 shrink-0">
                    <img src={photo} alt={`Evidence ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Clock size={12} />
            {formData.lastUpdated ? (
              <span>Last updated {new Date(formData.lastUpdated).toLocaleDateString()} at {new Date(formData.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} by {formData.lastUpdatedBy}</span>
            ) : (
              <span>Created {formData.createdAt}</span>
            )}
          </div>
          <div className="flex gap-3">
             <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
             >
               Cancel
             </button>
             <button 
                onClick={handleSave}
                disabled={!isEditing}
                className={`px-6 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-all ${isEditing ? 'bg-brand-600 hover:bg-brand-700 shadow-md' : 'bg-slate-400 cursor-not-allowed'}`}
             >
               <Save size={16} /> Save Changes
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
