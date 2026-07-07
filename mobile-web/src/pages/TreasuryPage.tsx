import { useEffect, useState, type FormEvent } from 'react';
import {
  createBankAccount,
  createCashRegister,
  depositToCashRegister,
  getTreasuryForecast,
  listBankAccounts,
  listCashRegisters,
  withdrawFromCashRegister,
} from '../api/treasury';
import type { BankAccount, CashRegister, TreasuryForecast } from '../types/models';

export function TreasuryPage() {
  const [forecast, setForecast] = useState<TreasuryForecast | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBankForm, setShowBankForm] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const [showCashForm, setShowCashForm] = useState(false);
  const [cashName, setCashName] = useState('');

  const [movementRegister, setMovementRegister] = useState<CashRegister | null>(null);
  const [movementType, setMovementType] = useState<'deposit' | 'withdraw'>('deposit');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getTreasuryForecast(), listBankAccounts(), listCashRegisters()])
      .then(([f, banks, registers]) => {
        setForecast(f);
        setBankAccounts(banks.data);
        setCashRegisters(registers.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreateBank = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createBankAccount({ bank_name: bankName, account_number: accountNumber });
      setShowBankForm(false);
      setBankName('');
      setAccountNumber('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCash = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createCashRegister({ name: cashName });
      setShowCashForm(false);
      setCashName('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const openMovement = (register: CashRegister, type: 'deposit' | 'withdraw') => {
    setMovementRegister(register);
    setMovementType(type);
    setMovementAmount('');
    setMovementReason('');
    setError(null);
  };

  const handleMovement = async (e: FormEvent) => {
    e.preventDefault();
    if (!movementRegister) return;
    setError(null);
    setSaving(true);
    try {
      if (movementType === 'deposit') {
        await depositToCashRegister(movementRegister.id, Number(movementAmount), movementReason || undefined);
      } else {
        await withdrawFromCashRegister(movementRegister.id, Number(movementAmount), movementReason || undefined);
      }
      setMovementRegister(null);
      load();
    } catch {
      setError('Solde de caisse insuffisant ou montant invalide.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h1>Trésorerie</h1>

      <div className="card-grid">
        <div className="stat-card">
          <div className="text-muted">Trésorerie actuelle</div>
          <div className="value">{forecast?.current_treasury.total.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted">Encaissements attendus</div>
          <div className="value">{forecast?.expected_inflows.total.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted">Décaissements attendus</div>
          <div className="value">{forecast?.expected_outflows.total.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted">Solde prévisionnel</div>
          <div className="value">{forecast?.projected_balance.toLocaleString()}</div>
        </div>
      </div>

      <div className="page-header">
        <h2>Comptes bancaires</h2>
        <button onClick={() => setShowBankForm(true)}>+ Nouveau compte</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Banque</th>
            <th>Numéro de compte</th>
            <th>Solde</th>
          </tr>
        </thead>
        <tbody>
          {bankAccounts.map((b) => (
            <tr key={b.id}>
              <td>{b.bank_name}</td>
              <td>{b.account_number}</td>
              <td>{b.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="page-header" style={{ marginTop: 24 }}>
        <h2>Caisses</h2>
        <button onClick={() => setShowCashForm(true)}>+ Nouvelle caisse</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Solde</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cashRegisters.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.balance}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button className="secondary" onClick={() => openMovement(c, 'deposit')}>Dépôt</button>
                <button className="secondary" onClick={() => openMovement(c, 'withdraw')}>Retrait</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showBankForm && (
        <div className="modal-backdrop" onClick={() => setShowBankForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouveau compte bancaire</h2>
            <form onSubmit={handleCreateBank}>
              <label>
                Banque
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} required />
              </label>
              <label>
                Numéro de compte
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : 'Créer'}</button>
                <button type="button" className="secondary" onClick={() => setShowBankForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCashForm && (
        <div className="modal-backdrop" onClick={() => setShowCashForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouvelle caisse</h2>
            <form onSubmit={handleCreateCash}>
              <label>
                Nom
                <input value={cashName} onChange={(e) => setCashName(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : 'Créer'}</button>
                <button type="button" className="secondary" onClick={() => setShowCashForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {movementRegister && (
        <div className="modal-backdrop" onClick={() => setMovementRegister(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{movementType === 'deposit' ? 'Dépôt' : 'Retrait'} — {movementRegister.name}</h2>
            <p>Solde actuel : {movementRegister.balance}</p>
            <form onSubmit={handleMovement}>
              <label>
                Montant
                <input type="number" step="0.01" min="0.01" value={movementAmount} onChange={(e) => setMovementAmount(e.target.value)} required />
              </label>
              <label>
                Motif
                <input value={movementReason} onChange={(e) => setMovementReason(e.target.value)} />
              </label>
              {error && <p className="error">{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : 'Confirmer'}</button>
                <button type="button" className="secondary" onClick={() => setMovementRegister(null)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
