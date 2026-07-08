import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { createRawMaterial, deleteRawMaterial, listRawMaterials, updateRawMaterial } from '../api/rawMaterials';
import { createRawMaterialMovement } from '../api/rawMaterialMovements';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import type { RawMaterial } from '../types/models';

export function RawMaterialsPage() {
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
        await updateRawMaterial(editing.id, { name, unit, unit_cost: Number(unitCost), quantity: editing.quantity });
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
    if (!window.confirm('Confirmer la suppression ?')) return;
    setDeleteError(null);
    try {
      await deleteRawMaterial(material.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setDeleteError((message as string) ?? 'Suppression impossible.');
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
        <h1>Matières premières</h1>
        <button onClick={openCreate}>+ Nouvelle matière première</button>
      </div>

      {deleteError && <p className="error">{deleteError}</p>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Stock</th>
              <th>Unité</th>
              <th>Coût unitaire</th>
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
                  <button className="secondary" onClick={() => setMovementFor(m)}>+ Mouvement</button>
                  {canUpdate && <button className="secondary" onClick={() => openEdit(m)}>Modifier</button>}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(m)}>Supprimer</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Modifier la matière première' : 'Nouvelle matière première'}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Nom
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              {editing ? (
                <p className="hint">Pour modifier la quantité en stock, utilisez le bouton « + Mouvement ».</p>
              ) : (
                <label>
                  Quantité en stock
                  <input type="number" step="0.01" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                </label>
              )}
              <label>
                Unité
                <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, litre, unité..." required />
              </label>
              <label>
                Coût unitaire
                <input type="number" step="0.01" min={0} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : editing ? 'Enregistrer' : 'Créer'}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {movementFor && (
        <div className="modal-backdrop" onClick={() => setMovementFor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Mouvement de stock — {movementFor.name}</h2>
            <form onSubmit={handleMovement}>
              <label>
                Type
                <select value={movementType} onChange={(e) => setMovementType(e.target.value as typeof movementType)}>
                  <option value="entree">Entrée</option>
                  <option value="sortie">Sortie</option>
                  <option value="ajustement">Ajustement (nouvelle quantité totale)</option>
                </select>
              </label>
              <label>
                Quantité
                <input type="number" step="0.01" min={0.01} value={movementQuantity} onChange={(e) => setMovementQuantity(e.target.value)} required />
              </label>
              <label>
                Motif (optionnel)
                <input value={movementReason} onChange={(e) => setMovementReason(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={movementSaving}>{movementSaving ? '...' : 'Enregistrer'}</button>
                <button type="button" className="secondary" onClick={() => setMovementFor(null)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
