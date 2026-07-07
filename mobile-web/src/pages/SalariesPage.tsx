import { useEffect, useState, type FormEvent } from 'react';
import { createSalary, listSalaries, markSalaryPaid } from '../api/salaries';
import { listEmployees } from '../api/employees';
import type { Employee, Salary } from '../types/models';

const statusColor = (status: Salary['status']) => (status === 'paye' ? 'var(--success)' : undefined);

export function SalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [periodMonth, setPeriodMonth] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listSalaries().then((res) => setSalaries(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listEmployees().then((res) => setEmployees(res.data));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setSaving(true);
    try {
      await createSalary({ employee_id: employeeId, amount: Number(amount), period_month: `${periodMonth}-01` });
      setShowForm(false);
      setEmployeeId('');
      setAmount('');
      setPeriodMonth('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (salary: Salary) => {
    await markSalaryPaid(salary.id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Salaires</h1>
        <button onClick={() => setShowForm(true)}>+ Nouveau salaire</button>
      </div>

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
                <td>
                  {s.status === 'prevu' && (
                    <button className="secondary" onClick={() => handleMarkPaid(s)}>Marquer payé</button>
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
            <h2>Nouveau salaire</h2>
            <form onSubmit={handleCreate}>
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
