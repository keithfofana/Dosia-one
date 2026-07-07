import { useEffect, useState, type FormEvent } from 'react';
import { createRawMaterial, listRawMaterials } from '../api/rawMaterials';
import { createRawMaterialMovement } from '../api/rawMaterialMovements';
import type { RawMaterial } from '../types/models';

export function RawMaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [unit, setUnit] = useState('kg');
  const [unitCost, setUnitCost] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createRawMaterial({ name, quantity: Number(quantity), unit, unit_cost: Number(unitCost) });
      setShowForm(false);
      setName('');
      setQuantity('0');
      setUnit('kg');
      setUnitCost('');
      load();
    } finally {
      setSaving(false);
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
        <button onClick={() => setShowForm(true)}>+ Nouvelle matière première</button>
      </div>

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
                <td><button className="secondary" onClick={() => setMovementFor(m)}>+ Mouvement</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouvelle matière première</h2>
            <form onSubmit={handleCreate}>
              <label>
                Nom
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Quantité en stock
                <input type="number" step="0.01" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </label>
              <label>
                Unité
                <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, litre, unité..." required />
              </label>
              <label>
                Coût unitaire
                <input type="number" step="0.01" min={0} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : 'Créer'}</button>
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
