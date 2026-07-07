import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { listInvoices, createInvoice } from '../api/invoices';
import { listClients } from '../api/clients';
import { listProducts } from '../api/products';
import type { QuoteItemInput } from '../api/quotes';
import type { Client, Product, Invoice } from '../types/models';

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState<number | ''>('');
  const [items, setItems] = useState<QuoteItemInput[]>([{ product_id: 0, quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listInvoices().then((res) => setInvoices(res.data)).finally(() => setLoading(false));
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

  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    updateItem(index, { product_id: productId, unit_price: product ? Number(product.sale_price) : 0 });
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setSaving(true);
    try {
      await createInvoice(clientId, items.filter((it) => it.product_id > 0));
      setShowForm(false);
      setItems([{ product_id: 0, quantity: 1, unit_price: 0 }]);
      setClientId('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (status: Invoice['status']) => {
    if (status === 'paye') return 'var(--success)';
    if (status === 'annule') return 'var(--danger)';
    return undefined;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Factures</h1>
        <button onClick={() => setShowForm(true)}>+ Nouvelle facture</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Statut</th>
              <th>Total</th>
              <th>Payé</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id}>
                <td>{i.number}</td>
                <td>{i.client?.name}</td>
                <td><span className="badge" style={{ color: statusColor(i.status) }}>{i.status}</span></td>
                <td>{i.total}</td>
                <td>{i.paid_amount}</td>
                <td><Link to={`/invoices/${i.id}`}>Voir</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouvelle facture</h2>
            <form onSubmit={handleCreate}>
              <label>
                Client
                <select value={clientId} onChange={(e) => setClientId(Number(e.target.value))} required>
                  <option value="">-- Choisir --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <h3>Lignes</h3>
              {items.map((item, idx) => (
                <div className="item-row" key={idx}>
                  <label>
                    Produit
                    <select value={item.product_id} onChange={(e) => handleProductChange(idx, Number(e.target.value))}>
                      <option value={0}>--</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Qté
                    <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
                  </label>
                  <label>
                    Prix unit.
                    <input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })} />
                  </label>
                  <button type="button" className="secondary" onClick={() => removeItem(idx)}>×</button>
                </div>
              ))}
              <button type="button" className="secondary" onClick={addItem}>+ Ligne</button>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : 'Créer'}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
