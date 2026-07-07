import { useEffect, useState, type FormEvent } from 'react';
import { createChartOfAccount, listChartOfAccounts } from '../api/accounting';
import type { ChartOfAccount } from '../types/models';

const typeLabels: Record<ChartOfAccount['type'], string> = {
  actif: 'Actif',
  passif: 'Passif',
  charge: 'Charge',
  produit: 'Produit',
  capitaux: 'Capitaux',
};

export function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<ChartOfAccount['type']>('actif');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listChartOfAccounts().then((res) => setAccounts(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createChartOfAccount({ code, name, type });
      setShowForm(false);
      setCode('');
      setName('');
      load();
    } finally {
      setSaving(false);
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
        <button onClick={() => setShowForm(true)}>+ Nouveau compte</button>
      </div>

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
                </tr>
              </thead>
              <tbody>
                {accs.map((a) => (
                  <tr key={a.id}>
                    <td>{a.code}</td>
                    <td>{a.name}</td>
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
            <h2>Nouveau compte</h2>
            <form onSubmit={handleCreate}>
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
