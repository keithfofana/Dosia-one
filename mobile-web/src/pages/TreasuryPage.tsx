import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import {
  createBankAccount,
  createCashRegister,
  deleteBankAccount,
  deleteCashRegister,
  depositToCashRegister,
  getTreasuryForecast,
  listBankAccounts,
  listCashRegisters,
  updateBankAccount,
  updateCashRegister,
  withdrawFromCashRegister,
} from '../api/treasury';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import type { BankAccount, CashRegister, TreasuryForecast } from '../types/models';

export function TreasuryPage() {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'tresorerie.update');
  const canDelete = hasPermission(user, 'tresorerie.delete');

  const [forecast, setForecast] = useState<TreasuryForecast | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankError, setBankError] = useState<string | null>(null);

  const [showCashForm, setShowCashForm] = useState(false);
  const [editingCash, setEditingCash] = useState<CashRegister | null>(null);
  const [cashName, setCashName] = useState('');
  const [cashError, setCashError] = useState<string | null>(null);

  const [movementRegister, setMovementRegister] = useState<CashRegister | null>(null);
  const [movementType, setMovementType] = useState<'deposit' | 'withdraw'>('deposit');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const openCreateBank = () => {
    setEditingBank(null);
    setBankError(null);
    setBankName('');
    setAccountNumber('');
    setShowBankForm(true);
  };

  const openEditBank = (account: BankAccount) => {
    setEditingBank(account);
    setBankError(null);
    setBankName(account.bank_name);
    setAccountNumber(account.account_number);
    setShowBankForm(true);
  };

  const handleSubmitBank = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setBankError(null);
    try {
      if (editingBank) {
        await updateBankAccount(editingBank.id, { bank_name: bankName, account_number: accountNumber });
      } else {
        await createBankAccount({ bank_name: bankName, account_number: accountNumber });
      }
      setShowBankForm(false);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setBankError((message as string) ?? 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBank = async (account: BankAccount) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setDeleteError(null);
    try {
      await deleteBankAccount(account.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setDeleteError((message as string) ?? 'Suppression impossible.');
    }
  };

  const openCreateCash = () => {
    setEditingCash(null);
    setCashError(null);
    setCashName('');
    setShowCashForm(true);
  };

  const openEditCash = (register: CashRegister) => {
    setEditingCash(register);
    setCashError(null);
    setCashName(register.name);
    setShowCashForm(true);
  };

  const handleSubmitCash = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setCashError(null);
    try {
      if (editingCash) {
        await updateCashRegister(editingCash.id, { name: cashName });
      } else {
        await createCashRegister({ name: cashName });
      }
      setShowCashForm(false);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setCashError((message as string) ?? 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCash = async (register: CashRegister) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setDeleteError(null);
    try {
      await deleteCashRegister(register.id);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? Object.values(err.response?.data?.errors ?? {})[0]?.[0] : undefined;
      setDeleteError((message as string) ?? 'Suppression impossible.');
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

      {deleteError && <p className="error">{deleteError}</p>}

      <div className="page-header">
        <h2>Comptes bancaires</h2>
        <button onClick={openCreateBank}>+ Nouveau compte</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Banque</th>
            <th>Numéro de compte</th>
            <th>Solde</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {bankAccounts.map((b) => (
            <tr key={b.id}>
              <td>{b.bank_name}</td>
              <td>{b.account_number}</td>
              <td>{b.balance}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                {canUpdate && <button className="secondary" onClick={() => openEditBank(b)}>Modifier</button>}
                {canDelete && <button className="secondary" onClick={() => handleDeleteBank(b)}>Supprimer</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="page-header" style={{ marginTop: 24 }}>
        <h2>Caisses</h2>
        <button onClick={openCreateCash}>+ Nouvelle caisse</button>
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
                {canUpdate && <button className="secondary" onClick={() => openEditCash(c)}>Modifier</button>}
                {canDelete && <button className="secondary" onClick={() => handleDeleteCash(c)}>Supprimer</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showBankForm && (
        <div className="modal-backdrop" onClick={() => setShowBankForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingBank ? 'Modifier le compte bancaire' : 'Nouveau compte bancaire'}</h2>
            {bankError && <p className="error">{bankError}</p>}
            <form onSubmit={handleSubmitBank}>
              <label>
                Banque
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} required />
              </label>
              <label>
                Numéro de compte
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : editingBank ? 'Enregistrer' : 'Créer'}</button>
                <button type="button" className="secondary" onClick={() => setShowBankForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCashForm && (
        <div className="modal-backdrop" onClick={() => setShowCashForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCash ? 'Modifier la caisse' : 'Nouvelle caisse'}</h2>
            {cashError && <p className="error">{cashError}</p>}
            <form onSubmit={handleSubmitCash}>
              <label>
                Nom
                <input value={cashName} onChange={(e) => setCashName(e.target.value)} required />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : editingCash ? 'Enregistrer' : 'Créer'}</button>
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
