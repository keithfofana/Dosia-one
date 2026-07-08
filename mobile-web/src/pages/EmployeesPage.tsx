import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from '../api/employees';
import { listUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { extractErrorMessage } from '../utils/errors';
import type { Employee, User } from '../types/models';

export function EmployeesPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const canUpdate = hasPermission(currentUser, 'rh.update');
  const canDelete = hasPermission(currentUser, 'rh.delete');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [userId, setUserId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listEmployees().then((res) => setEmployees(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listUsers().then((res) => setUsers(res.data));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPosition('');
    setHireDate('');
    setUserId('');
    setShowForm(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setName(employee.name);
    setPosition(employee.position ?? '');
    setHireDate(employee.hire_date ? employee.hire_date.slice(0, 10) : '');
    setUserId(employee.user_id ?? '');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        position: position || undefined,
        hire_date: hireDate || undefined,
        user_id: userId === '' ? null : userId,
      };
      if (editing) {
        await updateEmployee(editing.id, payload);
      } else {
        await createEmployee(payload);
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setDeleteError(null);
    try {
      await deleteEmployee(employee.id);
      load();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, t('common.deleteError')));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('employees.title')}</h1>
        <button onClick={openCreate}>{t('employees.newEmployee')}</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('employees.position')}</th>
              <th>{t('employees.hireDate')}</th>
              <th>{t('employees.linkedAccount')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{e.position}</td>
                <td>{e.hire_date ? new Date(e.hire_date).toLocaleDateString() : ''}</td>
                <td>{e.user?.name ?? '—'}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/rh/employees/${e.id}`}>{t('employees.viewSheet')}</Link>
                  {canUpdate && <button className="secondary" onClick={() => openEdit(e)}>{t('common.edit')}</button>}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(e)}>{t('common.delete')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? t('common.edit') : t('employees.newEmployeeModalTitle')}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                {t('common.name')}
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                {t('employees.position')}
                <input value={position} onChange={(e) => setPosition(e.target.value)} />
              </label>
              <label>
                {t('employees.hireDate')}
                <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
              </label>
              <label>
                {t('employees.linkedAccountOptional')}
                <select value={userId} onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">{t('users.noRole')}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
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
