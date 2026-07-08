import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { createRawMaterial, deleteRawMaterial, listRawMaterials, updateRawMaterial } from '../api/rawMaterials';
import { createRawMaterialMovement } from '../api/rawMaterialMovements';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { extractErrorMessage } from '../utils/errors';
import type { RawMaterial } from '../types/models';

export function RawMaterialsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'production.update');
  const canDelete = hasPermission(user, 'production.delete');

  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [unit, setUnit] = useState('kg');
  const [unitCost, setUnitCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [movementFor, setMovementFor] = useState<RawMaterial | null>(null);
  const [movementType, setMovementType] = useState<'entree' | 'sortie' | 'ajustement'>('entree');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [movementSaving, setMovementSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listRawMaterials().then((res) => setMaterials(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setQuantity('0');
    setUnit('kg');
    setUnitCost('');
    setShowForm(true);
  };

  const openEdit = (material: RawMaterial) => {
    setEditing(material);
    setName(material.name);
    setUnit(material.unit);
    setUnitCost(String(material.unit_cost));
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateRawMaterial(editing.id, { name, unit, unit_cost: Number(unitCost), quantity: Number(editing.quantity) });
      } else {
        await createRawMaterial({ name, quantity: Number(quantity), unit, unit_cost: Number(unitCost) });
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (material: RawMaterial) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setDeleteError(null);
    try {
      await deleteRawMaterial(material.id);
      load();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, t('common.deleteError')));
    }
  };

  const handleMovement = async (e: FormEvent) => {
    e.preventDefault();
    if (!movementFor) return;
    setMovementSaving(true);
    try {
      await createRawMaterialMovement({
        raw_material_id: movementFor.id,
        type: movementType,
        quantity: Number(movementQuantity),
        reason: movementReason || undefined,
      });
      setMovementFor(null);
      setMovementType('entree');
      setMovementQuantity('');
      setMovementReason('');
      load();
    } finally {
      setMovementSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('rawMaterials.title')}</h1>
        <button onClick={openCreate}>{t('rawMaterials.newMaterial')}</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('products.stock')}</th>
              <th>{t('products.unit')}</th>
              <th>{t('rawMaterials.unitCost')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.quantity}</td>
                <td>{m.unit}</td>
                <td>{m.unit_cost}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="secondary" onClick={() => setMovementFor(m)}>{t('rawMaterials.addMovement')}</button>
                  {canUpdate && <button className="secondary" onClick={() => openEdit(m)}>{t('common.edit')}</button>}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(m)}>{t('common.delete')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? t('common.edit') : t('rawMaterials.newMaterialModalTitle')}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                {t('common.name')}
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              {editing ? (
                <p className="hint">{t('rawMaterials.quantityEditHint')}</p>
              ) : (
                <label>
                  {t('rawMaterials.quantityInStock')}
                  <input type="number" step="0.01" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                </label>
              )}
              <label>
                {t('products.unit')}
                <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={t('rawMaterials.unitPlaceholder')} required />
              </label>
              <label>
                {t('rawMaterials.unitCost')}
                <input type="number" step="0.01" min={0} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : editing ? t('common.save') : t('common.create')}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {movementFor && (
        <div className="modal-backdrop" onClick={() => setMovementFor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('rawMaterials.movementModalTitle', { name: movementFor.name })}</h2>
            <form onSubmit={handleMovement}>
              <label>
                {t('common.type')}
                <select value={movementType} onChange={(e) => setMovementType(e.target.value as typeof movementType)}>
                  <option value="entree">{t('stockMovements.type.entree')}</option>
                  <option value="sortie">{t('stockMovements.type.sortie')}</option>
                  <option value="ajustement">{t('rawMaterials.adjustmentTypeLabel')}</option>
                </select>
              </label>
              <label>
                {t('common.quantity')}
                <input type="number" step="0.01" min={0.01} value={movementQuantity} onChange={(e) => setMovementQuantity(e.target.value)} required />
              </label>
              <label>
                {t('rawMaterials.movementReasonOptional')}
                <input value={movementReason} onChange={(e) => setMovementReason(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={movementSaving}>{movementSaving ? '...' : t('common.save')}</button>
                <button type="button" className="secondary" onClick={() => setMovementFor(null)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
