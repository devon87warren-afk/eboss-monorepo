import { useCallback, useMemo } from 'react';
import { useAppContext } from '../../App';
import { UserRole } from '../../types';

interface RoleConfig {
  roles?: UserRole[];
}

export const useRoleAccess = () => {
  const { currentUser } = useAppContext();
  const currentRole = currentUser.role;

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    return roles.includes(currentRole);
  }, [currentRole]);

  const hasAccess = useCallback((config: RoleConfig): boolean => {
    if (!config.roles || config.roles.length === 0) return true;
    return config.roles.includes(currentRole);
  }, [currentRole]);

  const filterByRole = useCallback(<T extends RoleConfig>(items: T[]): T[] => {
    return items.filter(item => hasAccess(item));
  }, [hasAccess]);

  const isAdmin = useMemo(() => currentRole === UserRole.ADMIN, [currentRole]);
  const isManager = useMemo(() =>
    currentRole === UserRole.MANAGER || currentRole === UserRole.ADMIN,
    [currentRole]
  );
  const isTechnician = useMemo(() => currentRole === UserRole.TECH, [currentRole]);

  return {
    currentRole,
    hasRole,
    hasAccess,
    filterByRole,
    isAdmin,
    isManager,
    isTechnician
  };
};
