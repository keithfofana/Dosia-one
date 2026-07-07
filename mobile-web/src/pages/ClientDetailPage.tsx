import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClient, getClientHistory } from '../api/clients';
import type { ClientHistoryEntry, Client } from '../types/models';

export function ClientDetailPage() {
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

  if (loading) return <p>Chargement...</p>;
  if (!client) return <p>Client introuvable.</p>;

  return (
    <div>
      <p><Link to="/clients">&larr; Retour aux clients</Link></p>
      <h1>{client.name}</h1>
      <p className="badge">{client.type}</p>
      <p>{client.phone} {client.email && `· ${client.email}`}</p>
      <p>Solde : {client.balance}</p>

      <h2>Historique</h2>
      {history.length === 0 && <p>Aucune activité.</p>}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Détail</th>
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
                  {entry.type === 'quote' && `Devis ${String(data.number)} — ${String(data.total)} (${String(data.status)})`}
                  {entry.type === 'invoice' && `Facture ${String(data.number)} — ${String(data.total)} (${String(data.status)})`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
