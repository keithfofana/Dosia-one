import { useEffect, useState, type FormEvent } from 'react';
import { createContract, listContracts } from '../api/contracts';
import { listEmployees } from '../api/employees';
import type { Contract, Employee } from '../types/models';

const isExpiringSoon = (endDate: string | null) => {
  if (!endDate) return false;
  const days = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 30;
};

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listContracts().then((res) => setContracts(res.data)).finally(() => setLoading(false));
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
      await createContract({ employee_id: employeeId, type, start_date: startDate, end_date: endDate || null });
      setShowForm(false);
      setEmployeeId('');
      setType('');
      setStartDate('');
      setEndDate('');
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Contrats</h1>
        <button onClick={() => setShowForm(true)}>+ Nouveau contrat</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Type</th>
              <th>Début</th>
              <th>Fin</th>
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
                  {isExpiringSoon(c.end_date) && <span className="badge" style={{ color: 'var(--danger)', marginLeft: 8 }}>Expire bientôt</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouveau contrat</h2>
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
                Type de contrat
                <input value={type} onChange={(e) => setType(e.target.value)} placeholder="CDI, CDD, Stage..." required />
              </label>
              <label>
                Date de début
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </label>
              <label>
                Date de fin (optionnel)
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
