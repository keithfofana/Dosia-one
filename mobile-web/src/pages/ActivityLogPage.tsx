import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listActivityLog, triggerBackup } from '../api/settings';
import { listUsers } from '../api/users';
import type { ActivityLogEntry, User } from '../types/models';

const modules = ['ventes', 'stock', 'achats', 'crm', 'comptabilite', 'tresorerie', 'rh', 'production', 'documents', 'parametres'];

export function ActivityLogPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | ''>('');
  const [module, setModule] = useState('');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  const load = () => {
    setLoading(true);
    listActivityLog({
      user_id: userId || undefined,
      module: module || undefined,
    })
      .then((res) => setLogs(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [userId, module]);
  useEffect(() => {
    listUsers().then((res) => setUsers(res.data));
  }, []);

  const handleBackup = async () => {
    setBackingUp(true);
    setBackupStatus(null);
    try {
      const blob = await triggerBackup();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.sql`;
      a.click();
      window.URL.revokeObjectURL(url);
      setBackupStatus(t('activityLog.backupDownloaded'));
    } catch {
      setBackupStatus(t('activityLog.backupFailed'));
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('activityLog.title')}</h1>
        <button onClick={handleBackup} disabled={backingUp}>{backingUp ? '...' : t('activityLog.backup')}</button>
      </div>
      {backupStatus && <p>{backupStatus}</p>}

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <label style={{ minWidth: 200 }}>
          {t('common.user')}
          <select value={userId} onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">{t('activityLog.allUsers')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </label>
        <label style={{ minWidth: 200 }}>
          {t('activityLog.module')}
          <select value={module} onChange={(e) => setModule(e.target.value)}>
            <option value="">{t('activityLog.allModules')}</option>
            {modules.map((m) => (
              <option key={m} value={m}>{t(`modules.${m}`, m)}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : logs.length === 0 ? (
        <p>{t('activityLog.noEntries')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.date')}</th>
              <th>{t('common.user')}</th>
              <th>{t('activityLog.module')}</th>
              <th>{t('activityLog.action')}</th>
              <th>{t('journalEntries.description')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td>{log.user?.name ?? '—'}</td>
                <td><span className="badge">{t(`modules.${log.module}`, log.module)}</span></td>
                <td>{log.action}</td>
                <td>{log.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
