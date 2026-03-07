import React, { useState, useRef } from 'react';
import {
  Receipt,
  Upload,
  CreditCard,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Camera,
  FileText,
  Link2,
  RefreshCw,
  Filter,
  Search,
  Plus,
  MoreVertical,
  Calendar,
  MapPin,
  Building2,
  Car,
  Utensils,
  Plane,
  Hotel,
  ShoppingBag,
  ChevronRight,
  ChevronDown,
  Eye,
  Trash2,
  Edit2,
  Download,
  TrendingUp,
  Users,
  AlertCircle
} from 'lucide-react';

// Types
type ExpenseStatus = 'pending_receipt' | 'pending_match' | 'matched' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
type ExpenseCategory = 'travel' | 'meals' | 'mileage' | 'lodging' | 'supplies' | 'fuel' | 'other';
type ExpenseSource = 'concur' | 'corporate_card' | 'personal_card' | 'cash' | 'manual';

interface Expense {
  id: string;
  date: string;
  merchant: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  source: ExpenseSource;
  status: ExpenseStatus;
  receiptUrl?: string;
  territory?: string;
  project?: string;
  matchedTransactionId?: string;
  submittedBy: string;
  approver?: string;
  notes?: string;
}

interface CardTransaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  cardLast4: string;
  category?: ExpenseCategory;
  matched: boolean;
  matchedExpenseId?: string;
}

interface ReceiptUpload {
  id: string;
  fileName: string;
  uploadDate: string;
  status: 'processing' | 'ready' | 'matched' | 'error';
  extractedData?: {
    merchant?: string;
    amount?: number;
    date?: string;
  };
  matchedExpenseId?: string;
}

// Mock data
const MOCK_EXPENSES: Expense[] = [
  {
    id: 'EXP-001',
    date: '2024-01-08',
    merchant: 'United Airlines',
    description: 'Flight to Denver - Customer site visit',
    amount: 487.50,
    category: 'travel',
    source: 'corporate_card',
    status: 'approved',
    receiptUrl: '/receipts/exp001.pdf',
    territory: 'Colorado',
    project: 'Denver Energy Corp Onboarding',
    submittedBy: 'Tim Buffington',
    approver: 'Emily Watson'
  },
  {
    id: 'EXP-002',
    date: '2024-01-08',
    merchant: 'Marriott Denver',
    description: '2 nights lodging - Customer visit',
    amount: 328.00,
    category: 'lodging',
    source: 'corporate_card',
    status: 'submitted',
    receiptUrl: '/receipts/exp002.pdf',
    territory: 'Colorado',
    project: 'Denver Energy Corp Onboarding',
    submittedBy: 'Tim Buffington'
  },
  {
    id: 'EXP-003',
    date: '2024-01-07',
    merchant: 'Shell Gas Station',
    description: 'Fuel for territory travel',
    amount: 65.42,
    category: 'fuel',
    source: 'corporate_card',
    status: 'pending_receipt',
    territory: 'California',
    submittedBy: 'Sarah Chen'
  },
  {
    id: 'EXP-004',
    date: '2024-01-07',
    merchant: 'The Capital Grille',
    description: 'Client dinner - SolarTech California',
    amount: 187.30,
    category: 'meals',
    source: 'personal_card',
    status: 'pending_match',
    receiptUrl: '/receipts/exp004.jpg',
    territory: 'California',
    submittedBy: 'Tim Buffington',
    notes: 'Entertaining key decision makers'
  },
  {
    id: 'EXP-005',
    date: '2024-01-06',
    merchant: 'Office Depot',
    description: 'Printer cartridges and paper',
    amount: 124.99,
    category: 'supplies',
    source: 'corporate_card',
    status: 'matched',
    receiptUrl: '/receipts/exp005.pdf',
    submittedBy: 'Mike Rodriguez',
    matchedTransactionId: 'TXN-2024-0892'
  },
  {
    id: 'EXP-006',
    date: '2024-01-05',
    merchant: 'Mileage',
    description: '127 miles - Arizona territory visits',
    amount: 82.55,
    category: 'mileage',
    source: 'manual',
    status: 'reimbursed',
    territory: 'Arizona',
    submittedBy: 'Mike Rodriguez'
  }
];

const MOCK_TRANSACTIONS: CardTransaction[] = [
  { id: 'TXN-001', date: '2024-01-09', merchant: 'CHEVRON 12847', amount: 58.23, cardLast4: '4521', matched: false },
  { id: 'TXN-002', date: '2024-01-09', merchant: 'HILTON HOTELS', amount: 245.00, cardLast4: '4521', matched: false },
  { id: 'TXN-003', date: '2024-01-08', merchant: 'DELTA AIRLINES', amount: 342.00, cardLast4: '8834', matched: false },
  { id: 'TXN-004', date: '2024-01-08', merchant: 'UBER *TRIP', amount: 34.50, cardLast4: '4521', category: 'travel', matched: false },
  { id: 'TXN-005', date: '2024-01-07', merchant: 'STARBUCKS #9821', amount: 12.45, cardLast4: '4521', category: 'meals', matched: false },
];

const MOCK_RECEIPTS: ReceiptUpload[] = [
  { id: 'RCP-001', fileName: 'receipt_20240109_001.jpg', uploadDate: '2024-01-09T14:30:00Z', status: 'ready', extractedData: { merchant: 'Chevron', amount: 58.23, date: '2024-01-09' } },
  { id: 'RCP-002', fileName: 'hotel_invoice.pdf', uploadDate: '2024-01-09T10:15:00Z', status: 'processing' },
  { id: 'RCP-003', fileName: 'dinner_receipt.jpg', uploadDate: '2024-01-08T22:00:00Z', status: 'matched', matchedExpenseId: 'EXP-004' },
];

// Category icons
const getCategoryIcon = (category: ExpenseCategory) => {
  const icons: Record<ExpenseCategory, React.ReactNode> = {
    travel: <Plane size={16} />,
    meals: <Utensils size={16} />,
    mileage: <Car size={16} />,
    lodging: <Hotel size={16} />,
    supplies: <ShoppingBag size={16} />,
    fuel: <Car size={16} />,
    other: <Receipt size={16} />,
  };
  return icons[category];
};

// Status badge component
const StatusBadge: React.FC<{ status: ExpenseStatus }> = ({ status }) => {
  const configs: Record<ExpenseStatus, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    pending_receipt: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-600 dark:text-warning-500', label: 'Needs Receipt', icon: <Camera size={12} /> },
    pending_match: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', label: 'Pending Match', icon: <Link2 size={12} /> },
    matched: { bg: 'bg-navy-100 dark:bg-navy-700', text: 'text-navy-600 dark:text-navy-300', label: 'Matched', icon: <CheckCircle size={12} /> },
    submitted: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', label: 'Submitted', icon: <Clock size={12} /> },
    approved: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-600 dark:text-success-400', label: 'Approved', icon: <CheckCircle size={12} /> },
    rejected: { bg: 'bg-danger-100 dark:bg-danger-900/30', text: 'text-danger-600 dark:text-danger-400', label: 'Rejected', icon: <XCircle size={12} /> },
    reimbursed: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-600 dark:text-success-400', label: 'Reimbursed', icon: <DollarSign size={12} /> },
  };

  const config = configs[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// Source badge component
const SourceBadge: React.FC<{ source: ExpenseSource }> = ({ source }) => {
  const configs: Record<ExpenseSource, { bg: string; text: string; label: string }> = {
    concur: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'Concur' },
    corporate_card: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', label: 'Corp Card' },
    personal_card: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', label: 'Personal' },
    cash: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', label: 'Cash' },
    manual: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', label: 'Manual' },
  };

  const config = configs[source];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Stats card component
const StatsCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; label: string };
}> = ({ title, value, subtitle, icon, color, trend }) => (
  <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-5 border-l-3" style={{ borderLeftColor: color }}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-navy-600 dark:text-navy-300 mb-1">{title}</p>
        <p className="text-2xl font-bold text-navy-900 dark:text-white font-heading">{value}</p>
        {subtitle && <p className="text-xs text-medium mt-1">{subtitle}</p>}
      </div>
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <div style={{ color }}>{icon}</div>
      </div>
    </div>
    {trend && (
      <div className="flex items-center mt-3 pt-3 border-t border-navy-100 dark:border-navy-700">
        <TrendingUp size={14} className="text-success-500 mr-1" />
        <span className="text-sm text-success-500 font-medium">+{trend.value}%</span>
        <span className="text-xs text-medium ml-2">{trend.label}</span>
      </div>
    )}
  </div>
);

// Receipt upload dropzone
const ReceiptDropzone: React.FC<{ onUpload: (files: FileList) => void }> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
        isDragging
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
          : 'border-navy-300 dark:border-navy-600 hover:border-orange-500 hover:bg-navy-50 dark:hover:bg-navy-900'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && onUpload(e.target.files)}
        accept="image/*,.pdf"
        multiple
        className="hidden"
      />
      <div className="flex flex-col items-center">
        <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-navy-100 dark:bg-navy-700'}`}>
          <Upload size={32} className={isDragging ? 'text-orange-500' : 'text-navy-400'} />
        </div>
        <p className="font-medium text-navy-900 dark:text-white mb-1">
          Drop receipts here or click to upload
        </p>
        <p className="text-sm text-medium">
          Supports JPG, PNG, PDF up to 10MB
        </p>
        <div className="flex items-center gap-4 mt-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Camera size={16} />
            Take Photo
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-navy-100 dark:bg-navy-700 text-navy-700 dark:text-navy-300 rounded-lg text-sm font-medium hover:bg-navy-200 dark:hover:bg-navy-600 transition-colors">
            <FileText size={16} />
            Browse Files
          </button>
        </div>
      </div>
    </div>
  );
};

// Unmatched transaction card
const TransactionCard: React.FC<{ transaction: CardTransaction; onMatch: () => void }> = ({ transaction, onMatch }) => (
  <div className="flex items-center justify-between p-3 bg-navy-50 dark:bg-navy-900 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
        <CreditCard size={16} className="text-purple-600 dark:text-purple-400" />
      </div>
      <div>
        <p className="font-medium text-navy-900 dark:text-white text-sm">{transaction.merchant}</p>
        <p className="text-xs text-medium">****{transaction.cardLast4} • {new Date(transaction.date).toLocaleDateString()}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="font-bold text-navy-900 dark:text-white">${transaction.amount.toFixed(2)}</span>
      <button
        onClick={onMatch}
        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors"
      >
        Match
      </button>
    </div>
  </div>
);

// Receipt card
const ReceiptCard: React.FC<{ receipt: ReceiptUpload }> = ({ receipt }) => (
  <div className="flex items-center justify-between p-3 bg-navy-50 dark:bg-navy-900 rounded-lg">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${
        receipt.status === 'processing' ? 'bg-orange-100 dark:bg-orange-900/30' :
        receipt.status === 'ready' ? 'bg-success-100 dark:bg-success-900/30' :
        receipt.status === 'matched' ? 'bg-navy-100 dark:bg-navy-700' :
        'bg-danger-100 dark:bg-danger-900/30'
      }`}>
        <Receipt size={16} className={
          receipt.status === 'processing' ? 'text-orange-500' :
          receipt.status === 'ready' ? 'text-success-500' :
          receipt.status === 'matched' ? 'text-navy-500' :
          'text-danger-500'
        } />
      </div>
      <div>
        <p className="font-medium text-navy-900 dark:text-white text-sm truncate max-w-[150px]">{receipt.fileName}</p>
        {receipt.extractedData && (
          <p className="text-xs text-medium">
            {receipt.extractedData.merchant} • ${receipt.extractedData.amount?.toFixed(2)}
          </p>
        )}
        {receipt.status === 'processing' && (
          <p className="text-xs text-orange-500">Processing OCR...</p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {receipt.status === 'ready' && (
        <button className="p-1.5 hover:bg-navy-200 dark:hover:bg-navy-700 rounded transition-colors">
          <Link2 size={14} className="text-navy-400" />
        </button>
      )}
      <button className="p-1.5 hover:bg-navy-200 dark:hover:bg-navy-700 rounded transition-colors">
        <Eye size={14} className="text-navy-400" />
      </button>
    </div>
  </div>
);

// Main Expense Manager component
const ExpenseManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'match' | 'receipts' | 'reports'>('expenses');
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [showNewExpense, setShowNewExpense] = useState(false);

  // Calculate stats
  const stats = {
    pending: MOCK_EXPENSES.filter(e => ['pending_receipt', 'pending_match'].includes(e.status)).length,
    submitted: MOCK_EXPENSES.filter(e => e.status === 'submitted').length,
    approved: MOCK_EXPENSES.filter(e => e.status === 'approved').length,
    totalThisWeek: MOCK_EXPENSES.reduce((sum, e) => sum + e.amount, 0),
    unmatchedTransactions: MOCK_TRANSACTIONS.filter(t => !t.matched).length,
    pendingReceipts: MOCK_RECEIPTS.filter(r => r.status === 'ready').length,
  };

  const filteredExpenses = MOCK_EXPENSES.filter(expense => {
    if (filterStatus !== 'all' && expense.status !== filterStatus) return false;
    if (searchQuery && !expense.merchant.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !expense.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleReceiptUpload = (files: FileList) => {
    console.log('Uploading receipts:', files);
    // Would trigger OCR processing here
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white font-heading">
            Expense Manager
          </h1>
          <p className="text-medium">Track expenses, upload receipts, and manage reimbursements</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-navy-100 dark:bg-navy-700 text-navy-700 dark:text-navy-300 px-4 py-2.5 rounded-lg font-medium hover:bg-navy-200 dark:hover:bg-navy-600 transition-colors">
            <RefreshCw size={18} />
            Sync Concur
          </button>
          <button
            onClick={() => setShowNewExpense(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-card"
          >
            <Plus size={18} />
            New Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Pending Action"
          value={stats.pending.toString()}
          subtitle="Need receipts or matching"
          icon={<AlertTriangle size={24} />}
          color="#ffd23f"
        />
        <StatsCard
          title="Awaiting Approval"
          value={stats.submitted.toString()}
          subtitle="Submitted for review"
          icon={<Clock size={24} />}
          color="#ff6b35"
        />
        <StatsCard
          title="This Week"
          value={`$${stats.totalThisWeek.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle={`${MOCK_EXPENSES.length} expenses`}
          icon={<DollarSign size={24} />}
          color="#06d6a0"
        />
        <StatsCard
          title="Unmatched"
          value={stats.unmatchedTransactions.toString()}
          subtitle="Card transactions to match"
          icon={<CreditCard size={24} />}
          color="#627d98"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-navy-200 dark:border-navy-700">
        <nav className="flex gap-8">
          {[
            { id: 'expenses', label: 'All Expenses', count: MOCK_EXPENSES.length },
            { id: 'match', label: 'Match Transactions', count: stats.unmatchedTransactions },
            { id: 'receipts', label: 'Receipts', count: stats.pendingReceipts },
            { id: 'reports', label: 'Reports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-navy-500 hover:text-navy-700 dark:hover:text-navy-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                    : 'bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="pending_receipt">Needs Receipt</option>
                <option value="pending_match">Pending Match</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="reimbursed">Reimbursed</option>
              </select>
              <button className="p-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-lg hover:border-orange-500 transition-colors">
                <Filter size={18} className="text-navy-600 dark:text-navy-400" />
              </button>
            </div>
            {selectedExpenses.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-medium">{selectedExpenses.length} selected</span>
                <button className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
                  Submit for Approval
                </button>
              </div>
            )}
          </div>

          {/* Expenses Table */}
          <div className="bg-white dark:bg-navy-800 rounded-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-navy-300 dark:border-navy-600"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExpenses(filteredExpenses.map(exp => exp.id));
                          } else {
                            setSelectedExpenses([]);
                          }
                        }}
                      />
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Expense</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Category</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Source</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100 dark:divide-navy-700">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-navy-50 dark:hover:bg-navy-900/50 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExpenses([...selectedExpenses, expense.id]);
                            } else {
                              setSelectedExpenses(selectedExpenses.filter(id => id !== expense.id));
                            }
                          }}
                          className="rounded border-navy-300 dark:border-navy-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-navy-600 dark:text-navy-400">
                          {new Date(expense.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-navy-900 dark:text-white text-sm">{expense.merchant}</p>
                          <p className="text-xs text-medium truncate max-w-[250px]">{expense.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-navy-100 dark:bg-navy-700 rounded text-navy-600 dark:text-navy-400">
                            {getCategoryIcon(expense.category)}
                          </span>
                          <span className="text-sm text-navy-600 dark:text-navy-400 capitalize">{expense.category}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <SourceBadge source={expense.source} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-navy-900 dark:text-white">
                          ${expense.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={expense.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {expense.receiptUrl && (
                            <button className="p-1.5 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors" title="View Receipt">
                              <Receipt size={14} className="text-navy-400" />
                            </button>
                          )}
                          {expense.status === 'pending_receipt' && (
                            <button className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-colors" title="Add Receipt">
                              <Camera size={14} className="text-orange-500" />
                            </button>
                          )}
                          <button className="p-1.5 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors">
                            <MoreVertical size={14} className="text-navy-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 border-t border-navy-100 dark:border-navy-700 flex items-center justify-between">
              <p className="text-sm text-medium">Showing {filteredExpenses.length} expenses</p>
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
      )}

      {activeTab === 'match' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unmatched Transactions */}
          <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white font-heading">
                  Unmatched Card Transactions
                </h3>
                <p className="text-sm text-medium">Match with expenses or receipts</p>
              </div>
              <button className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
            <div className="space-y-3">
              {MOCK_TRANSACTIONS.filter(t => !t.matched).map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onMatch={() => console.log('Match transaction:', transaction.id)}
                />
              ))}
              {MOCK_TRANSACTIONS.filter(t => !t.matched).length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="mx-auto text-success-500 mb-3" />
                  <p className="font-medium text-navy-900 dark:text-white">All caught up!</p>
                  <p className="text-sm text-medium">No unmatched transactions</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Receipts */}
          <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white font-heading">
                  Pending Receipts
                </h3>
                <p className="text-sm text-medium">Match to expenses or transactions</p>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              {MOCK_RECEIPTS.filter(r => r.status !== 'matched').map((receipt) => (
                <ReceiptCard key={receipt.id} receipt={receipt} />
              ))}
            </div>
            <ReceiptDropzone onUpload={handleReceiptUpload} />
          </div>
        </div>
      )}

      {activeTab === 'receipts' && (
        <div className="space-y-6">
          <ReceiptDropzone onUpload={handleReceiptUpload} />

          <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white font-heading mb-4">
              Recent Uploads
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_RECEIPTS.map((receipt) => (
                <div key={receipt.id} className="border border-navy-200 dark:border-navy-700 rounded-lg p-4">
                  <div className="aspect-[4/3] bg-navy-100 dark:bg-navy-900 rounded-lg mb-3 flex items-center justify-center">
                    <Receipt size={48} className="text-navy-300" />
                  </div>
                  <p className="font-medium text-navy-900 dark:text-white text-sm truncate">{receipt.fileName}</p>
                  <p className="text-xs text-medium mb-2">{new Date(receipt.uploadDate).toLocaleString()}</p>
                  {receipt.extractedData && (
                    <div className="bg-navy-50 dark:bg-navy-900 rounded p-2 text-xs">
                      <p className="text-navy-600 dark:text-navy-400">{receipt.extractedData.merchant}</p>
                      <p className="font-bold text-navy-900 dark:text-white">${receipt.extractedData.amount?.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs font-medium ${
                      receipt.status === 'ready' ? 'text-success-500' :
                      receipt.status === 'processing' ? 'text-orange-500' :
                      receipt.status === 'matched' ? 'text-navy-500' :
                      'text-danger-500'
                    }`}>
                      {receipt.status === 'processing' ? 'Processing...' :
                       receipt.status === 'ready' ? 'Ready to match' :
                       receipt.status === 'matched' ? 'Matched' : 'Error'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded">
                        <Eye size={14} className="text-navy-400" />
                      </button>
                      <button className="p-1 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded">
                        <Trash2 size={14} className="text-danger-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white font-heading mb-4">
              Weekly Expense Summary
            </h3>
            <div className="space-y-4">
              {['Travel', 'Meals', 'Lodging', 'Fuel', 'Supplies', 'Other'].map((category, idx) => {
                const amount = Math.random() * 500 + 50;
                const percent = Math.random() * 100;
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-navy-600 dark:text-navy-400">{category}</span>
                      <span className="font-medium text-navy-900 dark:text-white">${amount.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-navy-100 dark:bg-navy-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-navy-100 dark:border-navy-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-navy-900 dark:text-white">Total This Week</span>
                <span className="text-2xl font-bold text-navy-900 dark:text-white">${stats.totalThisWeek.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
              <h3 className="font-semibold text-navy-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-navy-50 dark:bg-navy-900 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors text-left">
                  <Download size={18} className="text-orange-500" />
                  <span className="text-sm font-medium text-navy-900 dark:text-white">Export to CSV</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-navy-50 dark:bg-navy-900 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors text-left">
                  <FileText size={18} className="text-orange-500" />
                  <span className="text-sm font-medium text-navy-900 dark:text-white">Generate Report</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-navy-50 dark:bg-navy-900 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors text-left">
                  <Calendar size={18} className="text-orange-500" />
                  <span className="text-sm font-medium text-navy-900 dark:text-white">Weekly Reconciliation</span>
                </button>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-card p-6 border border-orange-200 dark:border-orange-800/30">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-200 mb-1">Weekly Deadline</p>
                  <p className="text-sm text-orange-800 dark:text-orange-300">
                    Submit all expenses by Friday 5PM for reimbursement processing.
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                    {stats.pending} expenses still need action
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;
