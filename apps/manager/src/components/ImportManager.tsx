import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Trash2,
  Eye,
  ChevronRight,
  Filter,
  Search,
  Plus,
  MoreVertical,
  AlertCircle,
  Users,
  MapPin
} from 'lucide-react';

// Import batch types
type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
type ValidationStatus = 'valid' | 'warning' | 'error';

interface ImportBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  status: ImportStatus;
  totalRecords: number;
  processedRecords: number;
  validRecords: number;
  warningRecords: number;
  errorRecords: number;
  territory: string;
}

interface ImportRecord {
  id: string;
  name: string;
  email: string;
  company: string;
  territory: string;
  status: ValidationStatus;
  issues: string[];
}

// Mock data
const MOCK_BATCHES: ImportBatch[] = [
  {
    id: 'IMP-001',
    fileName: 'california_contacts_jan2024.csv',
    uploadedAt: '2024-01-09T10:30:00Z',
    uploadedBy: 'Tim Buffington',
    status: 'processing',
    totalRecords: 127,
    processedRecords: 89,
    validRecords: 82,
    warningRecords: 5,
    errorRecords: 2,
    territory: 'California'
  },
  {
    id: 'IMP-002',
    fileName: 'oregon_washington_q4.csv',
    uploadedAt: '2024-01-09T09:15:00Z',
    uploadedBy: 'Sarah Chen',
    status: 'completed',
    totalRecords: 98,
    processedRecords: 98,
    validRecords: 95,
    warningRecords: 3,
    errorRecords: 0,
    territory: 'Oregon'
  },
  {
    id: 'IMP-003',
    fileName: 'nevada_contacts.csv',
    uploadedAt: '2024-01-08T16:45:00Z',
    uploadedBy: 'Mike Rodriguez',
    status: 'failed',
    totalRecords: 45,
    processedRecords: 12,
    validRecords: 10,
    warningRecords: 0,
    errorRecords: 2,
    territory: 'Nevada'
  },
  {
    id: 'IMP-004',
    fileName: 'colorado_new_accounts.csv',
    uploadedAt: '2024-01-08T14:20:00Z',
    uploadedBy: 'Emily Watson',
    status: 'pending',
    totalRecords: 76,
    processedRecords: 0,
    validRecords: 0,
    warningRecords: 0,
    errorRecords: 0,
    territory: 'Colorado'
  },
  {
    id: 'IMP-005',
    fileName: 'arizona_update_batch.csv',
    uploadedAt: '2024-01-08T11:00:00Z',
    uploadedBy: 'Tim Buffington',
    status: 'partial',
    totalRecords: 156,
    processedRecords: 156,
    validRecords: 142,
    warningRecords: 8,
    errorRecords: 6,
    territory: 'Arizona'
  }
];

const MOCK_RECORDS: ImportRecord[] = [
  { id: '1', name: 'John Smith', email: 'jsmith@solartechca.com', company: 'SolarTech California', territory: 'California', status: 'valid', issues: [] },
  { id: '2', name: 'Maria Garcia', email: 'mgarcia@greenpower.net', company: 'GreenPower Inc', territory: 'California', status: 'valid', issues: [] },
  { id: '3', name: 'Robert Chen', email: 'rchen@', company: 'Pacific Energy', territory: 'California', status: 'error', issues: ['Invalid email format'] },
  { id: '4', name: 'Lisa Wong', email: 'lwong@sunstate.com', company: '', territory: 'California', status: 'warning', issues: ['Missing company name'] },
  { id: '5', name: 'James Miller', email: 'jmiller@brightfuture.org', company: 'BrightFuture Solar', territory: 'California', status: 'valid', issues: [] },
];

// Status badge component
const StatusBadge: React.FC<{ status: ImportStatus }> = ({ status }) => {
  const configs: Record<ImportStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    pending: { bg: 'bg-navy-100 dark:bg-navy-800', text: 'text-navy-600 dark:text-navy-300', icon: <Clock size={14} />, label: 'Pending' },
    processing: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', icon: <RefreshCw size={14} className="animate-spin" />, label: 'Processing' },
    completed: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-600 dark:text-success-400', icon: <CheckCircle size={14} />, label: 'Completed' },
    failed: { bg: 'bg-danger-100 dark:bg-danger-900/30', text: 'text-danger-600 dark:text-danger-400', icon: <XCircle size={14} />, label: 'Failed' },
    partial: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-600 dark:text-warning-500', icon: <AlertTriangle size={14} />, label: 'Partial' },
  };

  const config = configs[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// Validation status badge
const ValidationBadge: React.FC<{ status: ValidationStatus }> = ({ status }) => {
  const configs: Record<ValidationStatus, { bg: string; text: string; icon: React.ReactNode }> = {
    valid: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-600 dark:text-success-400', icon: <CheckCircle size={14} /> },
    warning: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-600 dark:text-warning-500', icon: <AlertTriangle size={14} /> },
    error: { bg: 'bg-danger-100 dark:bg-danger-900/30', text: 'text-danger-600 dark:text-danger-400', icon: <XCircle size={14} /> },
  };

  const config = configs[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${config.bg} ${config.text}`}>
      {config.icon}
    </span>
  );
};

// Progress bar component
const ProgressBar: React.FC<{ progress: number; valid: number; warning: number; error: number }> = ({ progress, valid, warning, error }) => {
  const total = valid + warning + error || 1;
  const validPercent = (valid / total) * 100;
  const warningPercent = (warning / total) * 100;
  const errorPercent = (error / total) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-navy-600 dark:text-navy-400">{progress}% complete</span>
        <span className="text-medium">{valid + warning + error} / {total} records</span>
      </div>
      <div className="h-2 bg-navy-200 dark:bg-navy-700 rounded-full overflow-hidden flex">
        <div className="bg-success-500 h-full transition-all duration-300" style={{ width: `${validPercent}%` }} />
        <div className="bg-warning-500 h-full transition-all duration-300" style={{ width: `${warningPercent}%` }} />
        <div className="bg-danger-500 h-full transition-all duration-300" style={{ width: `${errorPercent}%` }} />
      </div>
    </div>
  );
};

// Stats card component
const StatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
}> = ({ title, value, icon, color, subtext }) => (
  <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-4 border-l-3 border-l-transparent" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-navy-600 dark:text-navy-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-navy-900 dark:text-white font-heading">{value}</p>
        {subtext && <p className="text-xs text-medium mt-1">{subtext}</p>}
      </div>
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <div style={{ color }}>{icon}</div>
      </div>
    </div>
  </div>
);

// Batch card component
const BatchCard: React.FC<{ batch: ImportBatch; onClick: () => void; isSelected: boolean }> = ({ batch, onClick, isSelected }) => {
  const progress = batch.totalRecords > 0 ? Math.round((batch.processedRecords / batch.totalRecords) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-navy-800 rounded-card shadow-card p-4 cursor-pointer transition-all duration-200 border-2 ${
        isSelected ? 'border-orange-500 shadow-card-hover' : 'border-transparent hover:shadow-card-hover'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-navy-100 dark:bg-navy-700 rounded-lg">
            <FileText size={20} className="text-navy-600 dark:text-navy-300" />
          </div>
          <div>
            <p className="font-medium text-navy-900 dark:text-white text-sm truncate max-w-[200px]">
              {batch.fileName}
            </p>
            <p className="text-xs text-medium">{batch.uploadedBy} • {new Date(batch.uploadedAt).toLocaleDateString()}</p>
          </div>
        </div>
        <StatusBadge status={batch.status} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <MapPin size={14} className="text-navy-400" />
        <span className="text-xs text-navy-600 dark:text-navy-400">{batch.territory}</span>
      </div>

      <ProgressBar
        progress={progress}
        valid={batch.validRecords}
        warning={batch.warningRecords}
        error={batch.errorRecords}
      />

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-navy-100 dark:border-navy-700">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-success-500">
            <CheckCircle size={12} /> {batch.validRecords}
          </span>
          <span className="flex items-center gap-1 text-warning-500">
            <AlertTriangle size={12} /> {batch.warningRecords}
          </span>
          <span className="flex items-center gap-1 text-danger-500">
            <XCircle size={12} /> {batch.errorRecords}
          </span>
        </div>
        <ChevronRight size={16} className="text-navy-400" />
      </div>
    </div>
  );
};

// Main Import Manager component
const ImportManager: React.FC = () => {
  const [selectedBatch, setSelectedBatch] = useState<string | null>('IMP-001');
  const [filterStatus, setFilterStatus] = useState<ImportStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecordDetails, setShowRecordDetails] = useState(false);

  const filteredBatches = MOCK_BATCHES.filter(batch => {
    if (filterStatus !== 'all' && batch.status !== filterStatus) return false;
    if (searchQuery && !batch.fileName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedBatchData = MOCK_BATCHES.find(b => b.id === selectedBatch);

  // Calculate totals
  const totals = MOCK_BATCHES.reduce((acc, batch) => ({
    pending: acc.pending + (batch.status === 'pending' ? 1 : 0),
    processing: acc.processing + (batch.status === 'processing' ? 1 : 0),
    completed: acc.completed + (batch.status === 'completed' ? 1 : 0),
    failed: acc.failed + (batch.status === 'failed' ? 1 : 0),
    totalRecords: acc.totalRecords + batch.totalRecords,
  }), { pending: 0, processing: 0, completed: 0, failed: 0, totalRecords: 0 });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white font-heading">
            Import Manager
          </h1>
          <p className="text-medium">Manage customer contact imports and data validation</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-card">
          <Plus size={18} />
          New Import
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Pending Batches"
          value={totals.pending}
          icon={<Clock size={24} />}
          color="#627d98"
          subtext="Awaiting processing"
        />
        <StatsCard
          title="Processing"
          value={totals.processing}
          icon={<RefreshCw size={24} />}
          color="#ff6b35"
          subtext="Currently importing"
        />
        <StatsCard
          title="Completed Today"
          value={totals.completed}
          icon={<CheckCircle size={24} />}
          color="#06d6a0"
          subtext={`${totals.totalRecords} total records`}
        />
        <StatsCard
          title="Issues Found"
          value={totals.failed}
          icon={<AlertCircle size={24} />}
          color="#ef476f"
          subtext="Requires attention"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Batch List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="text"
                  placeholder="Search batches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-navy-50 dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <button className="p-2 bg-navy-50 dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-lg hover:border-orange-500 transition-colors">
                <Filter size={18} className="text-navy-600 dark:text-navy-400" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'processing', 'completed', 'failed', 'partial'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-orange-500 text-white'
                      : 'bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-300 hover:bg-navy-200 dark:hover:bg-navy-600'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Batch Cards */}
          <div className="space-y-3">
            {filteredBatches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                onClick={() => setSelectedBatch(batch.id)}
                isSelected={selectedBatch === batch.id}
              />
            ))}

            {filteredBatches.length === 0 && (
              <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-8 text-center">
                <FileText size={48} className="mx-auto text-navy-300 mb-3" />
                <p className="text-navy-600 dark:text-navy-400">No batches found</p>
                <p className="text-sm text-medium">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Batch Details */}
        <div className="lg:col-span-3">
          {selectedBatchData ? (
            <div className="bg-white dark:bg-navy-800 rounded-card shadow-card">
              {/* Header */}
              <div className="p-6 border-b border-navy-100 dark:border-navy-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-navy-900 dark:text-white font-heading">
                      {selectedBatchData.fileName}
                    </h2>
                    <p className="text-sm text-medium">
                      Uploaded by {selectedBatchData.uploadedBy} on {new Date(selectedBatchData.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedBatchData.status} />
                    <button className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg transition-colors">
                      <MoreVertical size={18} className="text-navy-600 dark:text-navy-400" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <ProgressBar
                    progress={Math.round((selectedBatchData.processedRecords / selectedBatchData.totalRecords) * 100)}
                    valid={selectedBatchData.validRecords}
                    warning={selectedBatchData.warningRecords}
                    error={selectedBatchData.errorRecords}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  {selectedBatchData.status === 'pending' && (
                    <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      <RefreshCw size={16} />
                      Start Processing
                    </button>
                  )}
                  {selectedBatchData.status === 'completed' && (
                    <button className="flex items-center gap-2 bg-success-500 hover:bg-success-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      <Download size={16} />
                      Export Results
                    </button>
                  )}
                  {(selectedBatchData.status === 'failed' || selectedBatchData.status === 'partial') && (
                    <>
                      <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <RefreshCw size={16} />
                        Retry Failed
                      </button>
                      <button className="flex items-center gap-2 bg-navy-100 dark:bg-navy-700 hover:bg-navy-200 dark:hover:bg-navy-600 text-navy-700 dark:text-navy-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Download size={16} />
                        Export Errors
                      </button>
                    </>
                  )}
                  <button className="flex items-center gap-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto">
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>

              {/* Records Table */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-navy-900 dark:text-white">Import Records</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowRecordDetails(!showRecordDetails)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                        showRecordDetails ? 'bg-orange-500 text-white' : 'bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-300'
                      }`}
                    >
                      Show Details
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-navy-200 dark:border-navy-700">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Name</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Email</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Company</th>
                        {showRecordDetails && (
                          <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Issues</th>
                        )}
                        <th className="text-right py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-100 dark:divide-navy-700">
                      {MOCK_RECORDS.map((record) => (
                        <tr key={record.id} className="hover:bg-navy-50 dark:hover:bg-navy-900/50 transition-colors">
                          <td className="py-3 px-4">
                            <ValidationBadge status={record.status} />
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-medium text-navy-900 dark:text-white">{record.name}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm ${record.status === 'error' ? 'text-danger-500' : 'text-navy-600 dark:text-navy-400'}`}>
                              {record.email || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm ${record.status === 'warning' && !record.company ? 'text-warning-500 italic' : 'text-navy-600 dark:text-navy-400'}`}>
                              {record.company || 'Missing'}
                            </span>
                          </td>
                          {showRecordDetails && (
                            <td className="py-3 px-4">
                              {record.issues.length > 0 ? (
                                <span className="text-xs text-danger-500">{record.issues.join(', ')}</span>
                              ) : (
                                <span className="text-xs text-success-500">No issues</span>
                              )}
                            </td>
                          )}
                          <td className="py-3 px-4 text-right">
                            <button className="p-1.5 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors">
                              <Eye size={16} className="text-navy-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination placeholder */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-navy-100 dark:border-navy-700">
                  <p className="text-sm text-medium">Showing 5 of {selectedBatchData.totalRecords} records</p>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-300 rounded-lg hover:bg-navy-200 dark:hover:bg-navy-600 transition-colors">
                      Previous
                    </button>
                    <button className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-12 text-center">
              <Users size={64} className="mx-auto text-navy-300 mb-4" />
              <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">Select a Batch</h3>
              <p className="text-medium">Choose an import batch from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportManager;
