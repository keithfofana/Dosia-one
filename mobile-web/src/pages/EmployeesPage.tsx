import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createEmployee, listEmployees } from '../api/employees';
import { listUsers } from '../api/users';
import type { Employee, User } from '../types/models';

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [userId, setUserId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listEmployees().then((res) => setEmployees(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listUsers().then((res) => setUsers(res.data));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createEmployee({
        name,
        position: position || undefined,
        hire_date: hireDate || undefined,
        user_id: userId === '' ? null : userId,
      });
      setShowForm(false);
      setName('');
      setPosition('');
      setHireDate('');
      setUserId('');
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Employés</h1>
        <button onClick={() => setShowForm(true)}>+ Nouvel employé</button>
      </div>

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
                <td><Link to={`/rh/employees/${e.id}`}>Voir la fiche</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouvel employé</h2>
            <form onSubmit={handleCreate}>
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
