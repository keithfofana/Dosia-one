import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { createProduct, listProducts } from '../api/products';
import type { Product } from '../types/models';

export function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [unit, setUnit] = useState('unite');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listProducts().then((res) => setProducts(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createProduct({
        name,
        purchase_price: purchasePrice,
        sale_price: salePrice,
        quantity: Number(quantity),
        unit,
      });
      setShowForm(false);
      setName('');
      setPurchasePrice('');
      setSalePrice('');
      setQuantity('0');
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('products.title')}</h1>
        <button onClick={() => setShowForm(true)}>{t('products.newProduct')}</button>
      </div>

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
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('products.newProductModalTitle')}</h2>
            <form onSubmit={handleCreate}>
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
              <label>
                {t('products.initialQuantity')}
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </label>
              <label>
                {t('products.unit')}
                <input value={unit} onChange={(e) => setUnit(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
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
