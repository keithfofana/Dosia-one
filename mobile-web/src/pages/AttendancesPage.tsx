import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { createAttendance, deleteAttendance, listAttendances, updateAttendance, updateAttendanceCheckOut } from '../api/attendances';
import { listEmployees } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { extractErrorMessage } from '../utils/errors';
import type { Attendance, Employee } from '../types/models';

export function AttendancesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'rh.update');
  const canDelete = hasPermission(user, 'rh.delete');

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Attendance | null>(null);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [saving, setSaving] = useState(false);
  const [checkOutDrafts, setCheckOutDrafts] = useState<Record<number, string>>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listAttendances().then((res) => setAttendances(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listEmployees().then((res) => setEmployees(res.data));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setEmployeeId('');
    setDate('');
    setCheckIn('');
    setShowForm(true);
  };

  const openEdit = (attendance: Attendance) => {
    setEditing(attendance);
    setEmployeeId(attendance.employee_id);
    setDate(attendance.date.slice(0, 10));
    setCheckIn(attendance.check_in ?? '');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setSaving(true);
    try {
      if (editing) {
        await updateAttendance(editing.id, { employee_id: employeeId, date, check_in: checkIn || undefined });
      } else {
        await createAttendance({ employee_id: employeeId, date, check_in: checkIn || undefined });
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOut = async (attendance: Attendance) => {
    const value = checkOutDrafts[attendance.id];
    if (!value) return;
    await updateAttendanceCheckOut(attendance.id, value);
    load();
  };

  const handleDelete = async (attendance: Attendance) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setDeleteError(null);
    try {
      await deleteAttendance(attendance.id);
      load();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, t('common.deleteError')));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('attendances.title')}</h1>
        <button onClick={openCreate}>{t('attendances.newAttendance')}</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.employee')}</th>
              <th>{t('common.date')}</th>
              <th>{t('attendances.checkIn')}</th>
              <th>{t('attendances.late')}</th>
              <th>{t('attendances.checkOut')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {attendances.map((a) => (
              <tr key={a.id}>
                <td>{a.employee?.name}</td>
                <td>{new Date(a.date).toLocaleDateString()}</td>
                <td>{a.check_in ?? '—'}</td>
                <td>{a.is_late ? <span className="badge" style={{ color: 'var(--danger)' }}>{t('common.yes')}</span> : t('common.no')}</td>
                <td>
                  {a.check_out ?? (
                    <span style={{ display: 'flex', gap: 4 }}>
                      <input
                        type="time"
                        value={checkOutDrafts[a.id] ?? ''}
                        onChange={(e) => setCheckOutDrafts((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      />
                      <button className="secondary" onClick={() => handleCheckOut(a)}>{t('attendances.ok')}</button>
                    </span>
                  )}
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {canUpdate && <button className="secondary" onClick={() => openEdit(a)}>{t('common.edit')}</button>}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(a)}>{t('common.delete')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? t('common.edit') : t('attendances.newAttendanceModalTitle')}</h2>
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
                {t('common.date')}
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label>
                {t('attendances.checkInTime')}
                <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : t('common.save')}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
