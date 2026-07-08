import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createClient, listClients } from '../api/clients';
import type { Client } from '../types/models';

export function ClientsPage() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<Client['type']>('particulier');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listClients().then((res) => setClients(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createClient({ name, phone, type });
      setShowForm(false);
      setName('');
      setPhone('');
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('clients.title')}</h1>
        <button onClick={() => setShowForm(true)}>{t('clients.newClient')}</button>
      </div>

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
                <td><Link to={`/clients/${c.id}`}>{t('common.view')}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('clients.newClientModalTitle')}</h2>
            <form onSubmit={handleCreate}>
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
