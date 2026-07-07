import { useEffect, useState } from 'react';
import { getAlerts, getSummary } from '../api/dashboard';
import type { DashboardAlerts, DashboardSummary } from '../types/models';

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSummary(), getAlerts()])
      .then(([s, a]) => {
        setSummary(s);
        setAlerts(a);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h1>Tableau de bord</h1>
      <div className="card-grid">
        <div className="stat-card">
          <div className="text-muted">Chiffre d'affaires (total)</div>
          <div className="value">{summary?.chiffre_affaires.total.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted">CA du mois</div>
          <div className="value">{summary?.chiffre_affaires.mois_courant.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted">Bénéfice estimé</div>
          <div className="value">{summary?.benefice_estime.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted">Trésorerie</div>
          <div className="value">{summary?.tresorerie.toLocaleString()}</div>
        </div>
      </div>

      <h2>Alertes</h2>
      <div className="card-grid">
        <div className="stat-card">
          <h3>Stock faible ({alerts?.stock_faible.length ?? 0})</h3>
          {alerts?.stock_faible.map((p) => (
            <div key={p.id}>{p.name} — {p.quantity}/{p.alert_threshold}</div>
          ))}
        </div>
        <div className="stat-card">
          <h3>Factures impayées ({alerts?.factures_impayees.length ?? 0})</h3>
          {alerts?.factures_impayees.map((i) => (
            <div key={i.id}>{i.number} — {i.total}</div>
          ))}
        </div>
        <div className="stat-card">
          <h3>Anniversaires clients ({alerts?.anniversaires_clients.length ?? 0})</h3>
          {alerts?.anniversaires_clients.map((c) => (
            <div key={c.id}>{c.name} — {c.birthday}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
