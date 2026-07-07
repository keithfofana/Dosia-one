import { useEffect, useState, type FormEvent } from 'react';
import { createSupplier, listSuppliers } from '../api/suppliers';
import type { Supplier } from '../types/models';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listSuppliers().then((res) => setSuppliers(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createSupplier({ name, phone: phone || null, email: email || null });
      setShowForm(false);
      setName('');
      setPhone('');
      setEmail('');
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Fournisseurs</h1>
        <button onClick={() => setShowForm(true)}>+ Nouveau fournisseur</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.phone}</td>
                <td>{s.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouveau fournisseur</h2>
            <form onSubmit={handleCreate}>
              <label>
                Nom
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Téléphone
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
