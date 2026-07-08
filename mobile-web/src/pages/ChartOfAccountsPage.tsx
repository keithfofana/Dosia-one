import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { createChartOfAccount, deleteChartOfAccount, listChartOfAccounts, updateChartOfAccount } from '../api/accounting';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import type { ChartOfAccount } from '../types/models';

const typeLabels: Record<ChartOfAccount['type'], string> = {
  actif: 'Actif',
  passif: 'Passif',
  charge: 'Charge',
  produit: 'Produit',
  capitaux: 'Capitaux',
};

export function ChartOfAccountsPage() {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'comptabilite.update');
  const canDelete = hasPermission(user, 'comptabilite.delete');

  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ChartOfAccount | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<ChartOfAccount['type']>('actif');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listChartOfAccounts().then((res) => setAccounts(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setCode('');
    setName('');
    setType('actif');
    setShowForm(true);
  };

  const openEdit = (account: ChartOfAccount) => {
    setEditing(account);
    setFormError(null);
    setCode(account.code);
    setName(account.name);
    setType(account.type);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updateChartOfAccount(editing.id, { code, name, type });
      } else {
        await createChartOfAccount({ code, name, type });
      }
      setShowForm(false);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setFormError((message as string) ?? 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (account: ChartOfAccount) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setDeleteError(null);
    try {
      await deleteChartOfAccount(account.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setDeleteError((message as string) ?? 'Suppression impossible.');
    }
  };

  const grouped = accounts
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code))
    .reduce<Record<string, ChartOfAccount[]>>((acc, a) => {
      (acc[a.type] ??= []).push(a);
      return acc;
    }, {});

  return (
    <div>
      <div className="page-header">
        <h1>Plan comptable</h1>
        <button onClick={openCreate}>+ Nouveau compte</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        Object.entries(grouped).map(([type, accs]) => (
          <div key={type} style={{ marginBottom: 24 }}>
            <h2>{typeLabels[type as ChartOfAccount['type']]}</h2>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Intitulé</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {accs.map((a) => (
                  <tr key={a.id}>
                    <td>{a.code}</td>
                    <td>{a.name}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      {canUpdate && <button className="secondary" onClick={() => openEdit(a)}>Modifier</button>}
                      {canDelete && <button className="secondary" onClick={() => handleDelete(a)}>Supprimer</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Modifier le compte' : 'Nouveau compte'}</h2>
            {formError && <p className="error">{formError}</p>}
            <form onSubmit={handleSubmit}>
              <label>
                Code
                <input value={code} onChange={(e) => setCode(e.target.value)} required maxLength={20} />
              </label>
              <label>
                Intitulé
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Type
                <select value={type} onChange={(e) => setType(e.target.value as ChartOfAccount['type'])}>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
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
