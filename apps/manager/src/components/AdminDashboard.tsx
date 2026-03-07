import React, { useState } from 'react';
import {
  Users,
  MapPin,
  Shield,
  Activity,
  Settings,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  UserPlus,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Mail,
  Phone,
  Calendar,
  Building2,
  Globe,
  UserCheck,
  Wrench,
  Headphones,
  Link2,
  Unlink,
  TrendingUp,
  Download
} from 'lucide-react';
import { usePermissions, PermissionGate } from '../contexts/PermissionContext';
import { RoleId, ROLES, User, Territory, TerritoryAssignment } from '../types/permissions';

// Role icon mapping
const getRoleIcon = (roleId: RoleId) => {
  const icons: Record<RoleId, React.ReactNode> = {
    admin: <Shield size={16} />,
    manager: <Users size={16} />,
    supervisor: <UserCheck size={16} />,
    technician: <Wrench size={16} />,
    support: <Headphones size={16} />,
  };
  return icons[roleId];
};

// Status badge component
const StatusBadge: React.FC<{ status: 'active' | 'inactive' | 'pending' }> = ({ status }) => {
  const configs = {
    active: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-600 dark:text-success-400', icon: <CheckCircle size={12} />, label: 'Active' },
    inactive: { bg: 'bg-navy-100 dark:bg-navy-700', text: 'text-navy-600 dark:text-navy-400', icon: <XCircle size={12} />, label: 'Inactive' },
    pending: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-600 dark:text-warning-500', icon: <Clock size={12} />, label: 'Pending' },
  };
  const config = configs[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// Role badge component
const RoleBadge: React.FC<{ roleId: RoleId }> = ({ roleId }) => {
  const role = ROLES[roleId];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${role.color}20`, color: role.color }}
    >
      {getRoleIcon(roleId)}
      {role.name}
    </span>
  );
};

// Stats card
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
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
  </div>
);

// User row component
const UserRow: React.FC<{
  user: User;
  assignments: TerritoryAssignment[];
  territories: Territory[];
  onEdit: () => void;
  onManageTerritories: () => void;
}> = ({ user, assignments, territories, onEdit, onManageTerritories }) => {
  const { canManage } = usePermissions();
  const canEditUser = canManage(user.id);
  const userTerritories = assignments
    .filter(a => a.userId === user.id)
    .map(a => territories.find(t => t.id === a.territoryId))
    .filter(Boolean) as Territory[];

  return (
    <tr className="hover:bg-navy-50 dark:hover:bg-navy-900/50 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: ROLES[user.roleId].color }}
          >
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-navy-900 dark:text-white">{user.name}</p>
            <p className="text-xs text-medium">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <RoleBadge roleId={user.roleId} />
      </td>
      <td className="py-4 px-4">
        <StatusBadge status={user.status} />
      </td>
      <td className="py-4 px-4">
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {userTerritories.slice(0, 3).map(t => (
            <span key={t.id} className="px-2 py-0.5 bg-navy-100 dark:bg-navy-700 rounded text-xs text-navy-600 dark:text-navy-400">
              {t.code}
            </span>
          ))}
          {userTerritories.length > 3 && (
            <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 rounded text-xs text-orange-600 dark:text-orange-400">
              +{userTerritories.length - 3}
            </span>
          )}
          {userTerritories.length === 0 && (
            <span className="text-xs text-medium italic">No territories</span>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-navy-600 dark:text-navy-400">{user.department || '—'}</span>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-navy-600 dark:text-navy-400">
          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
        </span>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {canEditUser && (
            <>
              <button
                onClick={onManageTerritories}
                className="p-1.5 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors"
                title="Manage Territories"
              >
                <MapPin size={14} className="text-navy-400" />
              </button>
              <button
                onClick={onEdit}
                className="p-1.5 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors"
                title="Edit User"
              >
                <Edit2 size={14} className="text-navy-400" />
              </button>
            </>
          )}
          <button className="p-1.5 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors">
            <MoreVertical size={14} className="text-navy-400" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Territory row component
const TerritoryRow: React.FC<{
  territory: Territory;
  assignedUsers: { user: User; role: 'primary' | 'backup' | 'support' }[];
  onEdit: () => void;
  onManageUsers: () => void;
}> = ({ territory, assignedUsers, onEdit, onManageUsers }) => (
  <tr className="hover:bg-navy-50 dark:hover:bg-navy-900/50 transition-colors">
    <td className="py-4 px-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{territory.code}</span>
        </div>
        <div>
          <p className="font-medium text-navy-900 dark:text-white">{territory.name}</p>
          <p className="text-xs text-medium">{territory.region} Region</p>
        </div>
      </div>
    </td>
    <td className="py-4 px-4">
      <span className="font-medium text-navy-900 dark:text-white">{territory.customerCount}</span>
    </td>
    <td className="py-4 px-4">
      <div className="flex items-center gap-2">
        <span className={`font-medium ${territory.activeTickets > 10 ? 'text-danger-500' : 'text-navy-900 dark:text-white'}`}>
          {territory.activeTickets}
        </span>
        {territory.activeTickets > 10 && <AlertTriangle size={14} className="text-danger-500" />}
      </div>
    </td>
    <td className="py-4 px-4">
      <div className="flex -space-x-2">
        {assignedUsers.slice(0, 4).map(({ user, role }) => (
          <div
            key={user.id}
            className="w-8 h-8 rounded-full border-2 border-white dark:border-navy-800 flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: ROLES[user.roleId].color }}
            title={`${user.name} (${role})`}
          >
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        ))}
        {assignedUsers.length > 4 && (
          <div className="w-8 h-8 rounded-full border-2 border-white dark:border-navy-800 bg-navy-500 flex items-center justify-center text-white text-xs font-bold">
            +{assignedUsers.length - 4}
          </div>
        )}
        {assignedUsers.length === 0 && (
          <span className="text-xs text-medium italic">No users assigned</span>
        )}
      </div>
    </td>
    <td className="py-4 px-4">
      <StatusBadge status={territory.status} />
    </td>
    <td className="py-4 px-4 text-right">
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={onManageUsers}
          className="p-1.5 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors"
          title="Manage Users"
        >
          <Users size={14} className="text-navy-400" />
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors"
          title="Edit Territory"
        >
          <Edit2 size={14} className="text-navy-400" />
        </button>
        <button className="p-1.5 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors">
          <MoreVertical size={14} className="text-navy-400" />
        </button>
      </div>
    </td>
  </tr>
);

// Territory assignment modal component
const TerritoryAssignmentModal: React.FC<{
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  userAssignments: TerritoryAssignment[];
  allTerritories: Territory[];
  onAssign: (territoryId: string, role: 'primary' | 'backup' | 'support') => void;
  onRemove: (territoryId: string) => void;
}> = ({ user, isOpen, onClose, userAssignments, allTerritories, onAssign, onRemove }) => {
  const [selectedTerritory, setSelectedTerritory] = useState('');
  const [assignmentRole, setAssignmentRole] = useState<'primary' | 'backup' | 'support'>('primary');

  if (!isOpen || !user) return null;

  const assignedTerritoryIds = userAssignments.map(a => a.territoryId);
  const availableTerritories = allTerritories.filter(t => !assignedTerritoryIds.includes(t.id));

  const handleAssign = () => {
    if (selectedTerritory) {
      onAssign(selectedTerritory, assignmentRole);
      setSelectedTerritory('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-navy-800 rounded-card shadow-lift w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-navy-100 dark:border-navy-700">
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white font-heading">
            Manage Territory Assignments
          </h3>
          <p className="text-sm text-medium mt-1">Assign {user.name} to territories</p>
        </div>

        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Current Assignments */}
          <div>
            <h4 className="text-sm font-semibold text-navy-900 dark:text-white mb-3">Current Assignments</h4>
            {userAssignments.length === 0 ? (
              <p className="text-sm text-medium italic">No territories assigned</p>
            ) : (
              <div className="space-y-2">
                {userAssignments.map(assignment => {
                  const territory = allTerritories.find(t => t.id === assignment.territoryId);
                  if (!territory) return null;
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-navy-50 dark:bg-navy-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded text-sm font-bold text-orange-600 dark:text-orange-400">
                          {territory.code}
                        </span>
                        <div>
                          <p className="font-medium text-navy-900 dark:text-white text-sm">{territory.name}</p>
                          <p className="text-xs text-medium capitalize">{assignment.role} assignment</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemove(assignment.territoryId)}
                        className="p-1.5 hover:bg-danger-100 dark:hover:bg-danger-900/30 rounded transition-colors"
                      >
                        <Unlink size={14} className="text-danger-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Assignment */}
          {availableTerritories.length > 0 && (
            <div className="pt-4 border-t border-navy-100 dark:border-navy-700">
              <h4 className="text-sm font-semibold text-navy-900 dark:text-white mb-3">Add Assignment</h4>
              <div className="flex gap-3">
                <select
                  value={selectedTerritory}
                  onChange={(e) => setSelectedTerritory(e.target.value)}
                  className="flex-1 px-3 py-2 bg-navy-50 dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="">Select territory...</option>
                  {availableTerritories.map(t => (
                    <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                  ))}
                </select>
                <select
                  value={assignmentRole}
                  onChange={(e) => setAssignmentRole(e.target.value as any)}
                  className="px-3 py-2 bg-navy-50 dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="primary">Primary</option>
                  <option value="backup">Backup</option>
                  <option value="support">Support</option>
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!selectedTerritory}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Link2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-navy-50 dark:bg-navy-900 border-t border-navy-100 dark:border-navy-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-navy-200 dark:bg-navy-700 text-navy-700 dark:text-navy-300 rounded-lg text-sm font-medium hover:bg-navy-300 dark:hover:bg-navy-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Admin Dashboard component
const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'territories' | 'roles' | 'activity'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<RoleId | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'pending' | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  const {
    currentUser,
    getAllUsers,
    getAllTerritories,
    getTerritoryAssignments,
    getUsersInTerritory,
    assignUserToTerritory,
    removeUserFromTerritory,
    can,
  } = usePermissions();

  const users = getAllUsers();
  const territories = getAllTerritories();

  // Filter users
  const filteredUsers = users.filter(user => {
    if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !user.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterRole !== 'all' && user.roleId !== filterRole) return false;
    if (filterStatus !== 'all' && user.status !== filterStatus) return false;
    return true;
  });

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalTerritories: territories.length,
    activeTerritories: territories.filter(t => t.status === 'active').length,
  };

  const handleManageTerritories = (user: User) => {
    setSelectedUser(user);
    setShowAssignmentModal(true);
  };

  const handleAssignTerritory = (territoryId: string, role: 'primary' | 'backup' | 'support') => {
    if (selectedUser) {
      assignUserToTerritory(selectedUser.id, territoryId, role);
    }
  };

  const handleRemoveTerritory = (territoryId: string) => {
    if (selectedUser) {
      removeUserFromTerritory(selectedUser.id, territoryId);
    }
  };

  return (
    <PermissionGate resource="users" action="read" fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-danger-500 mb-4" />
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">Access Restricted</h3>
          <p className="text-medium">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    }>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white font-heading">
              Admin Dashboard
            </h1>
            <p className="text-medium">Manage users, territories, and system configuration</p>
          </div>
          <PermissionGate resource="users" action="create">
            <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-card">
              <UserPlus size={18} />
              Add User
            </button>
          </PermissionGate>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            subtitle={`${stats.activeUsers} active`}
            icon={<Users size={24} />}
            color="#ff6b35"
          />
          <StatsCard
            title="Territories"
            value={stats.totalTerritories}
            subtitle={`${stats.activeTerritories} active`}
            icon={<MapPin size={24} />}
            color="#06d6a0"
          />
          <StatsCard
            title="Role Types"
            value={Object.keys(ROLES).length}
            subtitle="Defined roles"
            icon={<Shield size={24} />}
            color="#627d98"
          />
          <StatsCard
            title="Online Now"
            value={Math.floor(stats.activeUsers * 0.6)}
            subtitle="Currently active"
            icon={<Activity size={24} />}
            color="#ef476f"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-navy-200 dark:border-navy-700">
          <nav className="flex gap-8">
            {[
              { id: 'users', label: 'Users', icon: <Users size={16} />, count: users.length },
              { id: 'territories', label: 'Territories', icon: <MapPin size={16} />, count: territories.length },
              { id: 'roles', label: 'Roles & Permissions', icon: <Shield size={16} /> },
              { id: 'activity', label: 'Activity Log', icon: <Activity size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-navy-500 hover:text-navy-700 dark:hover:text-navy-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
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
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Roles</option>
                {Object.values(ROLES).map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-navy-100 dark:bg-navy-700 text-navy-700 dark:text-navy-300 rounded-lg text-sm font-medium hover:bg-navy-200 dark:hover:bg-navy-600 transition-colors">
                <Download size={16} />
                Export
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-navy-800 rounded-card shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">User</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Role</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Territories</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Department</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Last Login</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100 dark:divide-navy-700">
                    {filteredUsers.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        assignments={getTerritoryAssignments(user.id)}
                        territories={territories}
                        onEdit={() => console.log('Edit user:', user.id)}
                        onManageTerritories={() => handleManageTerritories(user)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="p-8 text-center">
                  <Users size={48} className="mx-auto text-navy-300 mb-4" />
                  <p className="text-navy-600 dark:text-navy-400">No users found</p>
                  <p className="text-sm text-medium">Try adjusting your search or filters</p>
                </div>
              )}

              <div className="p-4 border-t border-navy-100 dark:border-navy-700 flex items-center justify-between">
                <p className="text-sm text-medium">Showing {filteredUsers.length} of {users.length} users</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'territories' && (
          <div className="space-y-4">
            {/* Territories Table */}
            <div className="bg-white dark:bg-navy-800 rounded-card shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Territory</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Customers</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Active Tickets</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Assigned Users</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100 dark:divide-navy-700">
                    {territories.map((territory) => {
                      const assignedUsers = getUsersInTerritory(territory.id).map(u => ({
                        user: u,
                        role: getTerritoryAssignments(u.id).find(a => a.territoryId === territory.id)?.role || 'support' as const
                      }));
                      return (
                        <TerritoryRow
                          key={territory.id}
                          territory={territory}
                          assignedUsers={assignedUsers}
                          onEdit={() => console.log('Edit territory:', territory.id)}
                          onManageUsers={() => console.log('Manage users for:', territory.id)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(ROLES).map((role) => (
              <div key={role.id} className="bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${role.color}20` }}
                  >
                    <span style={{ color: role.color }}>{getRoleIcon(role.id)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900 dark:text-white">{role.name}</h3>
                    <p className="text-xs text-medium">Level {role.level}</p>
                  </div>
                </div>
                <p className="text-sm text-navy-600 dark:text-navy-400 mb-4">{role.description}</p>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 5).map((perm) => (
                      <span
                        key={perm.resource}
                        className="px-2 py-0.5 bg-navy-100 dark:bg-navy-700 rounded text-xs text-navy-600 dark:text-navy-400"
                      >
                        {perm.resource}
                      </span>
                    ))}
                    {role.permissions.length > 5 && (
                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 rounded text-xs text-orange-600 dark:text-orange-400">
                        +{role.permissions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-navy-100 dark:border-navy-700">
                  <p className="text-xs text-medium">
                    {users.filter(u => u.roleId === role.id).length} users with this role
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
            <p className="text-center text-medium py-12">
              Activity log coming soon...
            </p>
          </div>
        )}

        {/* Territory Assignment Modal */}
        <TerritoryAssignmentModal
          user={selectedUser}
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedUser(null);
          }}
          userAssignments={selectedUser ? getTerritoryAssignments(selectedUser.id) : []}
          allTerritories={territories}
          onAssign={handleAssignTerritory}
          onRemove={handleRemoveTerritory}
        />
      </div>
    </PermissionGate>
  );
};

export default AdminDashboard;
