import { useEffect, useState } from 'react';
import {
  exportReport,
  getBalance,
  getBalanceSheet,
  getIncomeStatement,
  getLedger,
  getVat,
} from '../api/accounting';
import { listChartOfAccounts } from '../api/accounting';
import type { BalanceSheet, ChartOfAccount, IncomeStatement, LedgerMovement, TrialBalanceRow, VatReport } from '../types/models';

type Tab = 'balance' | 'bilan' | 'resultat' | 'tva' | 'grand-livre';

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'balance', label: 'Balance' },
  { id: 'bilan', label: 'Bilan' },
  { id: 'resultat', label: 'Compte de résultat' },
  { id: 'tva', label: 'TVA' },
  { id: 'grand-livre', label: 'Grand livre' },
];

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('balance');
  const [balance, setBalance] = useState<TrialBalanceRow[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [vat, setVat] = useState<VatReport | null>(null);
  const [ledger, setLedger] = useState<LedgerMovement[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [ledgerAccountId, setLedgerAccountId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    listChartOfAccounts().then((res) => setAccounts(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      if (tab === 'balance') setBalance(await getBalance());
      if (tab === 'bilan') setBalanceSheet(await getBalanceSheet());
      if (tab === 'resultat') setIncomeStatement(await getIncomeStatement());
      if (tab === 'tva') setVat(await getVat());
      if (tab === 'grand-livre') setLedger(await getLedger(ledgerAccountId ? { account_id: ledgerAccountId } : {}));
    };
    load().finally(() => setLoading(false));
  }, [tab, ledgerAccountId]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    try {
      const blob = await exportReport(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `balance-generale.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Rapports comptables</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary" onClick={() => handleExport('excel')} disabled={exporting}>Export Excel</button>
          <button className="secondary" onClick={() => handleExport('pdf')} disabled={exporting}>Export PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? '' : 'secondary'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          {tab === 'balance' && (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Compte</th>
                  <th>Débit</th>
                  <th>Crédit</th>
                  <th>Solde</th>
                </tr>
              </thead>
              <tbody>
                {balance.map((row) => (
                  <tr key={row.id}>
                    <td>{row.code}</td>
                    <td>{row.name}</td>
                    <td>{row.total_debit.toFixed(2)}</td>
                    <td>{row.total_credit.toFixed(2)}</td>
                    <td>{row.balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'bilan' && balanceSheet && (
            <div className="card-grid">
              <div className="stat-card">
                <h3>Actif</h3>
                <div className="value">{balanceSheet.actif.total.toFixed(2)}</div>
                {balanceSheet.actif.accounts.map((a) => (
                  <div key={a.id} className="text-muted">{a.name} : {a.balance.toFixed(2)}</div>
                ))}
              </div>
              <div className="stat-card">
                <h3>Passif</h3>
                <div className="value">{balanceSheet.passif.total.toFixed(2)}</div>
                {balanceSheet.passif.accounts.map((a) => (
                  <div key={a.id} className="text-muted">{a.name} : {a.balance.toFixed(2)}</div>
                ))}
              </div>
              <div className="stat-card">
                <h3>Capitaux</h3>
                <div className="value">{balanceSheet.capitaux.total.toFixed(2)}</div>
                {balanceSheet.capitaux.accounts.map((a) => (
                  <div key={a.id} className="text-muted">{a.name} : {a.balance.toFixed(2)}</div>
                ))}
              </div>
              <div className="stat-card">
                <h3>Résultat non affecté</h3>
                <div className="value">{balanceSheet.equilibre.toFixed(2)}</div>
                <div className="text-muted">Actif − (Passif + Capitaux)</div>
              </div>
            </div>
          )}

          {tab === 'resultat' && incomeStatement && (
            <div className="card-grid">
              <div className="stat-card">
                <h3>Produits</h3>
                <div className="value">{incomeStatement.produits.total.toFixed(2)}</div>
                {incomeStatement.produits.accounts.map((a) => (
                  <div key={a.id} className="text-muted">{a.name} : {a.balance.toFixed(2)}</div>
                ))}
              </div>
              <div className="stat-card">
                <h3>Charges</h3>
                <div className="value">{incomeStatement.charges.total.toFixed(2)}</div>
                {incomeStatement.charges.accounts.map((a) => (
                  <div key={a.id} className="text-muted">{a.name} : {a.balance.toFixed(2)}</div>
                ))}
              </div>
              <div className="stat-card">
                <h3>Résultat net</h3>
                <div className="value">{incomeStatement.resultat_net.toFixed(2)}</div>
              </div>
            </div>
          )}

          {tab === 'tva' && vat && (
            <div>
              <div className="card-grid">
                <div className="stat-card">
                  <h3>Net à payer</h3>
                  <div className="value">{vat.net_a_payer.toFixed(2)}</div>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Compte</th>
                    <th>Débit</th>
                    <th>Crédit</th>
                    <th>Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {vat.comptes_tva.map((c) => (
                    <tr key={c.account}>
                      <td>{c.account}</td>
                      <td>{c.debit.toFixed(2)}</td>
                      <td>{c.credit.toFixed(2)}</td>
                      <td>{c.solde.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'grand-livre' && (
            <div>
              <label style={{ maxWidth: 300, marginBottom: 16 }}>
                Compte
                <select value={ledgerAccountId} onChange={(e) => setLedgerAccountId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Tous</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </label>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Référence</th>
                    <th>Compte</th>
                    <th>Débit</th>
                    <th>Crédit</th>
                    <th>Solde courant</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((m, idx) => (
                    <tr key={idx}>
                      <td>{new Date(m.date).toLocaleDateString()}</td>
                      <td>{m.reference}</td>
                      <td>{m.account}</td>
                      <td>{Number(m.debit) > 0 ? m.debit : ''}</td>
                      <td>{Number(m.credit) > 0 ? m.credit : ''}</td>
                      <td>{m.running_balance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
