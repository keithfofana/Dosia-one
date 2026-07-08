import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { listProducts } from '../api/products';
import { createStockMovement, getStockVariation, listStockMovements } from '../api/stockMovements';
import type { Product, StockMovement, StockVariation } from '../types/models';

export function StockMovementsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [variation, setVariation] = useState<StockVariation | null>(null);
  const [variationLoading, setVariationLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formProductId, setFormProductId] = useState<number | ''>('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listProducts().then((res) => setProducts(res.data));
  }, []);

  const load = () => {
    setLoading(true);
    listStockMovements({
      product_id: productId || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    })
      .then((res) => setMovements(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [productId, dateFrom, dateTo]);

  useEffect(() => {
    if (!productId) {
      setVariation(null);
      return;
    }
    setVariationLoading(true);
    getStockVariation(productId, dateFrom || undefined, dateTo || undefined)
      .then(setVariation)
      .finally(() => setVariationLoading(false));
  }, [productId, dateFrom, dateTo]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formProductId) return;
    if (!formReason.trim()) {
      setFormError(t('stockMovements.reasonRequired'));
      return;
    }
    setSaving(true);
    try {
      await createStockMovement({
        product_id: formProductId,
        type: 'ajustement',
        quantity: Number(formQuantity),
        reason: formReason,
      });
      setShowForm(false);
      setFormProductId('');
      setFormQuantity('');
      setFormReason('');
      load();
      if (formProductId === productId) {
        getStockVariation(productId, dateFrom || undefined, dateTo || undefined).then(setVariation);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('stockMovements.title')}</h1>
        <button onClick={() => setShowForm(true)}>{t('stockMovements.newMovement')}</button>
      </div>

      <div className="item-row" style={{ gridTemplateColumns: '2fr 1fr 1fr', marginBottom: 24 }}>
        <label>
          {t('stockMovements.filterProduct')}
          <select value={productId} onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">{t('stockMovements.filterAllProducts')}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label>
          {t('stockMovements.filterDateFrom')}
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          {t('stockMovements.filterDateTo')}
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
      </div>

      <h2>{t('stockMovements.variation')}</h2>
      {!productId ? (
        <p className="text-muted">{t('stockMovements.selectProductForVariation')}</p>
      ) : variationLoading ? (
        <p>{t('common.loading')}</p>
      ) : variation ? (
        <div className="card-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="text-muted">{t('stockMovements.openingQuantity')}</div>
            <div className="value">{variation.opening_quantity}</div>
          </div>
          <div className="stat-card">
            <div className="text-muted">{t('stockMovements.closingQuantity')}</div>
            <div className="value">{variation.closing_quantity}</div>
          </div>
          <div className="stat-card">
            <div className="text-muted">{t('stockMovements.netVariation')}</div>
            <div className="value" style={{ color: variation.variation < 0 ? 'var(--danger)' : variation.variation > 0 ? 'var(--success)' : undefined }}>
              {variation.variation > 0 ? '+' : ''}{variation.variation}
            </div>
          </div>
        </div>
      ) : null}

      <h2>{t('stockMovements.history')}</h2>
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : movements.length === 0 ? (
        <p className="text-muted">{t('stockMovements.noMovements')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.date')}</th>
              <th>{t('common.product')}</th>
              <th>{t('common.type')}</th>
              <th>{t('common.quantity')}</th>
              <th>{t('common.reason')}</th>
              <th>{t('common.user')}</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.created_at).toLocaleString()}</td>
                <td>{m.product?.name}</td>
                <td><span className="badge">{t(`stockMovements.type.${m.type}`)}</span></td>
                <td>{m.quantity}</td>
                <td>{m.reason ?? '—'}</td>
                <td>{m.user?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('stockMovements.newMovementModalTitle')}</h2>
            <form onSubmit={handleCreate}>
              <label>
                {t('stockMovements.filterProduct')}
                <select value={formProductId} onChange={(e) => setFormProductId(e.target.value ? Number(e.target.value) : '')} required>
                  <option value="">{t('common.choose')}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit})</option>
                  ))}
                </select>
              </label>
              <label>
                {t('stockMovements.adjustmentQuantityLabel')}
                <input type="number" min={0} value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} required />
              </label>
              <label>
                {t('stockMovements.reasonLabel')}
                <input value={formReason} onChange={(e) => setFormReason(e.target.value)} required />
              </label>
              {formError && <p className="error">{formError}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : t('common.save')}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
