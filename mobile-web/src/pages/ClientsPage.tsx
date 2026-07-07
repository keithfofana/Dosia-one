import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createClient, listClients } from '../api/clients';
import type { Client } from '../types/models';

export function ClientsPage() {
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
        <h1>Clients</h1>
        <button onClick={() => setShowForm(true)}>+ Nouveau client</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Téléphone</th>
              <th>Solde</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td><span className="badge">{c.type}</span></td>
                <td>{c.phone}</td>
                <td>{c.balance}</td>
                <td><Link to={`/clients/${c.id}`}>Voir</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouveau client</h2>
            <form onSubmit={handleCreate}>
              <label>
                Nom
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Type
                <select value={type} onChange={(e) => setType(e.target.value as Client['type'])}>
                  <option value="particulier">Particulier</option>
                  <option value="detaillant">Détaillant</option>
                  <option value="grossiste">Grossiste</option>
                </select>
              </label>
              <label>
                Téléphone
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
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
