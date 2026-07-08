import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getInvoice, recordPayment } from '../api/invoices';
import { BackLink } from '../components/BackLink';
import type { Invoice } from '../types/models';

export function InvoiceDetailPage() {
  const { t } = useTranslation();
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
      setError(t('invoices.paymentError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>{t('common.loading')}</p>;
  if (!invoice) return <p>{t('invoices.notFound')}</p>;

  const remaining = Number(invoice.total) - Number(invoice.paid_amount);

  return (
    <div>
      <BackLink to="/invoices">{t('invoices.backToInvoices')}</BackLink>
      <h1>{t('invoices.invoiceNumber', { number: invoice.number })}</h1>
      <p>{t('common.client')} : {invoice.client?.name}</p>
      <p>{t('common.status')} : <span className="badge">{t(`invoices.status.${invoice.status}`)}</span></p>
      <p>{t('invoices.totalPaidRemaining', { total: invoice.total, paid: invoice.paid_amount, remaining: remaining.toFixed(2) })}</p>

      <h2>{t('common.lines')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('common.product')}</th>
            <th>{t('common.quantity')}</th>
            <th>{t('common.unitPrice')}</th>
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

      <h2>{t('invoices.payments')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('common.date')}</th>
            <th>{t('common.amount')}</th>
            <th>{t('common.method')}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.payments?.map((p) => (
            <tr key={p.id}>
              <td>{new Date(p.created_at).toLocaleDateString()}</td>
              <td>{p.amount}</td>
              <td>{t(`invoices.methods.${p.method}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {remaining > 0 && (
        <div className="stat-card" style={{ marginTop: 16, maxWidth: 320 }}>
          <h3>{t('invoices.recordPayment')}</h3>
          <form onSubmit={handlePayment}>
            <label>
              {t('common.amount')}
              <input type="number" step="0.01" max={remaining} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </label>
            <label>
              {t('common.method')}
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="especes">{t('invoices.methods.especes')}</option>
                <option value="mobile_money">{t('invoices.methods.mobile_money')}</option>
                <option value="virement">{t('invoices.methods.virement')}</option>
                <option value="cheque">{t('invoices.methods.cheque')}</option>
              </select>
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={saving}>{saving ? '...' : t('common.save')}</button>
          </form>
        </div>
      )}
    </div>
  );
}
