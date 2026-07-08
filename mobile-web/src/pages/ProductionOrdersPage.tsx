import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createProductionOrder,
  deleteProductionOrder,
  getProductionOrderCost,
  listProductionOrders,
  updateProductionOrderQuantity,
  updateProductionOrderStatus,
} from '../api/productionOrders';
import { listProducts } from '../api/products';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { extractErrorMessage } from '../utils/errors';
import type { Product, ProductionCostSummary, ProductionOrder, StockWarning } from '../types/models';

const statusColor = (status: ProductionOrder['status']) => {
  if (status === 'termine') return 'var(--success)';
  if (status === 'en_cours') return undefined;
  return undefined;
};

export function ProductionOrdersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'production.update');
  const canDelete = hasPermission(user, 'production.delete');

  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);
  const [lastWarnings, setLastWarnings] = useState<StockWarning[] | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [completingId, setCompletingId] = useState<number | null>(null);
  const [laborCost, setLaborCost] = useState('0');
  const [overheadCost, setOverheadCost] = useState('0');

  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [editQuantity, setEditQuantity] = useState('1');
  const [editError, setEditError] = useState<string | null>(null);

  const [costFor, setCostFor] = useState<Record<number, ProductionCostSummary>>({});

  const load = () => {
    setLoading(true);
    listProductionOrders().then((res) => setOrders(res.data)).finally(() => setLoading(false));
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
      const created = await createProductionOrder({ product_id: productId, quantity_to_produce: Number(quantity) });
      setLastWarnings(created.stock_warnings && created.stock_warnings.length > 0 ? created.stock_warnings : null);
      setShowForm(false);
      setProductId('');
      setQuantity('1');
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleStart = async (order: ProductionOrder) => {
    await updateProductionOrderStatus(order.id, 'en_cours');
    load();
  };

  const handleComplete = async (e: FormEvent) => {
    e.preventDefault();
    if (completingId === null) return;
    await updateProductionOrderStatus(completingId, 'termine', {
      labor_cost: Number(laborCost),
      overhead_cost: Number(overheadCost),
    });
    setCompletingId(null);
    setLaborCost('0');
    setOverheadCost('0');
    load();
  };

  const handleShowCost = async (order: ProductionOrder) => {
    const cost = await getProductionOrderCost(order.id);
    setCostFor((prev) => ({ ...prev, [order.id]: cost }));
  };

  const openEditQuantity = (order: ProductionOrder) => {
    setEditingOrder(order);
    setEditQuantity(String(order.quantity_to_produce));
    setEditError(null);
  };

  const handleEditQuantity = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setEditError(null);
    try {
      await updateProductionOrderQuantity(editingOrder.id, Number(editQuantity));
      setEditingOrder(null);
      load();
    } catch (err) {
      setEditError(extractErrorMessage(err, t('common.saveError')));
    }
  };

  const handleDelete = async (order: ProductionOrder) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setActionError(null);
    try {
      await deleteProductionOrder(order.id);
      load();
    } catch (err) {
      setActionError(extractErrorMessage(err, t('common.deleteError')));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('productionOrders.title')}</h1>
        <button onClick={() => setShowForm(true)}>{t('productionOrders.newOrder')}</button>
      </div>

      {actionError && <p className="error">{actionError}</p>}

      {lastWarnings && (
        <p className="error">
          {t('productionOrders.insufficientStockWarning', {
            details: lastWarnings.map((w) => `${w.raw_material_name} (${w.required}/${w.available})`).join(', '),
          })}
        </p>
      )}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.product')}</th>
              <th>{t('common.quantity')}</th>
              <th>{t('common.status')}</th>
              <th>{t('productionOrders.cost')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.product?.name}</td>
                <td>{o.quantity_to_produce}</td>
                <td><span className="badge" style={{ color: statusColor(o.status) }}>{t(`productionOrders.status.${o.status}`)}</span></td>
                <td>
                  {costFor[o.id] ? (
                    <span>{costFor[o.id].total} {costFor[o.id].estimated && t('productionOrders.estimated')}</span>
                  ) : (
                    <button className="secondary" onClick={() => handleShowCost(o)}>{t('common.view')}</button>
                  )}
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {o.status === 'planifie' && (
                    <button className="secondary" onClick={() => handleStart(o)}>{t('productionOrders.start')}</button>
                  )}
                  {o.status === 'en_cours' && (
                    <button className="secondary" onClick={() => setCompletingId(o.id)}>{t('productionOrders.complete')}</button>
                  )}
                  {canUpdate && o.status === 'planifie' && (
                    <button className="secondary" onClick={() => openEditQuantity(o)}>{t('common.edit')}</button>
                  )}
                  {canDelete && o.status === 'planifie' && (
                    <button className="secondary" onClick={() => handleDelete(o)}>{t('common.delete')}</button>
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
            <h2>{t('productionOrders.newOrderModalTitle')}</h2>
            <form onSubmit={handleCreate}>
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
                {t('productionOrders.quantityToProduce')}
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </label>
              <p style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                {t('productionOrders.bomHint')}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : t('common.create')}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {completingId !== null && (
        <div className="modal-backdrop" onClick={() => setCompletingId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('productionOrders.completeModalTitle')}</h2>
            <form onSubmit={handleComplete}>
              <label>
                {t('productionOrders.laborCost')}
                <input type="number" step="0.01" min={0} value={laborCost} onChange={(e) => setLaborCost(e.target.value)} />
              </label>
              <label>
                {t('productionOrders.overheadCost')}
                <input type="number" step="0.01" min={0} value={overheadCost} onChange={(e) => setOverheadCost(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit">{t('productionOrders.confirmComplete')}</button>
                <button type="button" className="secondary" onClick={() => setCompletingId(null)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingOrder && (
        <div className="modal-backdrop" onClick={() => setEditingOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('productionOrders.editQuantityModalTitle', { name: editingOrder.product?.name })}</h2>
            {editError && <p className="error">{editError}</p>}
            <form onSubmit={handleEditQuantity}>
              <label>
                {t('productionOrders.quantityToProduce')}
                <input type="number" min={1} value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit">{t('common.save')}</button>
                <button type="button" className="secondary" onClick={() => setEditingOrder(null)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
