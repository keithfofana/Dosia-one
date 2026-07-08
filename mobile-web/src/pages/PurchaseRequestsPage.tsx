import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import {
  createPurchaseRequest,
  deletePurchaseRequest,
  listPurchaseRequests,
  updatePurchaseRequest,
  updatePurchaseRequestStatus,
} from '../api/purchaseRequests';
import { listProducts } from '../api/products';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import type { Product, PurchaseRequest } from '../types/models';

const statusColor = (status: PurchaseRequest['status']) => {
  if (status === 'validee') return 'var(--success)';
  if (status === 'refusee') return 'var(--danger)';
  return undefined;
};

export function PurchaseRequestsPage() {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'achats.update');
  const canDelete = hasPermission(user, 'achats.delete');

  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PurchaseRequest | null>(null);
  const [productId, setProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listPurchaseRequests().then((res) => setRequests(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listProducts().then((res) => setProducts(res.data));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setProductId('');
    setQuantity('1');
    setShowForm(true);
  };

  const openEdit = (request: PurchaseRequest) => {
    setEditing(request);
    setFormError(null);
    setProductId(request.product_id);
    setQuantity(String(request.quantity));
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updatePurchaseRequest(editing.id, productId, Number(quantity));
      } else {
        await createPurchaseRequest(productId, Number(quantity));
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

  const handleStatus = async (request: PurchaseRequest, status: PurchaseRequest['status']) => {
    await updatePurchaseRequestStatus(request.id, status);
    load();
  };

  const handleDelete = async (request: PurchaseRequest) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setDeleteError(null);
    try {
      await deletePurchaseRequest(request.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setDeleteError((message as string) ?? 'Suppression impossible.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Demandes d'achat</h1>
        <button onClick={openCreate}>+ Nouvelle demande</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

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
                      {canUpdate && <button className="secondary" onClick={() => openEdit(r)}>Modifier</button>}
                    </>
                  )}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(r)}>Supprimer</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Modifier la demande' : "Nouvelle demande d'achat"}</h2>
            {formError && <p className="error">{formError}</p>}
            <form onSubmit={handleSubmit}>
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
                <button type="submit" disabled={saving}>{saving ? '...' : editing ? 'Enregistrer' : 'Créer'}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
