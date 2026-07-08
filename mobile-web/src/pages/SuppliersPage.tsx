import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier } from '../api/suppliers';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import type { Supplier } from '../types/models';

export function SuppliersPage() {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'achats.update');
  const canDelete = hasPermission(user, 'achats.delete');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listSuppliers().then((res) => setSuppliers(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setEmail('');
    setShowForm(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setName(supplier.name);
    setPhone(supplier.phone ?? '');
    setEmail(supplier.email ?? '');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateSupplier(editing.id, { name, phone: phone || null, email: email || null });
      } else {
        await createSupplier({ name, phone: phone || null, email: email || null });
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setDeleteError(null);
    try {
      await deleteSupplier(supplier.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setDeleteError((message as string) ?? 'Suppression impossible.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Fournisseurs</h1>
        <button onClick={openCreate}>+ Nouveau fournisseur</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.phone}</td>
                <td>{s.email}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {canUpdate && <button className="secondary" onClick={() => openEdit(s)}>Modifier</button>}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(s)}>Supprimer</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h2>
            <form onSubmit={handleSubmit}>
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
                <button type="submit" disabled={saving}>{saving ? '...' : editing ? 'Enregistrer' : 'Créer'}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
