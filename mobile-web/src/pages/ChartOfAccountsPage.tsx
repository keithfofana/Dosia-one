import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { createChartOfAccount, deleteChartOfAccount, listChartOfAccounts, updateChartOfAccount } from '../api/accounting';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { extractErrorMessage } from '../utils/errors';
import type { ChartOfAccount } from '../types/models';

export function ChartOfAccountsPage() {
  const { t } = useTranslation();
  const typeLabels: Record<ChartOfAccount['type'], string> = {
    actif: t('chartOfAccounts.type.actif'),
    passif: t('chartOfAccounts.type.passif'),
    charge: t('chartOfAccounts.type.charge'),
    produit: t('chartOfAccounts.type.produit'),
    capitaux: t('chartOfAccounts.type.capitaux'),
  };

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
      setFormError(extractErrorMessage(err, t('common.saveError')));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (account: ChartOfAccount) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setDeleteError(null);
    try {
      await deleteChartOfAccount(account.id);
      load();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, t('common.deleteError')));
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
        <h1>{t('chartOfAccounts.title')}</h1>
        <button onClick={openCreate}>{t('chartOfAccounts.newAccount')}</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        Object.entries(grouped).map(([type, accs]) => (
          <div key={type} style={{ marginBottom: 24 }}>
            <h2>{typeLabels[type as ChartOfAccount['type']]}</h2>
            <table>
              <thead>
                <tr>
                  <th>{t('chartOfAccounts.code')}</th>
                  <th>{t('chartOfAccounts.label')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {accs.map((a) => (
                  <tr key={a.id}>
                    <td>{a.code}</td>
                    <td>{a.name}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      {canUpdate && <button className="secondary" onClick={() => openEdit(a)}>{t('common.edit')}</button>}
                      {canDelete && <button className="secondary" onClick={() => handleDelete(a)}>{t('common.delete')}</button>}
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
            <h2>{editing ? t('common.edit') : t('chartOfAccounts.newAccountModalTitle')}</h2>
            {formError && <p className="error">{formError}</p>}
            <form onSubmit={handleSubmit}>
              <label>
                {t('chartOfAccounts.code')}
                <input value={code} onChange={(e) => setCode(e.target.value)} required maxLength={20} />
              </label>
              <label>
                {t('chartOfAccounts.label')}
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                {t('common.type')}
                <select value={type} onChange={(e) => setType(e.target.value as ChartOfAccount['type'])}>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
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
