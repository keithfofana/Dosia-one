import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

interface NavItem {
  to: string;
  labelKey: string;
  end?: boolean;
}

const modules: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', end: true },
  { to: '/clients', labelKey: 'nav.crmClients' },
  { to: '/products', labelKey: 'nav.stockProducts' },
  { to: '/quotes', labelKey: 'nav.ventesQuotes' },
  { to: '/invoices', labelKey: 'nav.ventesInvoices' },
];

const achatsModules: NavItem[] = [
  { to: '/suppliers', labelKey: 'nav.achatsSuppliers' },
  { to: '/purchase-requests', labelKey: 'nav.achatsRequests' },
  { to: '/purchase-orders', labelKey: 'nav.achatsOrders' },
];

const tresorerieModules: NavItem[] = [
  { to: '/treasury', labelKey: 'nav.treasury' },
];

const comptabiliteModules: NavItem[] = [
  { to: '/accounting/chart-of-accounts', labelKey: 'nav.comptaChart' },
  { to: '/accounting/journal-entries', labelKey: 'nav.comptaEntries' },
  { to: '/accounting/reports', labelKey: 'nav.comptaReports' },
];

const rhModules: NavItem[] = [
  { to: '/rh/employees', labelKey: 'nav.rhEmployees' },
  { to: '/rh/salaries', labelKey: 'nav.rhSalaries' },
  { to: '/rh/attendances', labelKey: 'nav.rhAttendances' },
  { to: '/rh/leaves', labelKey: 'nav.rhLeaves' },
  { to: '/rh/contracts', labelKey: 'nav.rhContracts' },
  { to: '/rh/evaluations', labelKey: 'nav.rhEvaluations' },
];

const productionModules: NavItem[] = [
  { to: '/production/raw-materials', labelKey: 'nav.productionRawMaterials' },
  { to: '/production/bom', labelKey: 'nav.productionBom' },
  { to: '/production/orders', labelKey: 'nav.productionOrders' },
];

const accountModules: NavItem[] = [
  { to: '/security', labelKey: 'nav.accountSecurity' },
];

const parametresModules: NavItem[] = [
  { to: '/settings/users', labelKey: 'nav.parametresUsers' },
  { to: '/settings/roles', labelKey: 'nav.parametresRoles' },
  { to: '/settings/activity-log', labelKey: 'nav.parametresActivityLog' },
];

export function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const canSeeParametres = hasPermission(user, 'parametres.view');
  const canSeeAchats = hasPermission(user, 'achats.view');
  const canSeeTresorerie = hasPermission(user, 'tresorerie.view');
  const canSeeComptabilite = hasPermission(user, 'comptabilite.view');
  const canSeeRh = hasPermission(user, 'rh.view');
  const canSeeProduction = hasPermission(user, 'production.view');

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderLinks = (items: NavItem[]) =>
    items.map((m) => (
      <NavLink
        key={m.to}
        to={m.to}
        end={m.end}
        onClick={closeSidebar}
        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
      >
        {t(m.labelKey)}
      </NavLink>
    ));

  return (
    <div className="app-shell">
      <div className={sidebarOpen ? 'sidebar-backdrop open' : 'sidebar-backdrop'} onClick={closeSidebar} />
      <aside className={sidebarOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand">Dosia One</div>
        <nav>
          {renderLinks(modules)}
          {canSeeAchats && renderLinks(achatsModules)}
          {canSeeTresorerie && renderLinks(tresorerieModules)}
          {canSeeComptabilite && renderLinks(comptabiliteModules)}
          {canSeeRh && renderLinks(rhModules)}
          {canSeeProduction && renderLinks(productionModules)}
          {canSeeParametres && renderLinks(parametresModules)}
          {renderLinks(accountModules)}
        </nav>
        <div className="coming-soon">
          <div className="coming-soon-title">{t('nav.comingSoon')}</div>
          <div className="nav-link disabled">{t('nav.documents')}</div>
        </div>
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
