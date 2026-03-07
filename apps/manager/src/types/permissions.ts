// Role and Permission Type Definitions for EnergyBoss

// Core permission actions
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'assign'
  | 'export'
  | 'manage';

// Resource types that can be protected
export type ResourceType =
  | 'tickets'
  | 'customers'
  | 'units'
  | 'imports'
  | 'expenses'
  | 'analytics'
  | 'territories'
  | 'users'
  | 'workflows'
  | 'reports'
  | 'settings';

// Permission definition
export interface Permission {
  resource: ResourceType;
  actions: PermissionAction[];
  scope?: 'own' | 'territory' | 'all'; // own = only their records, territory = their assigned territories, all = everything
}

// Role definitions
export type RoleId = 'admin' | 'manager' | 'supervisor' | 'technician' | 'support';

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  level: number; // Higher = more authority (admin=100, manager=80, supervisor=60, technician=40, support=20)
  permissions: Permission[];
  color: string;
  icon: string;
}

// Territory definition
export interface Territory {
  id: string;
  code: string; // e.g., 'CA', 'OR', 'WA'
  name: string;
  region: string; // e.g., 'West', 'Southwest'
  customerCount: number;
  activeTickets: number;
  status: 'active' | 'inactive';
  managerId?: string;
  createdAt: string;
  updatedAt: string;
}

// User-Territory assignment
export interface TerritoryAssignment {
  id: string;
  userId: string;
  territoryId: string;
  role: 'primary' | 'backup' | 'support'; // Primary owner, backup coverage, support only
  assignedAt: string;
  assignedBy: string;
  expiresAt?: string; // Optional expiration for temporary assignments
}

// Extended user type with permissions
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roleId: RoleId;
  status: 'active' | 'inactive' | 'pending';
  phone?: string;
  department?: string;
  hireDate?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  defaultTerritory?: string;
  timezone?: string;
}

// User with computed/joined data
export interface UserWithDetails extends User {
  role: Role;
  territories: TerritoryAssignment[];
  stats?: {
    openTickets: number;
    resolvedThisMonth: number;
    avgResponseTime: string;
  };
}

// Workflow status types
export type WorkflowStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'review'
  | 'approved'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

// Workflow item
export interface WorkflowItem {
  id: string;
  type: 'ticket' | 'import' | 'expense' | 'approval';
  title: string;
  description?: string;
  status: WorkflowStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  createdBy: string;
  territoryId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  history: WorkflowHistoryItem[];
}

export interface WorkflowHistoryItem {
  id: string;
  action: string;
  fromStatus?: WorkflowStatus;
  toStatus?: WorkflowStatus;
  userId: string;
  timestamp: string;
  notes?: string;
}

// Notification types
export type NotificationType =
  | 'assignment'
  | 'status_change'
  | 'mention'
  | 'approval_request'
  | 'approval_response'
  | 'deadline'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Activity log for real-time monitoring
export interface ActivityLogItem {
  id: string;
  userId: string;
  action: string;
  resourceType: ResourceType;
  resourceId: string;
  details?: string;
  territoryId?: string;
  timestamp: string;
}

// Predefined roles with permissions
export const ROLES: Record<RoleId, Role> = {
  admin: {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with user and configuration management',
    level: 100,
    color: '#ef476f',
    icon: 'Shield',
    permissions: [
      { resource: 'tickets', actions: ['create', 'read', 'update', 'delete', 'approve', 'assign', 'export', 'manage'], scope: 'all' },
      { resource: 'customers', actions: ['create', 'read', 'update', 'delete', 'export', 'manage'], scope: 'all' },
      { resource: 'units', actions: ['create', 'read', 'update', 'delete', 'export', 'manage'], scope: 'all' },
      { resource: 'imports', actions: ['create', 'read', 'update', 'delete', 'approve', 'manage'], scope: 'all' },
      { resource: 'expenses', actions: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage'], scope: 'all' },
      { resource: 'analytics', actions: ['read', 'export', 'manage'], scope: 'all' },
      { resource: 'territories', actions: ['create', 'read', 'update', 'delete', 'assign', 'manage'], scope: 'all' },
      { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'assign', 'manage'], scope: 'all' },
      { resource: 'workflows', actions: ['create', 'read', 'update', 'delete', 'approve', 'manage'], scope: 'all' },
      { resource: 'reports', actions: ['create', 'read', 'export', 'manage'], scope: 'all' },
      { resource: 'settings', actions: ['read', 'update', 'manage'], scope: 'all' },
    ],
  },
  manager: {
    id: 'manager',
    name: 'Regional Manager',
    description: 'Manage teams and territories within assigned regions',
    level: 80,
    color: '#ff6b35',
    icon: 'Users',
    permissions: [
      { resource: 'tickets', actions: ['create', 'read', 'update', 'approve', 'assign', 'export'], scope: 'territory' },
      { resource: 'customers', actions: ['create', 'read', 'update', 'export'], scope: 'territory' },
      { resource: 'units', actions: ['read', 'update', 'export'], scope: 'territory' },
      { resource: 'imports', actions: ['create', 'read', 'update', 'approve'], scope: 'territory' },
      { resource: 'expenses', actions: ['create', 'read', 'update', 'approve', 'export'], scope: 'territory' },
      { resource: 'analytics', actions: ['read', 'export'], scope: 'territory' },
      { resource: 'territories', actions: ['read', 'update'], scope: 'territory' },
      { resource: 'users', actions: ['read', 'assign'], scope: 'territory' },
      { resource: 'workflows', actions: ['read', 'update', 'approve'], scope: 'territory' },
      { resource: 'reports', actions: ['read', 'export'], scope: 'territory' },
    ],
  },
  supervisor: {
    id: 'supervisor',
    name: 'Team Supervisor',
    description: 'Oversee team operations and approve routine requests',
    level: 60,
    color: '#06d6a0',
    icon: 'UserCheck',
    permissions: [
      { resource: 'tickets', actions: ['create', 'read', 'update', 'assign'], scope: 'territory' },
      { resource: 'customers', actions: ['create', 'read', 'update'], scope: 'territory' },
      { resource: 'units', actions: ['read', 'update'], scope: 'territory' },
      { resource: 'imports', actions: ['create', 'read', 'update'], scope: 'territory' },
      { resource: 'expenses', actions: ['create', 'read', 'update', 'approve'], scope: 'territory' },
      { resource: 'analytics', actions: ['read'], scope: 'territory' },
      { resource: 'territories', actions: ['read'], scope: 'territory' },
      { resource: 'users', actions: ['read'], scope: 'territory' },
      { resource: 'workflows', actions: ['read', 'update'], scope: 'territory' },
      { resource: 'reports', actions: ['read'], scope: 'territory' },
    ],
  },
  technician: {
    id: 'technician',
    name: 'Field Technician',
    description: 'Handle tickets and customer interactions in assigned territories',
    level: 40,
    color: '#627d98',
    icon: 'Wrench',
    permissions: [
      { resource: 'tickets', actions: ['create', 'read', 'update'], scope: 'own' },
      { resource: 'customers', actions: ['read', 'update'], scope: 'territory' },
      { resource: 'units', actions: ['read', 'update'], scope: 'territory' },
      { resource: 'imports', actions: ['read'], scope: 'territory' },
      { resource: 'expenses', actions: ['create', 'read', 'update'], scope: 'own' },
      { resource: 'analytics', actions: ['read'], scope: 'own' },
      { resource: 'workflows', actions: ['read', 'update'], scope: 'own' },
    ],
  },
  support: {
    id: 'support',
    name: 'Support Staff',
    description: 'Handle customer inquiries and basic ticket management',
    level: 20,
    color: '#9ca3af',
    icon: 'Headphones',
    permissions: [
      { resource: 'tickets', actions: ['create', 'read'], scope: 'all' },
      { resource: 'customers', actions: ['read'], scope: 'all' },
      { resource: 'units', actions: ['read'], scope: 'all' },
      { resource: 'analytics', actions: ['read'], scope: 'own' },
    ],
  },
};

// Helper to check if a role has a specific permission
export function hasPermission(
  role: Role,
  resource: ResourceType,
  action: PermissionAction,
  scope?: 'own' | 'territory' | 'all'
): boolean {
  const permission = role.permissions.find(p => p.resource === resource);
  if (!permission) return false;
  if (!permission.actions.includes(action)) return false;

  // If scope is specified, check if the permission scope is sufficient
  if (scope) {
    const scopeLevel = { own: 1, territory: 2, all: 3 };
    const permissionScopeLevel = scopeLevel[permission.scope || 'own'];
    const requiredScopeLevel = scopeLevel[scope];
    return permissionScopeLevel >= requiredScopeLevel;
  }

  return true;
}

// Helper to get all permissions for a resource
export function getResourcePermissions(role: Role, resource: ResourceType): Permission | undefined {
  return role.permissions.find(p => p.resource === resource);
}

// Helper to check if user can manage another user based on role levels
export function canManageUser(managerRole: Role, targetRole: Role): boolean {
  return managerRole.level > targetRole.level;
}
