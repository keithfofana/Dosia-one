import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
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
import type { Product, ProductionCostSummary, ProductionOrder, StockWarning } from '../types/models';

const statusLabel: Record<ProductionOrder['status'], string> = {
  planifie: 'Planifié',
  en_cours: 'En cours',
  termine: 'Terminé',
};

const statusColor = (status: ProductionOrder['status']) => {
  if (status === 'termine') return 'var(--success)';
  if (status === 'en_cours') return undefined;
  return undefined;
};

export function ProductionOrdersPage() {
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
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setEditError((message as string) ?? 'Modification impossible.');
    }
  };

  const handleDelete = async (order: ProductionOrder) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setActionError(null);
    try {
      await deleteProductionOrder(order.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setActionError((message as string) ?? 'Suppression impossible.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Ordres de fabrication</h1>
        <button onClick={() => setShowForm(true)}>+ Nouvel ordre</button>
      </div>

      {actionError && <p className="error">{actionError}</p>}

      {lastWarnings && (
        <p className="error">
          Stock de matières premières insuffisant pour cet ordre :{' '}
          {lastWarnings.map((w) => `${w.raw_material_name} (besoin ${w.required}, disponible ${w.available})`).join(', ')}.
          L'ordre a été créé mais ne pourra pas démarrer tant que le stock n'est pas réapprovisionné.
        </p>
      )}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Statut</th>
              <th>Coût</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.product?.name}</td>
                <td>{o.quantity_to_produce}</td>
                <td><span className="badge" style={{ color: statusColor(o.status) }}>{statusLabel[o.status]}</span></td>
                <td>
                  {costFor[o.id] ? (
                    <span>{costFor[o.id].total} {costFor[o.id].estimated && '(estimé)'}</span>
                  ) : (
                    <button className="secondary" onClick={() => handleShowCost(o)}>Voir</button>
                  )}
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {o.status === 'planifie' && (
                    <button className="secondary" onClick={() => handleStart(o)}>Démarrer</button>
                  )}
                  {o.status === 'en_cours' && (
                    <button className="secondary" onClick={() => setCompletingId(o.id)}>Terminer</button>
                  )}
                  {canUpdate && o.status === 'planifie' && (
                    <button className="secondary" onClick={() => openEditQuantity(o)}>Modifier</button>
                  )}
                  {canDelete && o.status === 'planifie' && (
                    <button className="secondary" onClick={() => handleDelete(o)}>Supprimer</button>
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
            <h2>Nouvel ordre de fabrication</h2>
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
                Quantité à produire
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </label>
              <p style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                Le produit doit avoir une nomenclature définie (menu « Nomenclature (BOM) ») avant de créer un ordre.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : 'Créer'}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {completingId !== null && (
        <div className="modal-backdrop" onClick={() => setCompletingId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Terminer l'ordre de fabrication</h2>
            <form onSubmit={handleComplete}>
              <label>
                Main d'œuvre
                <input type="number" step="0.01" min={0} value={laborCost} onChange={(e) => setLaborCost(e.target.value)} />
              </label>
              <label>
                Charges indirectes
                <input type="number" step="0.01" min={0} value={overheadCost} onChange={(e) => setOverheadCost(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit">Confirmer la fin de production</button>
                <button type="button" className="secondary" onClick={() => setCompletingId(null)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingOrder && (
        <div className="modal-backdrop" onClick={() => setEditingOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Modifier la quantité — {editingOrder.product?.name}</h2>
            {editError && <p className="error">{editError}</p>}
            <form onSubmit={handleEditQuantity}>
              <label>
                Quantité à produire
                <input type="number" min={1} value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit">Enregistrer</button>
                <button type="button" className="secondary" onClick={() => setEditingOrder(null)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
