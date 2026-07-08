import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { createUser, deleteUser, listUsers, setUserActive } from '../api/users';
import { listRoles } from '../api/roles';
import type { Role, User } from '../types/models';

export function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listUsers().then((res) => setUsers(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listRoles().then((res) => setRoles(res.data));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createUser({
        name,
        email: email || undefined,
        phone: phone || undefined,
        password,
        role_id: roleId || null,
      });
      setShowForm(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRoleId('');
      load();
    } catch {
      setError(t('users.createError'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: User) => {
    await setUserActive(user.id, !user.is_active);
    load();
  };

  const handleDelete = async (user: User) => {
    if (!confirm(t('users.confirmDelete', { name: user.name }))) return;
    await deleteUser(user.id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('users.title')}</h1>
        <button onClick={() => setShowForm(true)}>{t('users.newUser')}</button>
      </div>

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('common.email')}</th>
              <th>{t('common.phone')}</th>
              <th>{t('users.role')}</th>
              <th>{t('common.status')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td><span className="badge">{u.role?.name ?? '—'}</span></td>
                <td style={{ color: u.is_active ? 'var(--success)' : 'var(--danger)' }}>
                  {u.is_active ? t('users.active') : t('users.deactivated')}
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="secondary" onClick={() => toggleActive(u)}>
                    {u.is_active ? t('users.deactivate') : t('users.reactivate')}
                  </button>
                  <button className="secondary" onClick={() => handleDelete(u)}>{t('common.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('users.newUserModalTitle')}</h2>
            <form onSubmit={handleCreate}>
              <label>
                {t('common.name')}
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                {t('common.email')}
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label>
                {t('common.phone')}
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                {t('common.password')}
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </label>
              <label>
                {t('users.role')}
                <select value={roleId} onChange={(e) => setRoleId(Number(e.target.value))}>
                  <option value="">{t('users.noRole')}</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
              {error && <p className="error">{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : t('common.create')}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
