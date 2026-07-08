import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

interface NavItem {
  to: string;
  labelKey: string;
  end?: boolean;
  permission?: string;
}

interface NavGroup {
  key: string;
  labelKey: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    key: 'ventesClients',
    labelKey: 'nav.categoryVentesClients',
    items: [
      { to: '/quotes', labelKey: 'nav.ventesQuotes' },
      { to: '/invoices', labelKey: 'nav.ventesInvoices' },
      { to: '/clients', labelKey: 'nav.crmClients' },
    ],
  },
  {
    key: 'stockAchats',
    labelKey: 'nav.categoryStockAchats',
    items: [
      { to: '/products', labelKey: 'nav.stockProducts' },
      { to: '/stock-movements', labelKey: 'nav.stockMovements' },
      { to: '/suppliers', labelKey: 'nav.achatsSuppliers', permission: 'achats.view' },
      { to: '/purchase-requests', labelKey: 'nav.achatsRequests', permission: 'achats.view' },
      { to: '/purchase-orders', labelKey: 'nav.achatsOrders', permission: 'achats.view' },
    ],
  },
  {
    key: 'finance',
    labelKey: 'nav.categoryFinance',
    items: [
      { to: '/treasury', labelKey: 'nav.treasury', permission: 'tresorerie.view' },
      { to: '/accounting/chart-of-accounts', labelKey: 'nav.comptaChart', permission: 'comptabilite.view' },
      { to: '/accounting/journal-entries', labelKey: 'nav.comptaEntries', permission: 'comptabilite.view' },
      { to: '/accounting/reports', labelKey: 'nav.comptaReports', permission: 'comptabilite.view' },
    ],
  },
  {
    key: 'rh',
    labelKey: 'nav.categoryRh',
    items: [
      { to: '/rh/employees', labelKey: 'nav.rhEmployees', permission: 'rh.view' },
      { to: '/rh/salaries', labelKey: 'nav.rhSalaries', permission: 'rh.view' },
      { to: '/rh/attendances', labelKey: 'nav.rhAttendances', permission: 'rh.view' },
      { to: '/rh/leaves', labelKey: 'nav.rhLeaves', permission: 'rh.view' },
      { to: '/rh/contracts', labelKey: 'nav.rhContracts', permission: 'rh.view' },
      { to: '/rh/evaluations', labelKey: 'nav.rhEvaluations', permission: 'rh.view' },
    ],
  },
  {
    key: 'production',
    labelKey: 'nav.categoryProduction',
    items: [
      { to: '/production/raw-materials', labelKey: 'nav.productionRawMaterials', permission: 'production.view' },
      { to: '/production/bom', labelKey: 'nav.productionBom', permission: 'production.view' },
      { to: '/production/orders', labelKey: 'nav.productionOrders', permission: 'production.view' },
    ],
  },
  {
    key: 'administration',
    labelKey: 'nav.categoryAdministration',
    items: [
      { to: '/settings/users', labelKey: 'nav.parametresUsers', permission: 'parametres.view' },
      { to: '/settings/roles', labelKey: 'nav.parametresRoles', permission: 'parametres.view' },
      { to: '/settings/activity-log', labelKey: 'nav.parametresActivityLog', permission: 'parametres.view' },
      { to: '/security', labelKey: 'nav.accountSecurity' },
    ],
  },
];

export function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || hasPermission(user, item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const active = visibleGroups.find((g) => g.items.some((item) => location.pathname.startsWith(item.to)));
    return new Set(active ? [active.key] : []);
  });

  const canSeeDocuments = hasPermission(user, 'documents.view');

  const closeSidebar = () => setSidebarOpen(false);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderLink = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      onClick={closeSidebar}
      className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
    >
      {t(item.labelKey)}
    </NavLink>
  );

  return (
    <div className="app-shell">
      <div className={sidebarOpen ? 'sidebar-backdrop open' : 'sidebar-backdrop'} onClick={closeSidebar} />
      <aside className={sidebarOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand">Dosia One</div>
        <nav>
          <NavLink to="/" end onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            {t('nav.dashboard')}
          </NavLink>

          {visibleGroups.map((group) => {
            const isOpen = openGroups.has(group.key);
            return (
              <div className="nav-group" key={group.key}>
                <button
                  type="button"
                  className="nav-group-header"
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={isOpen}
                >
                  <span>{t(group.labelKey)}</span>
                  <span className={isOpen ? 'nav-group-chevron open' : 'nav-group-chevron'} aria-hidden="true">▾</span>
                </button>
                {isOpen && <div className="nav-group-items">{group.items.map(renderLink)}</div>}
              </div>
            );
          })}

          {canSeeDocuments && (
            <NavLink to="/documents" onClick={closeSidebar} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {t('nav.documents')}
            </NavLink>
          )}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle secondary" onClick={() => setSidebarOpen((open) => !open)} aria-label={t('common.openMenu')}>
              ☰
            </button>
            <div>{user?.company?.name}</div>
          </div>
          <div className="user-info">
            <span>{user?.name} {user?.role && <span className="badge">{user.role.name}</span>}</span>
            <button onClick={handleLogout}>{t('common.logout')}</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
