import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { listQuotes, createQuote, type QuoteItemInput } from '../api/quotes';
import { listClients } from '../api/clients';
import { listProducts } from '../api/products';
import type { Client, Product, Quote } from '../types/models';

export function QuotesPage() {
  const { t } = useTranslation();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState<number | ''>('');
  const [items, setItems] = useState<QuoteItemInput[]>([{ product_id: 0, quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);

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

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setSaving(true);
    try {
      await createQuote(clientId, items.filter((it) => it.product_id > 0));
      setShowForm(false);
      setItems([{ product_id: 0, quantity: 1, unit_price: 0 }]);
      setClientId('');
      load();
    } finally {
      setSaving(false);
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
        <button onClick={() => setShowForm(true)}>{t('quotes.newQuote')}</button>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id}>
                <td>{q.number}</td>
                <td>{q.client?.name}</td>
                <td><span className="badge">{t(`quotes.status.${q.status}`)}</span></td>
                <td>{q.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('quotes.newQuoteModalTitle')}</h2>
            <form onSubmit={handleCreate}>
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
                <button type="submit" disabled={saving}>{saving ? '...' : t('common.create')}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
