import { useEffect, useState, type FormEvent } from 'react';
import { createPurchaseRequest, listPurchaseRequests, updatePurchaseRequestStatus } from '../api/purchaseRequests';
import { listProducts } from '../api/products';
import type { Product, PurchaseRequest } from '../types/models';

const statusColor = (status: PurchaseRequest['status']) => {
  if (status === 'validee') return 'var(--success)';
  if (status === 'refusee') return 'var(--danger)';
  return undefined;
};

export function PurchaseRequestsPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listPurchaseRequests().then((res) => setRequests(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listProducts().then((res) => setProducts(res.data));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    setSaving(true);
    try {
      await createPurchaseRequest(productId, Number(quantity));
      setShowForm(false);
      setProductId('');
      setQuantity('1');
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (request: PurchaseRequest, status: PurchaseRequest['status']) => {
    await updatePurchaseRequestStatus(request.id, status);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Demandes d'achat</h1>
        <button onClick={() => setShowForm(true)}>+ Nouvelle demande</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.product?.name}</td>
                <td>{r.quantity}</td>
                <td><span className="badge" style={{ color: statusColor(r.status) }}>{r.status}</span></td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {r.status === 'en_attente' && (
                    <>
                      <button className="secondary" onClick={() => handleStatus(r, 'validee')}>Valider</button>
                      <button className="secondary" onClick={() => handleStatus(r, 'refusee')}>Refuser</button>
                    </>
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
            <h2>Nouvelle demande d'achat</h2>
            <form onSubmit={handleCreate}>
              <label>
                Produit
                <select value={productId} onChange={(e) => setProductId(Number(e.target.value))} required>
                  <option value="">-- Choisir --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Quantité
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
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
