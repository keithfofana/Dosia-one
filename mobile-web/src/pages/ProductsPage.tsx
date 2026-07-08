import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { createProduct, deleteProduct, listProducts, updateProduct } from '../api/products';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import type { Product } from '../types/models';

export function ProductsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'stock.update');
  const canDelete = hasPermission(user, 'stock.delete');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [unit, setUnit] = useState('unite');
  const [alertThreshold, setAlertThreshold] = useState('0');
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listProducts().then((res) => setProducts(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPurchasePrice('');
    setSalePrice('');
    setQuantity('0');
    setUnit('unite');
    setAlertThreshold('0');
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setName(product.name);
    setPurchasePrice(String(product.purchase_price));
    setSalePrice(String(product.sale_price));
    setUnit(product.unit);
    setAlertThreshold(String(product.alert_threshold));
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateProduct(editing.id, {
          name,
          purchase_price: purchasePrice,
          sale_price: salePrice,
          unit,
          alert_threshold: Number(alertThreshold),
        });
      } else {
        await createProduct({
          name,
          purchase_price: purchasePrice,
          sale_price: salePrice,
          quantity: Number(quantity),
          unit,
        });
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setDeleteError(null);
    try {
      await deleteProduct(product.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setDeleteError((message as string) ?? 'Suppression impossible.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('products.title')}</h1>
        <button onClick={openCreate}>{t('products.newProduct')}</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('products.purchasePrice')}</th>
              <th>{t('products.salePrice')}</th>
              <th>{t('products.stock')}</th>
              <th>{t('products.unit')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.purchase_price}</td>
                <td>{p.sale_price}</td>
                <td style={{ color: p.quantity <= p.alert_threshold ? 'var(--danger)' : undefined }}>
                  {p.quantity}
                </td>
                <td>{p.unit}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  {canUpdate && <button className="secondary" onClick={() => openEdit(p)}>{t('common.edit')}</button>}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(p)}>{t('common.delete')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? t('common.edit') : t('products.newProductModalTitle')}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                {t('common.name')}
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                {t('products.purchasePriceLabel')}
                <input type="number" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required />
              </label>
              <label>
                {t('products.salePriceLabel')}
                <input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required />
              </label>
              {editing ? (
                <label>
                  {t('products.alertThreshold')}
                  <input type="number" value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} required />
                </label>
              ) : (
                <label>
                  {t('products.initialQuantity')}
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                </label>
              )}
              <label>
                {t('products.unit')}
                <input value={unit} onChange={(e) => setUnit(e.target.value)} />
              </label>
              {editing && <p className="hint">{t('products.quantityEditHint')}</p>}
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
