import { useEffect, useState, type FormEvent } from 'react';
import { createEvaluation, listEvaluations } from '../api/evaluations';
import { listEmployees } from '../api/employees';
import type { Employee, Evaluation } from '../types/models';

export function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [evaluationDate, setEvaluationDate] = useState('');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listEvaluations().then((res) => setEvaluations(res.data)).finally(() => setLoading(false));
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
      await createEvaluation({
        employee_id: employeeId,
        evaluation_date: evaluationDate,
        score: score ? Number(score) : undefined,
        notes: notes || undefined,
      });
      setShowForm(false);
      setEmployeeId('');
      setEvaluationDate('');
      setScore('');
      setNotes('');
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Évaluations</h1>
        <button onClick={() => setShowForm(true)}>+ Nouvelle évaluation</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Date</th>
              <th>Note</th>
              <th>Remarques</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.employee?.name}</td>
                <td>{new Date(ev.evaluation_date).toLocaleDateString()}</td>
                <td>{ev.score ?? '—'}</td>
                <td>{ev.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouvelle évaluation</h2>
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
                Date
                <input type="date" value={evaluationDate} onChange={(e) => setEvaluationDate(e.target.value)} required />
              </label>
              <label>
                Note (0-20)
                <input type="number" min={0} max={20} value={score} onChange={(e) => setScore(e.target.value)} />
              </label>
              <label>
                Remarques
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
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
