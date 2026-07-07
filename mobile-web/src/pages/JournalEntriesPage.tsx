import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createJournalEntry, listChartOfAccounts, listJournalEntries, type JournalEntryLineInput } from '../api/accounting';
import type { ChartOfAccount, JournalEntry } from '../types/models';

const emptyLine = (): JournalEntryLineInput => ({ account_id: 0, debit: 0, credit: 0 });

export function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalEntryLineInput[]>([emptyLine(), emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listJournalEntries().then((res) => setEntries(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listChartOfAccounts().then((res) => setAccounts(res.data));
  }, []);

  const totalDebit = useMemo(() => lines.reduce((s, l) => s + (Number(l.debit) || 0), 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((s, l) => s + (Number(l.credit) || 0), 0), [lines]);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.005;

  const updateLine = (index: number, patch: Partial<JournalEntryLineInput>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setShowForm(false);
    setEntryDate(new Date().toISOString().slice(0, 10));
    setReference('');
    setDescription('');
    setLines([emptyLine(), emptyLine()]);
    setError(null);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setError("L'écriture n'est pas équilibrée : le débit total doit être égal au crédit total.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createJournalEntry(
        entryDate,
        reference || undefined,
        description || undefined,
        lines.filter((l) => l.account_id > 0)
      );
      resetForm();
      load();
    } catch {
      setError("L'écriture a été rejetée par le serveur (débit ≠ crédit, ou compte invalide).");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Écritures comptables</h1>
        <button onClick={() => setShowForm(true)}>+ Écriture manuelle</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        entries.map((entry) => {
          const debit = entry.journal_entry_lines?.reduce((s, l) => s + Number(l.debit), 0) ?? 0;
          return (
            <div key={entry.id} className="stat-card" style={{ marginBottom: 12 }}>
              <div className="page-header" style={{ marginBottom: 8 }}>
                <div>
                  <strong>{entry.reference ?? `Écriture #${entry.id}`}</strong> — {entry.description}
                  <div className="text-muted">{new Date(entry.entry_date).toLocaleDateString()}</div>
                </div>
                <span className="badge">{debit.toFixed(2)}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Compte</th>
                    <th>Débit</th>
                    <th>Crédit</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.journal_entry_lines?.map((line) => (
                    <tr key={line.id}>
                      <td>{line.account?.code} — {line.account?.name}</td>
                      <td>{Number(line.debit) > 0 ? line.debit : ''}</td>
                      <td>{Number(line.credit) > 0 ? line.credit : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 560 }}>
            <h2>Nouvelle écriture manuelle</h2>
            <form onSubmit={handleCreate}>
              <label>
                Date
                <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
              </label>
              <label>
                Référence
                <input value={reference} onChange={(e) => setReference(e.target.value)} />
              </label>
              <label>
                Description
                <input value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>

              <h3>Lignes</h3>
              {lines.map((line, idx) => (
                <div className="item-row" key={idx}>
                  <label>
                    Compte
                    <select value={line.account_id} onChange={(e) => updateLine(idx, { account_id: Number(e.target.value) })}>
                      <option value={0}>--</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Débit
                    <input type="number" step="0.01" min="0" value={line.debit} onChange={(e) => updateLine(idx, { debit: Number(e.target.value), credit: 0 })} />
                  </label>
                  <label>
                    Crédit
                    <input type="number" step="0.01" min="0" value={line.credit} onChange={(e) => updateLine(idx, { credit: Number(e.target.value), debit: 0 })} />
                  </label>
                  <button type="button" className="secondary" onClick={() => removeLine(idx)}>×</button>
                </div>
              ))}
              <button type="button" className="secondary" onClick={addLine}>+ Ligne</button>

              <p style={{ marginTop: 12 }}>
                Total débit : <strong>{totalDebit.toFixed(2)}</strong> — Total crédit : <strong>{totalCredit.toFixed(2)}</strong>{' '}
                {isBalanced ? <span style={{ color: 'var(--success)' }}>(équilibrée)</span> : <span style={{ color: 'var(--danger)' }}>(déséquilibrée)</span>}
              </p>

              {error && <p className="error">{error}</p>}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" disabled={saving || !isBalanced}>{saving ? '...' : 'Enregistrer'}</button>
                <button type="button" className="secondary" onClick={resetForm}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
