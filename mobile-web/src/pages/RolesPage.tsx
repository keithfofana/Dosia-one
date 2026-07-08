import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { createRole, deleteRole, listPermissions, listRoles, updateRolePermissions } from '../api/roles';
import type { Permission, Role } from '../types/models';

export function RolesPage() {
  const { t } = useTranslation();
  const actionLabels: Record<string, string> = {
    view: t('common.view'),
    create: t('common.create'),
    update: t('common.edit'),
    delete: t('common.delete'),
  };

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const load = () => {
    setLoading(true);
    listRoles().then((res) => setRoles(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listPermissions().then(setPermissions);
  }, []);

  const permissionsByModule = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createRole(name, []);
      setShowCreate(false);
      setName('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setSelectedIds(new Set((role.permissions ?? []).map((p) => p.id)));
  };

  const togglePermission = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const savePermissions = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      await updateRolePermissions(editingRole.id, Array.from(selectedIds));
      setEditingRole(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(t('roles.confirmDelete', { name: role.name }))) return;
    await deleteRole(role.id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('roles.title')}</h1>
        <button onClick={() => setShowCreate(true)}>{t('roles.newRole')}</button>
      </div>

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('roles.permissions')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.permissions?.length ?? 0}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="secondary" onClick={() => openEdit(r)}>{t('roles.managePermissions')}</button>
                  <button className="secondary" onClick={() => handleDelete(r)}>{t('common.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('roles.newRoleModalTitle')}</h2>
            <form onSubmit={handleCreate}>
              <label>
                {t('common.name')}
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : t('common.create')}</button>
                <button type="button" className="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingRole && (
        <div className="modal-backdrop" onClick={() => setEditingRole(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <h2>{t('roles.permissionsModalTitle', { name: editingRole.name })}</h2>
            {Object.entries(permissionsByModule).map(([module, perms]) => (
              <div key={module} style={{ marginBottom: 12 }}>
                <strong>{t(`modules.${module}`, module)}</strong>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                  {perms.map((p) => (
                    <label key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, margin: 0 }}>
                      <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={selectedIds.has(p.id)}
                        onChange={() => togglePermission(p.id)}
                      />
                      {actionLabels[p.action] ?? p.action}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={savePermissions} disabled={saving}>{saving ? '...' : t('common.save')}</button>
              <button type="button" className="secondary" onClick={() => setEditingRole(null)}>{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
