import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import {
  Role,
  RoleId,
  ROLES,
  Permission,
  PermissionAction,
  ResourceType,
  hasPermission,
  canManageUser,
  Territory,
  TerritoryAssignment,
  User,
  UserWithDetails,
} from '../types/permissions';

// Mock data for territories
const MOCK_TERRITORIES: Territory[] = [
  { id: 'terr-ca', code: 'CA', name: 'California', region: 'West', customerCount: 312, activeTickets: 18, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'terr-or', code: 'OR', name: 'Oregon', region: 'West', customerCount: 98, activeTickets: 5, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'terr-wa', code: 'WA', name: 'Washington', region: 'West', customerCount: 127, activeTickets: 6, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'terr-nv', code: 'NV', name: 'Nevada', region: 'West', customerCount: 76, activeTickets: 3, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'terr-az', code: 'AZ', name: 'Arizona', region: 'Southwest', customerCount: 89, activeTickets: 4, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'terr-ut', code: 'UT', name: 'Utah', region: 'West', customerCount: 67, activeTickets: 2, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'terr-co', code: 'CO', name: 'Colorado', region: 'West', customerCount: 134, activeTickets: 7, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'terr-nm', code: 'NM', name: 'New Mexico', region: 'Southwest', customerCount: 52, activeTickets: 3, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'terr-id', code: 'ID', name: 'Idaho', region: 'West', customerCount: 45, activeTickets: 2, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'terr-mt', code: 'MT', name: 'Montana', region: 'West', customerCount: 38, activeTickets: 2, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'terr-wy', code: 'WY', name: 'Wyoming', region: 'West', customerCount: 29, activeTickets: 1, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'terr-hi', code: 'HI', name: 'Hawaii', region: 'Pacific', customerCount: 41, activeTickets: 1, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'terr-ak', code: 'AK', name: 'Alaska', region: 'Pacific', customerCount: 23, activeTickets: 1, status: 'active', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
];

// Mock users
const MOCK_USERS: User[] = [
  { id: 'user-1', email: 'admin@energyboss.com', name: 'System Admin', roleId: 'admin', status: 'active', department: 'IT', createdAt: '2023-01-01', updatedAt: '2024-01-01' },
  { id: 'user-2', email: 'tim.buffington@energyboss.com', name: 'Tim Buffington', roleId: 'manager', status: 'active', department: 'Operations', phone: '555-0102', createdAt: '2023-02-15', updatedAt: '2024-01-01' },
  { id: 'user-3', email: 'sarah.chen@energyboss.com', name: 'Sarah Chen', roleId: 'supervisor', status: 'active', department: 'Operations', phone: '555-0103', createdAt: '2023-03-10', updatedAt: '2024-01-01' },
  { id: 'user-4', email: 'mike.rodriguez@energyboss.com', name: 'Mike Rodriguez', roleId: 'technician', status: 'active', department: 'Field Services', phone: '555-0104', createdAt: '2023-04-20', updatedAt: '2024-01-01' },
  { id: 'user-5', email: 'emily.watson@energyboss.com', name: 'Emily Watson', roleId: 'manager', status: 'active', department: 'Operations', phone: '555-0105', createdAt: '2023-05-01', updatedAt: '2024-01-01' },
  { id: 'user-6', email: 'james.lee@energyboss.com', name: 'James Lee', roleId: 'technician', status: 'active', department: 'Field Services', phone: '555-0106', createdAt: '2023-06-15', updatedAt: '2024-01-01' },
  { id: 'user-7', email: 'anna.martinez@energyboss.com', name: 'Anna Martinez', roleId: 'support', status: 'active', department: 'Customer Service', phone: '555-0107', createdAt: '2023-07-20', updatedAt: '2024-01-01' },
  { id: 'user-8', email: 'david.kim@energyboss.com', name: 'David Kim', roleId: 'technician', status: 'inactive', department: 'Field Services', phone: '555-0108', createdAt: '2023-08-10', updatedAt: '2024-01-01' },
  { id: 'user-9', email: 'lisa.johnson@energyboss.com', name: 'Lisa Johnson', roleId: 'supervisor', status: 'active', department: 'Operations', phone: '555-0109', createdAt: '2023-09-05', updatedAt: '2024-01-01' },
  { id: 'user-10', email: 'chris.brown@energyboss.com', name: 'Chris Brown', roleId: 'technician', status: 'pending', department: 'Field Services', createdAt: '2024-01-05', updatedAt: '2024-01-05' },
];

// Mock territory assignments
const MOCK_ASSIGNMENTS: TerritoryAssignment[] = [
  { id: 'asgn-1', userId: 'user-2', territoryId: 'terr-ca', role: 'primary', assignedAt: '2023-02-15', assignedBy: 'user-1' },
  { id: 'asgn-2', userId: 'user-2', territoryId: 'terr-nv', role: 'primary', assignedAt: '2023-02-15', assignedBy: 'user-1' },
  { id: 'asgn-3', userId: 'user-3', territoryId: 'terr-ca', role: 'backup', assignedAt: '2023-03-10', assignedBy: 'user-2' },
  { id: 'asgn-4', userId: 'user-3', territoryId: 'terr-or', role: 'primary', assignedAt: '2023-03-10', assignedBy: 'user-1' },
  { id: 'asgn-5', userId: 'user-4', territoryId: 'terr-az', role: 'primary', assignedAt: '2023-04-20', assignedBy: 'user-2' },
  { id: 'asgn-6', userId: 'user-4', territoryId: 'terr-nm', role: 'backup', assignedAt: '2023-04-20', assignedBy: 'user-2' },
  { id: 'asgn-7', userId: 'user-5', territoryId: 'terr-wa', role: 'primary', assignedAt: '2023-05-01', assignedBy: 'user-1' },
  { id: 'asgn-8', userId: 'user-5', territoryId: 'terr-id', role: 'primary', assignedAt: '2023-05-01', assignedBy: 'user-1' },
  { id: 'asgn-9', userId: 'user-5', territoryId: 'terr-mt', role: 'primary', assignedAt: '2023-05-01', assignedBy: 'user-1' },
  { id: 'asgn-10', userId: 'user-6', territoryId: 'terr-co', role: 'primary', assignedAt: '2023-06-15', assignedBy: 'user-5' },
  { id: 'asgn-11', userId: 'user-6', territoryId: 'terr-ut', role: 'backup', assignedAt: '2023-06-15', assignedBy: 'user-5' },
  { id: 'asgn-12', userId: 'user-9', territoryId: 'terr-hi', role: 'primary', assignedAt: '2023-09-05', assignedBy: 'user-1' },
  { id: 'asgn-13', userId: 'user-9', territoryId: 'terr-ak', role: 'primary', assignedAt: '2023-09-05', assignedBy: 'user-1' },
];

interface PermissionContextType {
  // Current user info
  currentUser: UserWithDetails | null;
  currentRole: Role | null;

  // Permission checks
  can: (action: PermissionAction, resource: ResourceType) => boolean;
  canWithScope: (action: PermissionAction, resource: ResourceType, scope: 'own' | 'territory' | 'all') => boolean;
  canManage: (targetUserId: string) => boolean;
  canAccessTerritory: (territoryId: string) => boolean;

  // Role helpers
  getRole: (roleId: RoleId) => Role;
  getAllRoles: () => Role[];
  getRoleLevel: () => number;

  // Territory helpers
  getUserTerritories: () => Territory[];
  getAllTerritories: () => Territory[];
  getTerritoryById: (id: string) => Territory | undefined;

  // User helpers
  getAllUsers: () => User[];
  getUserById: (id: string) => User | undefined;
  getUsersInTerritory: (territoryId: string) => UserWithDetails[];
  getTerritoryAssignments: (userId: string) => TerritoryAssignment[];

  // Data management (for admin operations)
  assignUserToTerritory: (userId: string, territoryId: string, role: 'primary' | 'backup' | 'support') => void;
  removeUserFromTerritory: (userId: string, territoryId: string) => void;
  updateUserRole: (userId: string, roleId: RoleId) => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
  currentUserId?: string; // Override for testing, defaults to 'user-2' (Tim Buffington - Manager)
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({
  children,
  currentUserId = 'user-2'
}) => {
  // State would normally come from auth/API, using mock data for now
  const [users, setUsers] = React.useState<User[]>(MOCK_USERS);
  const [territories] = React.useState<Territory[]>(MOCK_TERRITORIES);
  const [assignments, setAssignments] = React.useState<TerritoryAssignment[]>(MOCK_ASSIGNMENTS);

  // Get current user with role and territory details
  const currentUser = useMemo((): UserWithDetails | null => {
    const user = users.find(u => u.id === currentUserId);
    if (!user) return null;

    return {
      ...user,
      role: ROLES[user.roleId],
      territories: assignments.filter(a => a.userId === currentUserId),
      stats: {
        openTickets: Math.floor(Math.random() * 20),
        resolvedThisMonth: Math.floor(Math.random() * 50) + 10,
        avgResponseTime: `${(Math.random() * 3 + 1).toFixed(1)}h`,
      },
    };
  }, [currentUserId, users, assignments]);

  const currentRole = currentUser?.role || null;

  // Permission check - basic
  const can = (action: PermissionAction, resource: ResourceType): boolean => {
    if (!currentRole) return false;
    return hasPermission(currentRole, resource, action);
  };

  // Permission check - with scope
  const canWithScope = (action: PermissionAction, resource: ResourceType, scope: 'own' | 'territory' | 'all'): boolean => {
    if (!currentRole) return false;
    return hasPermission(currentRole, resource, action, scope);
  };

  // Check if current user can manage target user
  const canManage = (targetUserId: string): boolean => {
    if (!currentRole || !currentUser) return false;
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return false;
    const targetRole = ROLES[targetUser.roleId];
    return canManageUser(currentRole, targetRole);
  };

  // Check if current user can access a territory
  const canAccessTerritory = (territoryId: string): boolean => {
    if (!currentUser) return false;
    // Admins can access all territories
    if (currentUser.roleId === 'admin') return true;
    // Check if user is assigned to territory
    return assignments.some(a => a.userId === currentUser.id && a.territoryId === territoryId);
  };

  // Role helpers
  const getRole = (roleId: RoleId): Role => ROLES[roleId];
  const getAllRoles = (): Role[] => Object.values(ROLES);
  const getRoleLevel = (): number => currentRole?.level || 0;

  // Territory helpers
  const getUserTerritories = (): Territory[] => {
    if (!currentUser) return [];
    if (currentUser.roleId === 'admin') return territories;
    const userTerritoryIds = assignments
      .filter(a => a.userId === currentUser.id)
      .map(a => a.territoryId);
    return territories.filter(t => userTerritoryIds.includes(t.id));
  };

  const getAllTerritories = (): Territory[] => territories;

  const getTerritoryById = (id: string): Territory | undefined => {
    return territories.find(t => t.id === id);
  };

  // User helpers
  const getAllUsers = (): User[] => users;

  const getUserById = (id: string): User | undefined => {
    return users.find(u => u.id === id);
  };

  const getUsersInTerritory = (territoryId: string): UserWithDetails[] => {
    const userIds = assignments
      .filter(a => a.territoryId === territoryId)
      .map(a => a.userId);

    return users
      .filter(u => userIds.includes(u.id))
      .map(u => ({
        ...u,
        role: ROLES[u.roleId],
        territories: assignments.filter(a => a.userId === u.id),
      }));
  };

  const getTerritoryAssignments = (userId: string): TerritoryAssignment[] => {
    return assignments.filter(a => a.userId === userId);
  };

  // Data management
  const assignUserToTerritory = (userId: string, territoryId: string, role: 'primary' | 'backup' | 'support') => {
    const newAssignment: TerritoryAssignment = {
      id: `asgn-${Date.now()}`,
      userId,
      territoryId,
      role,
      assignedAt: new Date().toISOString(),
      assignedBy: currentUser?.id || 'system',
    };
    setAssignments(prev => [...prev, newAssignment]);
  };

  const removeUserFromTerritory = (userId: string, territoryId: string) => {
    setAssignments(prev => prev.filter(a => !(a.userId === userId && a.territoryId === territoryId)));
  };

  const updateUserRole = (userId: string, roleId: RoleId) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, roleId, updatedAt: new Date().toISOString() } : u
    ));
  };

  const value: PermissionContextType = {
    currentUser,
    currentRole,
    can,
    canWithScope,
    canManage,
    canAccessTerritory,
    getRole,
    getAllRoles,
    getRoleLevel,
    getUserTerritories,
    getAllTerritories,
    getTerritoryById,
    getAllUsers,
    getUserById,
    getUsersInTerritory,
    getTerritoryAssignments,
    assignUserToTerritory,
    removeUserFromTerritory,
    updateUserRole,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// Hook to use permissions
export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// HOC for permission-protected components
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  resource: ResourceType,
  action: PermissionAction
): React.FC<P> {
  return function PermissionWrapper(props: P) {
    const { can } = usePermissions();

    if (!can(action, resource)) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">Access Denied</h3>
            <p className="text-medium">You don't have permission to access this resource.</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

// Component for conditional rendering based on permissions
export const PermissionGate: React.FC<{
  resource: ResourceType;
  action: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ resource, action, children, fallback = null }) => {
  const { can } = usePermissions();

  if (!can(action, resource)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
