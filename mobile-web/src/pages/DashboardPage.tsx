import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAlerts, getSummary } from '../api/dashboard';
import type { DashboardAlerts, DashboardSummary } from '../types/models';

export function DashboardPage() {
  const { t } = useTranslation();
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

  if (loading) return <p>{t('common.loading')}</p>;

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <div className="card-grid">
        <div className="stat-card">
          <div className="text-muted">{t('dashboard.revenueTotal')}</div>
          <div className="value">{summary?.chiffre_affaires.total.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted">{t('dashboard.revenueMonth')}</div>
          <div className="value">{summary?.chiffre_affaires.mois_courant.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted">{t('dashboard.estimatedProfit')}</div>
          <div className="value">{summary?.benefice_estime.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted">{t('dashboard.treasury')}</div>
          <div className="value">{summary?.tresorerie.toLocaleString()}</div>
        </div>
      </div>

      <h2>{t('dashboard.alerts')}</h2>
      <div className="card-grid">
        <div className="stat-card">
          <h3>{t('dashboard.lowStock')} ({alerts?.stock_faible.length ?? 0})</h3>
          {alerts?.stock_faible.map((p) => (
            <div key={p.id}>{p.name} — {p.quantity}/{p.alert_threshold}</div>
          ))}
        </div>
        <div className="stat-card">
          <h3>{t('dashboard.unpaidInvoices')} ({alerts?.factures_impayees.length ?? 0})</h3>
          {alerts?.factures_impayees.map((i) => (
            <div key={i.id}>{i.number} — {i.total}</div>
          ))}
        </div>
        <div className="stat-card">
          <h3>{t('dashboard.clientBirthdays')} ({alerts?.anniversaires_clients.length ?? 0})</h3>
          {alerts?.anniversaires_clients.map((c) => (
            <div key={c.id}>{c.name} — {c.birthday}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
