import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { deleteQuote, getQuote, listQuotes, createQuote, updateQuote, type QuoteItemInput } from '../api/quotes';
import { listClients } from '../api/clients';
import { listProducts } from '../api/products';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import type { Client, Product, Quote } from '../types/models';

export function QuotesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'ventes.update');
  const canDelete = hasPermission(user, 'ventes.delete');

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [clientId, setClientId] = useState<number | ''>('');
  const [items, setItems] = useState<QuoteItemInput[]>([{ product_id: 0, quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listQuotes().then((res) => setQuotes(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listClients().then((res) => setClients(res.data));
    listProducts().then((res) => setProducts(res.data));
  }, []);

  const updateItem = (index: number, patch: Partial<QuoteItemInput>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { product_id: 0, quantity: 1, unit_price: 0 }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setClientId('');
    setItems([{ product_id: 0, quantity: 1, unit_price: 0 }]);
    setShowForm(true);
  };

  const openEdit = async (quote: Quote) => {
    const full = await getQuote(quote.id);
    setEditing(full);
    setFormError(null);
    setClientId(full.client_id);
    setItems(
      (full.quote_items ?? []).map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
      })),
    );
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updateQuote(editing.id, clientId, items.filter((it) => it.product_id > 0));
      } else {
        await createQuote(clientId, items.filter((it) => it.product_id > 0));
      }
      setShowForm(false);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setFormError((message as string) ?? 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (quote: Quote) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setDeleteError(null);
    try {
      await deleteQuote(quote.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setDeleteError((message as string) ?? 'Suppression impossible.');
    }
  };

  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    updateItem(index, { product_id: productId, unit_price: product ? Number(product.sale_price) : 0 });
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('quotes.title')}</h1>
        <button onClick={openCreate}>{t('quotes.newQuote')}</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('quotes.number')}</th>
              <th>{t('common.client')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.total')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id}>
                <td>{q.number}</td>
                <td>{q.client?.name}</td>
                <td><span className="badge">{t(`quotes.status.${q.status}`)}</span></td>
                <td>{q.total}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {canUpdate && q.status !== 'converti' && (
                    <button className="secondary" onClick={() => openEdit(q)}>{t('common.edit')}</button>
                  )}
                  {canDelete && q.status !== 'converti' && (
                    <button className="secondary" onClick={() => handleDelete(q)}>{t('common.delete')}</button>
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
            <h2>{editing ? t('common.edit') : t('quotes.newQuoteModalTitle')}</h2>
            {formError && <p className="error">{formError}</p>}
            <form onSubmit={handleSubmit}>
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
                <button type="submit" disabled={saving}>{saving ? '...' : editing ? t('common.save') : t('common.create')}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
