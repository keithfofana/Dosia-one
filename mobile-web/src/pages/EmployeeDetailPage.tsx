import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEmployee } from '../api/employees';
import { BackLink } from '../components/BackLink';
import type { Employee } from '../types/models';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getEmployee(Number(id)).then(setEmployee).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Chargement...</p>;
  if (!employee) return <p>Employé introuvable.</p>;

  return (
    <div>
      <BackLink to="/rh/employees">Retour aux employés</BackLink>
      <h1>{employee.name}</h1>
      <p>{employee.position} {employee.hire_date && `· embauché le ${new Date(employee.hire_date).toLocaleDateString()}`}</p>
      <p>Compte utilisateur lié : {employee.user?.name ?? '—'}</p>
      <p>Solde de congés : <span className="badge">{employee.leave_balance} jours</span></p>

      <h2>Salaires</h2>
      <table>
        <thead><tr><th>Mois</th><th>Montant</th><th>Statut</th></tr></thead>
        <tbody>
          {(employee.salaries ?? []).map((s) => (
            <tr key={s.id}>
              <td>{new Date(s.period_month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</td>
              <td>{s.amount}</td>
              <td><span className="badge">{s.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Présences</h2>
      <table>
        <thead><tr><th>Date</th><th>Entrée</th><th>Sortie</th><th>Retard</th></tr></thead>
        <tbody>
          {(employee.attendances ?? []).map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.date).toLocaleDateString()}</td>
              <td>{a.check_in ?? '—'}</td>
              <td>{a.check_out ?? '—'}</td>
              <td>{a.is_late ? <span className="badge" style={{ color: 'var(--danger)' }}>Oui</span> : 'Non'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Congés</h2>
      <table>
        <thead><tr><th>Début</th><th>Fin</th><th>Statut</th></tr></thead>
        <tbody>
          {(employee.leaves ?? []).map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.start_date).toLocaleDateString()}</td>
              <td>{new Date(l.end_date).toLocaleDateString()}</td>
              <td><span className="badge">{l.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Contrats</h2>
      <table>
        <thead><tr><th>Type</th><th>Début</th><th>Fin</th></tr></thead>
        <tbody>
          {(employee.contracts ?? []).map((c) => (
            <tr key={c.id}>
              <td>{c.type}</td>
              <td>{new Date(c.start_date).toLocaleDateString()}</td>
              <td>{c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Évaluations</h2>
      <table>
        <thead><tr><th>Date</th><th>Note</th><th>Remarques</th></tr></thead>
        <tbody>
          {(employee.evaluations ?? []).map((ev) => (
            <tr key={ev.id}>
              <td>{new Date(ev.evaluation_date).toLocaleDateString()}</td>
              <td>{ev.score ?? '—'}</td>
              <td>{ev.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
