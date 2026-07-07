import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

export function PermissionRoute({ permission, children }: { permission: string; children: ReactNode }) {
  const { user } = useAuth();

  if (!hasPermission(user, permission)) {
    return (
      <div>
        <h1>Accès refusé</h1>
        <p>Votre rôle ne dispose pas de la permission « {permission} » nécessaire pour accéder à cette page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
