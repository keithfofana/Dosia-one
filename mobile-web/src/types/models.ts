export interface Company {
  id: number;
  name: string;
  currency_symbol: string;
}

export interface Permission {
  id: number;
  module: string;
  action: string;
  slug: string;
}

export interface Role {
  id: number;
  company_id: number;
  name: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  company_id: number;
  role_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  two_factor_enabled: boolean;
  is_active: boolean;
  company?: Company;
  role?: Role | null;
}

export interface Client {
  id: number;
  company_id: number;
  name: string;
  type: 'particulier' | 'detaillant' | 'grossiste';
  phone: string | null;
  email: string | null;
  address: string | null;
  birthday: string | null;
  balance: string;
}

export interface Supplier {
  id: number;
  company_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface PurchaseRequest {
  id: number;
  company_id: number;
  product_id: number;
  quantity: number;
  status: 'en_attente' | 'validee' | 'refusee';
  requested_by: number | null;
  product?: Product;
  requested_by_user?: User;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  product?: Product;
}

export interface GoodsReceipt {
  id: number;
  purchase_order_id: number;
  product_id: number;
  quantity_received: number;
  product?: Product;
}

export interface PurchaseOrder {
  id: number;
  company_id: number;
  supplier_id: number;
  number: string;
  status: 'brouillon' | 'envoyee' | 'recue_partiel' | 'recue' | 'annulee';
  total: string;
  supplier?: Supplier;
  purchase_order_items?: PurchaseOrderItem[];
  goods_receipts?: GoodsReceipt[];
  created_at: string;
}

export interface BankAccount {
  id: number;
  company_id: number;
  bank_name: string;
  account_number: string;
  balance: string;
}

export interface CashRegister {
  id: number;
  company_id: number;
  name: string;
  balance: string;
}

export interface TreasuryForecast {
  current_treasury: { bank: number; cash: number; total: number };
  expected_inflows: { total: number; pending_invoices_count: number };
  expected_outflows: { total: number; pending_orders_count: number };
  projected_balance: number;
}

export interface ProductCategory {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  company_id: number;
  category_id: number | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  qrcode: string | null;
  purchase_price: string;
  sale_price: string;
  quantity: number;
  alert_threshold: number;
  unit: string;
  category?: ProductCategory | null;
}

export interface QuoteItem {
  id: number;
  quote_id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  product?: Product;
}

export interface Quote {
  id: number;
  company_id: number;
  client_id: number;
  number: string;
  status: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'converti';
  total: string;
  client?: Client;
  quote_items?: QuoteItem[];
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  product?: Product;
}

export interface Invoice {
  id: number;
  company_id: number;
  client_id: number;
  quote_id: number | null;
  number: string;
  status: 'due' | 'partiel' | 'paye' | 'annule';
  total: string;
  paid_amount: string;
  due_date: string | null;
  client?: Client;
  invoice_items?: InvoiceItem[];
  payments?: Payment[];
  created_at: string;
}

export interface Payment {
  id: number;
  company_id: number;
  invoice_id: number;
  amount: string;
  method: 'especes' | 'mobile_money' | 'virement' | 'cheque';
  created_at: string;
}

export interface Employee {
  id: number;
  company_id: number;
  user_id: number | null;
  name: string;
  position: string | null;
  hire_date: string | null;
  user?: User | null;
  salaries?: Salary[];
  attendances?: Attendance[];
  leaves?: Leave[];
  contracts?: Contract[];
  evaluations?: Evaluation[];
  leave_balance?: number;
}

export interface Salary {
  id: number;
  employee_id: number;
  amount: string;
  period_month: string;
  status: 'prevu' | 'paye';
  employee?: Employee;
}

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  is_late: boolean;
  employee?: Employee;
}

export interface Leave {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  status: 'en_attente' | 'approuve' | 'refuse';
  employee?: Employee;
}

export interface Contract {
  id: number;
  employee_id: number;
  type: string;
  start_date: string;
  end_date: string | null;
  employee?: Employee;
}

export interface Evaluation {
  id: number;
  employee_id: number;
  evaluation_date: string;
  score: number | null;
  notes: string | null;
  employee?: Employee;
}

export interface RawMaterial {
  id: number;
  company_id: number;
  name: string;
  quantity: string;
  unit: string;
  unit_cost: string;
}

export interface RawMaterialMovement {
  id: number;
  company_id: number;
  raw_material_id: number;
  type: 'entree' | 'sortie' | 'ajustement';
  quantity: string;
  reason: string | null;
  user_id: number | null;
  created_at: string;
  raw_material?: RawMaterial;
}

export interface BillOfMaterialLine {
  id: number;
  product_id: number | null;
  production_order_id: number | null;
  raw_material_id: number;
  quantity_used: string;
  raw_material?: RawMaterial;
}

export interface ProductionCost {
  id: number;
  production_order_id: number;
  material_cost: string;
  labor_cost: string;
  overhead_cost: string;
}

export interface StockWarning {
  raw_material_id: number;
  raw_material_name: string;
  required: number;
  available: number;
}

export interface ProductionOrder {
  id: number;
  company_id: number;
  product_id: number;
  quantity_to_produce: number;
  status: 'planifie' | 'en_cours' | 'termine';
  product?: Product;
  bill_of_materials?: BillOfMaterialLine[];
  production_costs?: ProductionCost[];
  stock_warnings?: StockWarning[];
  created_at: string;
}

export interface ProductionCostSummary {
  material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total: number;
  estimated: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qr_code: string;
}

export interface SessionInfo {
  id: number;
  name: string;
  last_used_at: string | null;
  created_at: string;
  is_current: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface DashboardSummary {
  chiffre_affaires: { total: number; mois_courant: number };
  depenses_total: number;
  benefice_estime: number;
  tresorerie: number;
}

export interface DashboardAlerts {
  stock_faible: Array<{ id: number; name: string; quantity: number; alert_threshold: number }>;
  factures_impayees: Invoice[];
  contrats_expirant: Contract[];
  anniversaires_clients: Array<{ id: number; name: string; birthday: string }>;
}

export interface ClientHistoryEntry {
  type: 'interaction' | 'quote' | 'invoice';
  date: string;
  data: unknown;
  channel?: string;
}

export interface ActivityLogEntry {
  id: number;
  company_id: number;
  user_id: number | null;
  action: string;
  module: string;
  description: string | null;
  created_at: string;
  user?: User | null;
}

export interface ChartOfAccount {
  id: number;
  company_id: number;
  code: string;
  name: string;
  type: 'actif' | 'passif' | 'charge' | 'produit' | 'capitaux';
}

export interface JournalEntryLine {
  id: number;
  journal_entry_id: number;
  account_id: number;
  debit: string;
  credit: string;
  account?: ChartOfAccount;
}

export interface JournalEntry {
  id: number;
  company_id: number;
  entry_date: string;
  reference: string | null;
  description: string | null;
  journal_entry_lines?: JournalEntryLine[];
  created_at: string;
}

export interface TrialBalanceRow {
  id: number;
  code: string;
  name: string;
  type: ChartOfAccount['type'];
  total_debit: number;
  total_credit: number;
  balance: number;
}

export interface BalanceSheetSection {
  accounts: TrialBalanceRow[];
  total: number;
}

export interface BalanceSheet {
  actif: BalanceSheetSection;
  passif: BalanceSheetSection;
  capitaux: BalanceSheetSection;
  equilibre: number;
}

export interface IncomeStatement {
  produits: BalanceSheetSection;
  charges: BalanceSheetSection;
  resultat_net: number;
}

export interface VatReport {
  tax_rates: Array<{ id: number; name: string; rate: string }>;
  comptes_tva: Array<{ account: string; debit: number; credit: number; solde: number }>;
  net_a_payer: number;
}

export interface LedgerMovement {
  date: string;
  reference: string | null;
  description: string | null;
  account: string;
  debit: string;
  credit: string;
  running_balance: number;
}
