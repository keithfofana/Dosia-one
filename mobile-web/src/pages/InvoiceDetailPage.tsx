import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { cancelInvoice, deleteInvoice, getInvoice, recordPayment, updateInvoice } from '../api/invoices';
import { listClients } from '../api/clients';
import { listProducts } from '../api/products';
import type { QuoteItemInput } from '../api/quotes';
import { BackLink } from '../components/BackLink';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import type { Client, Invoice, Product } from '../types/models';

export function InvoiceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'ventes.update');
  const canDelete = hasPermission(user, 'ventes.delete');

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('especes');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [clientId, setClientId] = useState<number | ''>('');
  const [items, setItems] = useState<QuoteItemInput[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getInvoice(Number(id)).then(setInvoice).finally(() => setLoading(false));
  };

  useEffect(load, [id]);
  useEffect(() => {
    listClients().then((res) => setClients(res.data));
    listProducts().then((res) => setProducts(res.data));
  }, []);

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

  const updateItem = (index: number, patch: Partial<QuoteItemInput>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, { product_id: 0, quantity: 1, unit_price: 0 }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    updateItem(index, { product_id: productId, unit_price: product ? Number(product.sale_price) : 0 });
  };

  const openEdit = () => {
    if (!invoice) return;
    setEditError(null);
    setClientId(invoice.client_id);
    setItems(
      (invoice.invoice_items ?? []).map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
      })),
    );
    setShowEdit(true);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoice || !clientId) return;
    setSaving(true);
    setEditError(null);
    try {
      await updateInvoice(invoice.id, clientId, items.filter((it) => it.product_id > 0));
      setShowEdit(false);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setEditError((message as string) ?? 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!invoice) return;
    if (!window.confirm(t('invoices.confirmCancelInvoice'))) return;
    setActionError(null);
    try {
      await cancelInvoice(invoice.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setActionError((message as string) ?? 'Annulation impossible.');
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    if (!window.confirm(t('common.confirmDelete'))) return;
    setActionError(null);
    try {
      await deleteInvoice(invoice.id);
      navigate('/invoices');
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setActionError((message as string) ?? t('invoices.deleteBlocked'));
    }
  };

  if (loading) return <p>{t('common.loading')}</p>;
  if (!invoice) return <p>{t('invoices.notFound')}</p>;

  const remaining = Number(invoice.total) - Number(invoice.paid_amount);

  return (
    <div>
      <BackLink to="/invoices">{t('invoices.backToInvoices')}</BackLink>
      <div className="page-header">
        <h1>{t('invoices.invoiceNumber', { number: invoice.number })}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {canUpdate && invoice.status === 'due' && (
            <button className="secondary" onClick={openEdit}>{t('common.edit')}</button>
          )}
          {canUpdate && invoice.status !== 'annule' && (
            <button className="secondary" onClick={handleCancel}>{t('invoices.cancelInvoice')}</button>
          )}
          {canDelete && invoice.status === 'due' && (
            <button className="secondary" onClick={handleDelete}>{t('common.delete')}</button>
          )}
        </div>
      </div>

      {actionError && <p className="error">{actionError}</p>}

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

      {remaining > 0 && invoice.status !== 'annule' && (
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

      {showEdit && (
        <div className="modal-backdrop" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('invoices.editInvoiceModalTitle')}</h2>
            {editError && <p className="error">{editError}</p>}
            <form onSubmit={handleEditSubmit}>
              <label>
                {t('common.client')}
                <select value={clientId} onChange={(e) => setClientId(Number(e.target.value))} required>
                  <option value="">{t('common.choose')}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <h3>{t('common.lines')}</h3>
              {items.map((item, idx) => (
                <div className="item-row" key={idx}>
                  <label>
                    {t('common.product')}
                    <select value={item.product_id} onChange={(e) => handleProductChange(idx, Number(e.target.value))}>
                      <option value={0}>--</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t('common.quantity')}
                    <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
                  </label>
                  <label>
                    {t('common.unitPrice')}
                    <input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })} />
                  </label>
                  <button type="button" className="secondary" onClick={() => removeItem(idx)}>×</button>
                </div>
              ))}
              <button type="button" className="secondary" onClick={addItem}>{t('common.addLine')}</button>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : t('common.save')}</button>
                <button type="button" className="secondary" onClick={() => setShowEdit(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
