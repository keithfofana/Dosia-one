import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
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
import { extractErrorMessage } from '../utils/errors';
import type { Product, PurchaseRequest } from '../types/models';

const statusColor = (status: PurchaseRequest['status']) => {
  if (status === 'validee') return 'var(--success)';
  if (status === 'refusee') return 'var(--danger)';
  return undefined;
};

export function PurchaseRequestsPage() {
  const { t } = useTranslation();
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
      setFormError(extractErrorMessage(err, t('common.saveError')));
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (request: PurchaseRequest, status: PurchaseRequest['status']) => {
    await updatePurchaseRequestStatus(request.id, status);
    load();
  };

  const handleDelete = async (request: PurchaseRequest) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setDeleteError(null);
    try {
      await deletePurchaseRequest(request.id);
      load();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, t('common.deleteError')));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('purchaseRequests.title')}</h1>
        <button onClick={openCreate}>{t('purchaseRequests.newRequest')}</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.product')}</th>
              <th>{t('common.quantity')}</th>
              <th>{t('common.status')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.product?.name}</td>
                <td>{r.quantity}</td>
                <td><span className="badge" style={{ color: statusColor(r.status) }}>{t(`purchaseRequests.status.${r.status}`)}</span></td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {r.status === 'en_attente' && (
                    <>
                      <button className="secondary" onClick={() => handleStatus(r, 'validee')}>{t('purchaseRequests.approve')}</button>
                      <button className="secondary" onClick={() => handleStatus(r, 'refusee')}>{t('purchaseRequests.reject')}</button>
                      {canUpdate && <button className="secondary" onClick={() => openEdit(r)}>{t('common.edit')}</button>}
                    </>
                  )}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(r)}>{t('common.delete')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? t('common.edit') : t('purchaseRequests.newRequestModalTitle')}</h2>
            {formError && <p className="error">{formError}</p>}
            <form onSubmit={handleSubmit}>
              <label>
                {t('common.product')}
                <select value={productId} onChange={(e) => setProductId(Number(e.target.value))} required>
                  <option value="">{t('common.choose')}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label>
                {t('common.quantity')}
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
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
