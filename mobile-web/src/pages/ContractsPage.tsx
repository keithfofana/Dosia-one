import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { createContract, deleteContract, listContracts, updateContract } from '../api/contracts';
import { listEmployees } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { extractErrorMessage } from '../utils/errors';
import type { Contract, Employee } from '../types/models';

const isExpiringSoon = (endDate: string | null) => {
  if (!endDate) return false;
  const days = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 30;
};

export function ContractsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'rh.update');
  const canDelete = hasPermission(user, 'rh.delete');

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listContracts().then((res) => setContracts(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listEmployees().then((res) => setEmployees(res.data));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setEmployeeId('');
    setType('');
    setStartDate('');
    setEndDate('');
    setShowForm(true);
  };

  const openEdit = (contract: Contract) => {
    setEditing(contract);
    setEmployeeId(contract.employee_id);
    setType(contract.type);
    setStartDate(contract.start_date.slice(0, 10));
    setEndDate(contract.end_date ? contract.end_date.slice(0, 10) : '');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setSaving(true);
    try {
      const payload = { employee_id: employeeId, type, start_date: startDate, end_date: endDate || null };
      if (editing) {
        await updateContract(editing.id, payload);
      } else {
        await createContract(payload);
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contract: Contract) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setDeleteError(null);
    try {
      await deleteContract(contract.id);
      load();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, t('common.deleteError')));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('contracts.title')}</h1>
        <button onClick={openCreate}>{t('contracts.newContract')}</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.employee')}</th>
              <th>{t('common.type')}</th>
              <th>{t('common.startDate')}</th>
              <th>{t('common.endDate')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id}>
                <td>{c.employee?.name}</td>
                <td>{c.type}</td>
                <td>{new Date(c.start_date).toLocaleDateString()}</td>
                <td>
                  {c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}
                  {isExpiringSoon(c.end_date) && <span className="badge" style={{ color: 'var(--danger)', marginLeft: 8 }}>{t('contracts.expiringSoon')}</span>}
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
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
            <h2>{editing ? t('common.edit') : t('contracts.newContractModalTitle')}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                {t('common.employee')}
                <select value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value))} required>
                  <option value="">{t('common.choose')}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </label>
              <label>
                {t('contracts.contractType')}
                <input value={type} onChange={(e) => setType(e.target.value)} placeholder={t('contracts.contractTypePlaceholder')} required />
              </label>
              <label>
                {t('common.startDate')}
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </label>
              <label>
                {t('contracts.endDateOptional')}
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
