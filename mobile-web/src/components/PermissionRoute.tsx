import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

export function PermissionRoute({ permission, children }: { permission: string; children: ReactNode }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!hasPermission(user, permission)) {
    return (
      <div>
        <h1>{t('common.accessDenied')}</h1>
        <p>{t('common.accessDeniedMessage', { permission })}</p>
      </div>
    );
  }

  return <>{children}</>;
}
