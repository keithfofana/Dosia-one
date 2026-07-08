import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from '../api/employees';
import { listUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import type { Employee, User } from '../types/models';

export function EmployeesPage() {
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
    if (!window.confirm('Confirmer la suppression ?')) return;
    setDeleteError(null);
    try {
      await deleteEmployee(employee.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setDeleteError((message as string) ?? 'Suppression impossible.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Employés</h1>
        <button onClick={openCreate}>+ Nouvel employé</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Poste</th>
              <th>Date d'embauche</th>
              <th>Compte lié</th>
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
                  <Link to={`/rh/employees/${e.id}`}>Voir la fiche</Link>
                  {canUpdate && <button className="secondary" onClick={() => openEdit(e)}>Modifier</button>}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(e)}>Supprimer</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Modifier l'employé" : 'Nouvel employé'}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Nom
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Poste
                <input value={position} onChange={(e) => setPosition(e.target.value)} />
              </label>
              <label>
                Date d'embauche
                <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
              </label>
              <label>
                Compte utilisateur lié (optionnel)
                <select value={userId} onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">-- Aucun --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
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
