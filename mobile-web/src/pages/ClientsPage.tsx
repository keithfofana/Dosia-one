import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { createClient, deleteClient, listClients, updateClient } from '../api/clients';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import type { Client } from '../types/models';

export function ClientsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'crm.update');
  const canDelete = hasPermission(user, 'crm.delete');

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<Client['type']>('particulier');
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listClients().then((res) => setClients(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setType('particulier');
    setShowForm(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setName(client.name);
    setPhone(client.phone ?? '');
    setType(client.type);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateClient(editing.id, { name, phone, type });
      } else {
        await createClient({ name, phone, type });
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setDeleteError(null);
    try {
      await deleteClient(client.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setDeleteError((message as string) ?? 'Suppression impossible.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('clients.title')}</h1>
        <button onClick={openCreate}>{t('clients.newClient')}</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('common.type')}</th>
              <th>{t('common.phone')}</th>
              <th>{t('clients.balance')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td><span className="badge">{t(`clients.type.${c.type}`)}</span></td>
                <td>{c.phone}</td>
                <td>{c.balance}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/clients/${c.id}`}>{t('common.view')}</Link>
                  {canUpdate && <button className="secondary" onClick={() => openEdit(c)}>{t('common.edit')}</button>}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(c)}>{t('common.delete')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? t('common.edit') : t('clients.newClientModalTitle')}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                {t('common.name')}
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                {t('common.type')}
                <select value={type} onChange={(e) => setType(e.target.value as Client['type'])}>
                  <option value="particulier">{t('clients.type.particulier')}</option>
                  <option value="detaillant">{t('clients.type.detaillant')}</option>
                  <option value="grossiste">{t('clients.type.grossiste')}</option>
                </select>
              </label>
              <label>
                {t('common.phone')}
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : editing ? t('common.save') : t('common.create')}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
