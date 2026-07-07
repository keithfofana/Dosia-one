import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInvoice, recordPayment } from '../api/invoices';
import type { Invoice } from '../types/models';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('especes');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getInvoice(Number(id)).then(setInvoice).finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handlePayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    setError(null);
    setSaving(true);
    try {
      await recordPayment(invoice.id, Number(amount), method);
      setAmount('');
      load();
    } catch {
      setError("Erreur lors de l'enregistrement du paiement.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (!invoice) return <p>Facture introuvable.</p>;

  const remaining = Number(invoice.total) - Number(invoice.paid_amount);

  return (
    <div>
      <p><Link to="/invoices">&larr; Retour aux factures</Link></p>
      <h1>Facture {invoice.number}</h1>
      <p>Client : {invoice.client?.name}</p>
      <p>Statut : <span className="badge">{invoice.status}</span></p>
      <p>Total : {invoice.total} — Payé : {invoice.paid_amount} — Restant : {remaining.toFixed(2)}</p>

      <h2>Lignes</h2>
      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th>Qté</th>
            <th>Prix unit.</th>
          </tr>
        </thead>
        <tbody>
          {invoice.invoice_items?.map((item) => (
            <tr key={item.id}>
              <td>{item.product?.name}</td>
              <td>{item.quantity}</td>
              <td>{item.unit_price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Paiements</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Montant</th>
            <th>Méthode</th>
          </tr>
        </thead>
        <tbody>
          {invoice.payments?.map((p) => (
            <tr key={p.id}>
              <td>{new Date(p.created_at).toLocaleDateString()}</td>
              <td>{p.amount}</td>
              <td>{p.method}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {remaining > 0 && (
        <div className="stat-card" style={{ marginTop: 16, maxWidth: 320 }}>
          <h3>Enregistrer un paiement</h3>
          <form onSubmit={handlePayment}>
            <label>
              Montant
              <input type="number" step="0.01" max={remaining} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </label>
            <label>
              Méthode
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile money</option>
                <option value="virement">Virement</option>
                <option value="cheque">Chèque</option>
              </select>
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={saving}>{saving ? '...' : 'Enregistrer'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
