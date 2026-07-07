import { useEffect, useState } from 'react';
import { getBillOfMaterial, updateBillOfMaterial } from '../api/billOfMaterials';
import { listProducts } from '../api/products';
import { listRawMaterials } from '../api/rawMaterials';
import type { Product, RawMaterial } from '../types/models';

interface Row {
  raw_material_id: number | '';
  quantity_per_unit: string;
}

export function BillOfMaterialsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [productId, setProductId] = useState<number | ''>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    listProducts().then((res) => setProducts(res.data));
    listRawMaterials().then((res) => setRawMaterials(res.data));
  }, []);

  useEffect(() => {
    if (!productId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setSaved(false);
    getBillOfMaterial(Number(productId))
      .then((lines) => {
        setRows(
          lines.length > 0
            ? lines.map((l) => ({ raw_material_id: l.raw_material_id, quantity_per_unit: l.quantity_used }))
            : [{ raw_material_id: '', quantity_per_unit: '' }]
        );
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const addRow = () => setRows((prev) => [...prev, { raw_material_id: '', quantity_per_unit: '' }]);
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));
  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    if (!productId) return;
    const items = rows
      .filter((r) => r.raw_material_id !== '' && r.quantity_per_unit !== '')
      .map((r) => ({ raw_material_id: Number(r.raw_material_id), quantity_per_unit: Number(r.quantity_per_unit) }));
    if (items.length === 0) return;
    setSaving(true);
    try {
      await updateBillOfMaterial(Number(productId), items);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Nomenclature (BOM)</h1>
      </div>

      <label>
        Produit
        <select value={productId} onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">-- Choisir un produit --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>

      {productId && (
        loading ? (
          <p>Chargement...</p>
        ) : (
          <div style={{ marginTop: 16 }}>
            <p>Matières premières nécessaires pour fabriquer <strong>1 unité</strong> de ce produit :</p>
            {rows.map((row, idx) => (
              <div key={idx} className="item-row">
                <select
                  value={row.raw_material_id}
                  onChange={(e) => updateRow(idx, { raw_material_id: e.target.value ? Number(e.target.value) : '' })}
                >
                  <option value="">-- Matière première --</option>
                  {rawMaterials.map((rm) => (
                    <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  placeholder="Quantité par unité"
                  value={row.quantity_per_unit}
                  onChange={(e) => updateRow(idx, { quantity_per_unit: e.target.value })}
                />
                <button type="button" className="secondary" onClick={() => removeRow(idx)}>Retirer</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" className="secondary" onClick={addRow}>+ Ligne</button>
              <button type="button" onClick={handleSave} disabled={saving}>{saving ? '...' : 'Enregistrer la nomenclature'}</button>
            </div>
            {saved && <p style={{ color: 'var(--success)' }}>Nomenclature enregistrée.</p>}
          </div>
        )
      )}
    </div>
  );
}
