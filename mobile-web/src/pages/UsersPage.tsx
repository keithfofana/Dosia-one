import { useEffect, useState, type FormEvent } from 'react';
import { createUser, deleteUser, listUsers, setUserActive } from '../api/users';
import { listRoles } from '../api/roles';
import type { Role, User } from '../types/models';

export function UsersPage() {
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
      setError('Impossible de créer cet utilisateur (email/téléphone déjà utilisé ?).');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: User) => {
    await setUserActive(user.id, !user.is_active);
    load();
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Supprimer définitivement « ${user.name} » ?`)) return;
    await deleteUser(user.id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Utilisateurs</h1>
        <button onClick={() => setShowForm(true)}>+ Nouvel utilisateur</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Rôle</th>
              <th>Statut</th>
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
                  {u.is_active ? 'Actif' : 'Désactivé'}
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="secondary" onClick={() => toggleActive(u)}>
                    {u.is_active ? 'Désactiver' : 'Réactiver'}
                  </button>
                  <button className="secondary" onClick={() => handleDelete(u)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouvel utilisateur</h2>
            <form onSubmit={handleCreate}>
              <label>
                Nom
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label>
                Téléphone
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                Mot de passe
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </label>
              <label>
                Rôle
                <select value={roleId} onChange={(e) => setRoleId(Number(e.target.value))}>
                  <option value="">-- Aucun --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
              {error && <p className="error">{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : 'Créer'}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
