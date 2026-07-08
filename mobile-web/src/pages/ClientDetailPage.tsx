import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getClient, getClientHistory } from '../api/clients';
import { BackLink } from '../components/BackLink';
import type { ClientHistoryEntry, Client } from '../types/models';

export function ClientDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [history, setHistory] = useState<ClientHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getClient(Number(id)), getClientHistory(Number(id))])
      .then(([c, h]) => {
        setClient(c);
        setHistory(h);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>{t('common.loading')}</p>;
  if (!client) return <p>{t('clients.notFound')}</p>;

  return (
    <div>
      <BackLink to="/clients">{t('clients.backToClients')}</BackLink>
      <h1>{client.name}</h1>
      <p className="badge">{t(`clients.type.${client.type}`)}</p>
      <p>{client.phone} {client.email && `· ${client.email}`}</p>
      <p>{t('clients.balance')} : {client.balance}</p>

      <h2>{t('clients.history')}</h2>
      {history.length === 0 && <p>{t('clients.noActivity')}</p>}
      <table>
        <thead>
          <tr>
            <th>{t('common.date')}</th>
            <th>{t('common.type')}</th>
            <th>{t('clients.detail')}</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry, idx) => {
            const data = entry.data as Record<string, unknown>;
            return (
              <tr key={idx}>
                <td>{new Date(entry.date).toLocaleDateString()}</td>
                <td><span className="badge">{entry.type}</span></td>
                <td>
                  {entry.type === 'interaction' && `${entry.channel} — ${String(data.message ?? '')}`}
                  {entry.type === 'quote' && t('clients.quoteEntry', { number: String(data.number), total: String(data.total), status: String(data.status) })}
                  {entry.type === 'invoice' && t('clients.invoiceEntry', { number: String(data.number), total: String(data.total), status: String(data.status) })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
