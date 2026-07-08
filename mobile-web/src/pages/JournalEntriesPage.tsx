import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createJournalEntry,
  deleteJournalEntry,
  listChartOfAccounts,
  listJournalEntries,
  updateJournalEntry,
  type JournalEntryLineInput,
} from '../api/accounting';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { extractErrorMessage } from '../utils/errors';
import type { ChartOfAccount, JournalEntry } from '../types/models';

const emptyLine = (): JournalEntryLineInput => ({ account_id: 0, debit: 0, credit: 0 });

export function JournalEntriesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'comptabilite.update');
  const canDelete = hasPermission(user, 'comptabilite.delete');

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalEntryLineInput[]>([emptyLine(), emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    setEditing(null);
    setEntryDate(new Date().toISOString().slice(0, 10));
    setReference('');
    setDescription('');
    setLines([emptyLine(), emptyLine()]);
    setError(null);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditing(entry);
    setEntryDate(entry.entry_date.slice(0, 10));
    setReference(entry.reference ?? '');
    setDescription(entry.description ?? '');
    setLines(
      (entry.journal_entry_lines ?? []).map((l) => ({
        account_id: l.account_id,
        debit: Number(l.debit),
        credit: Number(l.credit),
      })),
    );
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setError(t('journalEntries.notBalancedError'));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const filteredLines = lines.filter((l) => l.account_id > 0);
      if (editing) {
        await updateJournalEntry(editing.id, entryDate, reference || undefined, description || undefined, filteredLines);
      } else {
        await createJournalEntry(entryDate, reference || undefined, description || undefined, filteredLines);
      }
      resetForm();
      load();
    } catch (err) {
      setError(extractErrorMessage(err, t('journalEntries.rejectedError')));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: JournalEntry) => {
    if (!window.confirm(t('journalEntries.confirmDeleteEntry'))) return;
    setDeleteError(null);
    try {
      await deleteJournalEntry(entry.id);
      load();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, t('common.deleteError')));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('journalEntries.title')}</h1>
        <button onClick={() => setShowForm(true)}>{t('journalEntries.newEntry')}</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        entries.map((entry) => {
          const debit = entry.journal_entry_lines?.reduce((s, l) => s + Number(l.debit), 0) ?? 0;
          const isManual = entry.source === 'manuel';
          return (
            <div key={entry.id} className="stat-card" style={{ marginBottom: 12 }}>
              <div className="page-header" style={{ marginBottom: 8 }}>
                <div>
                  <strong>{entry.reference ?? t('journalEntries.entryNumber', { id: entry.id })}</strong> — {entry.description}
                  <div className="text-muted">
                    {new Date(entry.entry_date).toLocaleDateString()}
                    {!isManual && ` ${t('journalEntries.autoGenerated')}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge">{debit.toFixed(2)}</span>
                  {isManual && canUpdate && (
                    <button className="secondary" onClick={() => openEdit(entry)}>{t('common.edit')}</button>
                  )}
                  {isManual && canDelete && (
                    <button className="secondary" onClick={() => handleDelete(entry)}>{t('common.delete')}</button>
                  )}
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>{t('journalEntries.account')}</th>
                    <th>{t('journalEntries.debit')}</th>
                    <th>{t('journalEntries.credit')}</th>
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
            <h2>{editing ? t('common.edit') : t('journalEntries.newEntryModalTitle')}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                {t('common.date')}
                <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
              </label>
              <label>
                {t('journalEntries.reference')}
                <input value={reference} onChange={(e) => setReference(e.target.value)} />
              </label>
              <label>
                {t('journalEntries.description')}
                <input value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>

              <h3>{t('common.lines')}</h3>
              {lines.map((line, idx) => (
                <div className="item-row" key={idx}>
                  <label>
                    {t('journalEntries.account')}
                    <select value={line.account_id} onChange={(e) => updateLine(idx, { account_id: Number(e.target.value) })}>
                      <option value={0}>--</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t('journalEntries.debit')}
                    <input type="number" step="0.01" min="0" value={line.debit} onChange={(e) => updateLine(idx, { debit: Number(e.target.value), credit: 0 })} />
                  </label>
                  <label>
                    {t('journalEntries.credit')}
                    <input type="number" step="0.01" min="0" value={line.credit} onChange={(e) => updateLine(idx, { credit: Number(e.target.value), debit: 0 })} />
                  </label>
                  <button type="button" className="secondary" onClick={() => removeLine(idx)}>×</button>
                </div>
              ))}
              <button type="button" className="secondary" onClick={addLine}>{t('common.addLine')}</button>

              <p style={{ marginTop: 12 }}>
                {t('journalEntries.totalDebitCredit', { debit: totalDebit.toFixed(2), credit: totalCredit.toFixed(2) })}{' '}
                {isBalanced ? <span style={{ color: 'var(--success)' }}>{t('journalEntries.balanced')}</span> : <span style={{ color: 'var(--danger)' }}>{t('journalEntries.unbalanced')}</span>}
              </p>

              {error && <p className="error">{error}</p>}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" disabled={saving || !isBalanced}>{saving ? '...' : t('common.save')}</button>
                <button type="button" className="secondary" onClick={resetForm}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
