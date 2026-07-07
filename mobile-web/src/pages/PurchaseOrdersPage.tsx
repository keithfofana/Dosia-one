import { useEffect, useState, type FormEvent } from 'react';
import { createPurchaseOrder, getPurchaseOrder, listPurchaseOrders, receivePurchaseOrder, type PurchaseOrderItemInput, type ReceiveItemInput } from '../api/purchaseOrders';
import { listSuppliers } from '../api/suppliers';
import { listProducts } from '../api/products';
import type { Product, PurchaseOrder, Supplier } from '../types/models';

const statusColor = (status: PurchaseOrder['status']) => {
  if (status === 'recue') return 'var(--success)';
  if (status === 'annulee') return 'var(--danger)';
  return undefined;
};

export function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [items, setItems] = useState<PurchaseOrderItemInput[]>([{ product_id: 0, quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<number, number>>({});

  const load = () => {
    setLoading(true);
    listPurchaseOrders().then((res) => setOrders(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => {
    listSuppliers().then((res) => setSuppliers(res.data));
    listProducts().then((res) => setProducts(res.data));
  }, []);

  const updateItem = (index: number, patch: Partial<PurchaseOrderItemInput>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { product_id: 0, quantity: 1, unit_price: 0 }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    updateItem(index, { product_id: productId, unit_price: product ? Number(product.purchase_price) : 0 });
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!supplierId) return;
    setSaving(true);
    try {
      await createPurchaseOrder(supplierId, items.filter((it) => it.product_id > 0));
      setShowForm(false);
      setItems([{ product_id: 0, quantity: 1, unit_price: 0 }]);
      setSupplierId('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const openReceive = async (order: PurchaseOrder) => {
    const fullOrder = await getPurchaseOrder(order.id);
    setReceivingOrder(fullOrder);
    const initial: Record<number, number> = {};
    fullOrder.purchase_order_items?.forEach((item) => {
      initial[item.product_id] = 0;
    });
    setReceiveQuantities(initial);
  };

  const handleReceive = async () => {
    if (!receivingOrder) return;
    const items: ReceiveItemInput[] = Object.entries(receiveQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => ({ product_id: Number(productId), quantity_received: qty }));

    if (items.length === 0) return;

    setSaving(true);
    try {
      await receivePurchaseOrder(receivingOrder.id, items);
      setReceivingOrder(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Commandes fournisseurs</h1>
        <button onClick={() => setShowForm(true)}>+ Nouvelle commande</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Fournisseur</th>
              <th>Statut</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.number}</td>
                <td>{o.supplier?.name}</td>
                <td><span className="badge" style={{ color: statusColor(o.status) }}>{o.status}</span></td>
                <td>{o.total}</td>
                <td>
                  {(o.status === 'brouillon' || o.status === 'envoyee' || o.status === 'recue_partiel') && (
                    <button className="secondary" onClick={() => openReceive(o)}>Réceptionner</button>
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
            <h2>Nouvelle commande fournisseur</h2>
            <form onSubmit={handleCreate}>
              <label>
                Fournisseur
                <select value={supplierId} onChange={(e) => setSupplierId(Number(e.target.value))} required>
                  <option value="">-- Choisir --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
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

      {receivingOrder && (
        <div className="modal-backdrop" onClick={() => setReceivingOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Réception — {receivingOrder.number}</h2>
            {receivingOrder.purchase_order_items?.map((item) => {
              const alreadyReceived = receivingOrder.goods_receipts
                ?.filter((g) => g.product_id === item.product_id)
                .reduce((sum, g) => sum + g.quantity_received, 0) ?? 0;
              const remaining = item.quantity - alreadyReceived;

              return (
                <label key={item.id}>
                  {item.product?.name} (commandé : {item.quantity}, restant : {remaining})
                  <input
                    type="number"
                    min={0}
                    max={remaining}
                    value={receiveQuantities[item.product_id] ?? 0}
                    onChange={(e) => setReceiveQuantities((prev) => ({ ...prev, [item.product_id]: Number(e.target.value) }))}
                  />
                </label>
              );
            })}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={handleReceive} disabled={saving}>{saving ? '...' : 'Confirmer la réception'}</button>
              <button type="button" className="secondary" onClick={() => setReceivingOrder(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
