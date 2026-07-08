import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { createEvaluation, deleteEvaluation, listEvaluations, updateEvaluation } from '../api/evaluations';
import { listEmployees } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import type { Employee, Evaluation } from '../types/models';

export function EvaluationsPage() {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'rh.update');
  const canDelete = hasPermission(user, 'rh.delete');

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Evaluation | null>(null);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [evaluationDate, setEvaluationDate] = useState('');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listEvaluations().then((res) => setEvaluations(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listEmployees().then((res) => setEmployees(res.data));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setEmployeeId('');
    setEvaluationDate('');
    setScore('');
    setNotes('');
    setShowForm(true);
  };

  const openEdit = (evaluation: Evaluation) => {
    setEditing(evaluation);
    setEmployeeId(evaluation.employee_id);
    setEvaluationDate(evaluation.evaluation_date.slice(0, 10));
    setScore(evaluation.score != null ? String(evaluation.score) : '');
    setNotes(evaluation.notes ?? '');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setSaving(true);
    try {
      const payload = {
        employee_id: employeeId,
        evaluation_date: evaluationDate,
        score: score ? Number(score) : undefined,
        notes: notes || undefined,
      };
      if (editing) {
        await updateEvaluation(editing.id, payload);
      } else {
        await createEvaluation(payload);
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (evaluation: Evaluation) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setDeleteError(null);
    try {
      await deleteEvaluation(evaluation.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setDeleteError((message as string) ?? 'Suppression impossible.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Évaluations</h1>
        <button onClick={openCreate}>+ Nouvelle évaluation</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.employee?.name}</td>
                <td>{new Date(ev.evaluation_date).toLocaleDateString()}</td>
                <td>{ev.score ?? '—'}</td>
                <td>{ev.notes ?? '—'}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {canUpdate && <button className="secondary" onClick={() => openEdit(ev)}>Modifier</button>}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(ev)}>Supprimer</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Modifier l'évaluation" : 'Nouvelle évaluation'}</h2>
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
