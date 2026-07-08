import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { createLeave, deleteLeave, listLeaves, updateLeave, updateLeaveStatus } from '../api/leaves';
import { listEmployees } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { extractErrorMessage } from '../utils/errors';
import type { Employee, Leave } from '../types/models';

const statusColor = (status: Leave['status']) => {
  if (status === 'approuve') return 'var(--success)';
  if (status === 'refuse') return 'var(--danger)';
  return undefined;
};

export function LeavesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'rh.update');
  const canDelete = hasPermission(user, 'rh.delete');

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Leave | null>(null);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listLeaves().then((res) => setLeaves(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listEmployees().then((res) => setEmployees(res.data));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setEmployeeId('');
    setStartDate('');
    setEndDate('');
    setShowForm(true);
  };

  const openEdit = (leave: Leave) => {
    setEditing(leave);
    setEmployeeId(leave.employee_id);
    setStartDate(leave.start_date.slice(0, 10));
    setEndDate(leave.end_date.slice(0, 10));
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setSaving(true);
    try {
      if (editing) {
        await updateLeave(editing.id, { employee_id: employeeId, start_date: startDate, end_date: endDate });
      } else {
        await createLeave({ employee_id: employeeId, start_date: startDate, end_date: endDate });
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (leave: Leave, status: Leave['status']) => {
    await updateLeaveStatus(leave.id, status);
    load();
  };

  const handleDelete = async (leave: Leave) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setDeleteError(null);
    try {
      await deleteLeave(leave.id);
      load();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, t('common.deleteError')));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('leaves.title')}</h1>
        <button onClick={openCreate}>{t('leaves.newLeaveRequest')}</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.employee')}</th>
              <th>{t('common.startDate')}</th>
              <th>{t('common.endDate')}</th>
              <th>{t('common.status')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l.id}>
                <td>{l.employee?.name}</td>
                <td>{new Date(l.start_date).toLocaleDateString()}</td>
                <td>{new Date(l.end_date).toLocaleDateString()}</td>
                <td><span className="badge" style={{ color: statusColor(l.status) }}>{t(`leaves.status.${l.status}`)}</span></td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {l.status === 'en_attente' && (
                    <>
                      <button className="secondary" onClick={() => handleStatus(l, 'approuve')}>{t('leaves.approve')}</button>
                      <button className="secondary" onClick={() => handleStatus(l, 'refuse')}>{t('leaves.reject')}</button>
                    </>
                  )}
                  {canUpdate && <button className="secondary" onClick={() => openEdit(l)}>{t('common.edit')}</button>}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(l)}>{t('common.delete')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? t('common.edit') : t('leaves.newLeaveModalTitle')}</h2>
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
                {t('common.startDate')}
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </label>
              <label>
                {t('common.endDate')}
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : editing ? t('common.save') : t('leaves.sendRequest')}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
