import { useEffect, useState, type FormEvent } from 'react';
import { createLeave, listLeaves, updateLeaveStatus } from '../api/leaves';
import { listEmployees } from '../api/employees';
import type { Employee, Leave } from '../types/models';

const statusColor = (status: Leave['status']) => {
  if (status === 'approuve') return 'var(--success)';
  if (status === 'refuse') return 'var(--danger)';
  return undefined;
};

export function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listLeaves().then((res) => setLeaves(res.data)).finally(() => setLoading(false));
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
      await createLeave({ employee_id: employeeId, start_date: startDate, end_date: endDate });
      setShowForm(false);
      setEmployeeId('');
      setStartDate('');
      setEndDate('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (leave: Leave, status: Leave['status']) => {
    await updateLeaveStatus(leave.id, status);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Congés</h1>
        <button onClick={() => setShowForm(true)}>+ Demande de congé</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Début</th>
              <th>Fin</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l.id}>
                <td>{l.employee?.name}</td>
                <td>{new Date(l.start_date).toLocaleDateString()}</td>
                <td>{new Date(l.end_date).toLocaleDateString()}</td>
                <td><span className="badge" style={{ color: statusColor(l.status) }}>{l.status}</span></td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {l.status === 'en_attente' && (
                    <>
                      <button className="secondary" onClick={() => handleStatus(l, 'approuve')}>Valider</button>
                      <button className="secondary" onClick={() => handleStatus(l, 'refuse')}>Refuser</button>
                    </>
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
            <h2>Nouvelle demande de congé</h2>
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
                Date de début
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </label>
              <label>
                Date de fin
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : 'Envoyer'}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
