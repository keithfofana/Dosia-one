import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { createSalary, deleteSalary, listSalaries, markSalaryPaid, updateSalary } from '../api/salaries';
import { listEmployees } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import type { Employee, Salary } from '../types/models';

const statusColor = (status: Salary['status']) => (status === 'paye' ? 'var(--success)' : undefined);

export function SalariesPage() {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'rh.update');
  const canDelete = hasPermission(user, 'rh.delete');

  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Salary | null>(null);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [periodMonth, setPeriodMonth] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listSalaries().then((res) => setSalaries(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listEmployees().then((res) => setEmployees(res.data));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setEmployeeId('');
    setAmount('');
    setPeriodMonth('');
    setShowForm(true);
  };

  const openEdit = (salary: Salary) => {
    setEditing(salary);
    setFormError(null);
    setEmployeeId(salary.employee_id);
    setAmount(String(salary.amount));
    setPeriodMonth(salary.period_month.slice(0, 7));
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updateSalary(editing.id, { employee_id: employeeId, amount: Number(amount), period_month: `${periodMonth}-01` });
      } else {
        await createSalary({ employee_id: employeeId, amount: Number(amount), period_month: `${periodMonth}-01` });
      }
      setShowForm(false);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setFormError((message as string) ?? 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (salary: Salary) => {
    await markSalaryPaid(salary.id);
    load();
  };

  const handleDelete = async (salary: Salary) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setDeleteError(null);
    try {
      await deleteSalary(salary.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setDeleteError((message as string) ?? 'Suppression impossible : ce salaire est déjà payé.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Salaires</h1>
        <button onClick={openCreate}>+ Nouveau salaire</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Mois</th>
              <th>Montant</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((s) => (
              <tr key={s.id}>
                <td>{s.employee?.name}</td>
                <td>{new Date(s.period_month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</td>
                <td>{s.amount}</td>
                <td><span className="badge" style={{ color: statusColor(s.status) }}>{s.status}</span></td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {s.status === 'prevu' && (
                    <button className="secondary" onClick={() => handleMarkPaid(s)}>Marquer payé</button>
                  )}
                  {canUpdate && s.status !== 'paye' && (
                    <button className="secondary" onClick={() => openEdit(s)}>Modifier</button>
                  )}
                  {canDelete && s.status !== 'paye' && (
                    <button className="secondary" onClick={() => handleDelete(s)}>Supprimer</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Modifier le salaire' : 'Nouveau salaire'}</h2>
            {formError && <p className="error">{formError}</p>}
            <form onSubmit={handleSubmit}>
              <label>
                Employé
                <select value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value))} required>
                  <option value="">-- Choisir --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Mois
                <input type="month" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} required />
              </label>
              <label>
                Montant
                <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
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
