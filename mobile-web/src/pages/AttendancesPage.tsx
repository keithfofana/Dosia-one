import { useEffect, useState, type FormEvent } from 'react';
import { createAttendance, listAttendances, updateAttendanceCheckOut } from '../api/attendances';
import { listEmployees } from '../api/employees';
import type { Attendance, Employee } from '../types/models';

export function AttendancesPage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [saving, setSaving] = useState(false);
  const [checkOutDrafts, setCheckOutDrafts] = useState<Record<number, string>>({});

  const load = () => {
    setLoading(true);
    listAttendances().then((res) => setAttendances(res.data)).finally(() => setLoading(false));
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
      await createAttendance({ employee_id: employeeId, date, check_in: checkIn || undefined });
      setShowForm(false);
      setEmployeeId('');
      setDate('');
      setCheckIn('');
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

  return (
    <div>
      <div className="page-header">
        <h1>Présences</h1>
        <button onClick={() => setShowForm(true)}>+ Pointage</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Date</th>
              <th>Entrée</th>
              <th>Retard</th>
              <th>Sortie</th>
            </tr>
          </thead>
          <tbody>
            {attendances.map((a) => (
              <tr key={a.id}>
                <td>{a.employee?.name}</td>
                <td>{new Date(a.date).toLocaleDateString()}</td>
                <td>{a.check_in ?? '—'}</td>
                <td>{a.is_late ? <span className="badge" style={{ color: 'var(--danger)' }}>Oui</span> : 'Non'}</td>
                <td>
                  {a.check_out ?? (
                    <span style={{ display: 'flex', gap: 4 }}>
                      <input
                        type="time"
                        value={checkOutDrafts[a.id] ?? ''}
                        onChange={(e) => setCheckOutDrafts((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      />
                      <button className="secondary" onClick={() => handleCheckOut(a)}>OK</button>
                    </span>
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
            <h2>Nouveau pointage</h2>
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
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label>
                Heure d'entrée
                <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : 'Enregistrer'}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
