import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionRoute } from './components/PermissionRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { QuotesPage } from './pages/QuotesPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { PurchaseRequestsPage } from './pages/PurchaseRequestsPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { TreasuryPage } from './pages/TreasuryPage';
import { ChartOfAccountsPage } from './pages/ChartOfAccountsPage';
import { JournalEntriesPage } from './pages/JournalEntriesPage';
import { ReportsPage } from './pages/ReportsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { SalariesPage } from './pages/SalariesPage';
import { AttendancesPage } from './pages/AttendancesPage';
import { LeavesPage } from './pages/LeavesPage';
import { ContractsPage } from './pages/ContractsPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { RawMaterialsPage } from './pages/RawMaterialsPage';
import { BillOfMaterialsPage } from './pages/BillOfMaterialsPage';
import { ProductionOrdersPage } from './pages/ProductionOrdersPage';
import { SecurityPage } from './pages/SecurityPage';
import { StockMovementsPage } from './pages/StockMovementsPage';
import { DocumentsPage } from './pages/DocumentsPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="stock-movements" element={<StockMovementsPage />} />
          <Route
            path="documents"
            element={
              <PermissionRoute permission="documents.view">
                <DocumentsPage />
              </PermissionRoute>
            }
          />
          <Route path="quotes" element={<QuotesPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route
            path="suppliers"
            element={
              <PermissionRoute permission="achats.view">
                <SuppliersPage />
              </PermissionRoute>
            }
          />
          <Route
            path="purchase-requests"
            element={
              <PermissionRoute permission="achats.view">
                <PurchaseRequestsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="purchase-orders"
            element={
              <PermissionRoute permission="achats.view">
                <PurchaseOrdersPage />
              </PermissionRoute>
            }
          />
          <Route
            path="treasury"
            element={
              <PermissionRoute permission="tresorerie.view">
                <TreasuryPage />
              </PermissionRoute>
            }
          />
          <Route
            path="accounting/chart-of-accounts"
            element={
              <PermissionRoute permission="comptabilite.view">
                <ChartOfAccountsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="accounting/journal-entries"
            element={
              <PermissionRoute permission="comptabilite.view">
                <JournalEntriesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="accounting/reports"
            element={
              <PermissionRoute permission="comptabilite.view">
                <ReportsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="rh/employees"
            element={
              <PermissionRoute permission="rh.view">
                <EmployeesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="rh/employees/:id"
            element={
              <PermissionRoute permission="rh.view">
                <EmployeeDetailPage />
              </PermissionRoute>
            }
          />
          <Route
            path="rh/salaries"
            element={
              <PermissionRoute permission="rh.view">
                <SalariesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="rh/attendances"
            element={
              <PermissionRoute permission="rh.view">
                <AttendancesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="rh/leaves"
            element={
              <PermissionRoute permission="rh.view">
                <LeavesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="rh/contracts"
            element={
              <PermissionRoute permission="rh.view">
                <ContractsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="rh/evaluations"
            element={
              <PermissionRoute permission="rh.view">
                <EvaluationsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="production/raw-materials"
            element={
              <PermissionRoute permission="production.view">
                <RawMaterialsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="production/bom"
            element={
              <PermissionRoute permission="production.view">
                <BillOfMaterialsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="production/orders"
            element={
              <PermissionRoute permission="production.view">
                <ProductionOrdersPage />
              </PermissionRoute>
            }
          />
          <Route
            path="settings/users"
            element={
              <PermissionRoute permission="parametres.view">
                <UsersPage />
              </PermissionRoute>
            }
          />
          <Route
            path="settings/roles"
            element={
              <PermissionRoute permission="parametres.view">
                <RolesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="settings/activity-log"
            element={
              <PermissionRoute permission="parametres.view">
                <ActivityLogPage />
              </PermissionRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
