import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const modules = [
  { to: '/', label: 'Tableau de bord', end: true },
  { to: '/clients', label: 'CRM · Clients' },
  { to: '/products', label: 'Stock · Produits' },
  { to: '/quotes', label: 'Ventes · Devis' },
  { to: '/invoices', label: 'Ventes · Factures' },
];

const achatsModules = [
  { to: '/suppliers', label: 'Achats · Fournisseurs' },
  { to: '/purchase-requests', label: 'Achats · Demandes' },
  { to: '/purchase-orders', label: 'Achats · Commandes' },
];

const tresorerieModules = [
  { to: '/treasury', label: 'Trésorerie' },
];

const comptabiliteModules = [
  { to: '/accounting/chart-of-accounts', label: 'Compta · Plan comptable' },
  { to: '/accounting/journal-entries', label: 'Compta · Écritures' },
  { to: '/accounting/reports', label: 'Compta · Rapports' },
];

const rhModules = [
  { to: '/rh/employees', label: 'RH · Employés' },
  { to: '/rh/salaries', label: 'RH · Salaires' },
  { to: '/rh/attendances', label: 'RH · Présences' },
  { to: '/rh/leaves', label: 'RH · Congés' },
  { to: '/rh/contracts', label: 'RH · Contrats' },
  { to: '/rh/evaluations', label: 'RH · Évaluations' },
];

const productionModules = [
  { to: '/production/raw-materials', label: 'Production · Matières premières' },
  { to: '/production/bom', label: 'Production · Nomenclature (BOM)' },
  { to: '/production/orders', label: 'Production · Ordres de fabrication' },
];

const accountModules = [
  { to: '/security', label: 'Mon compte · Sécurité' },
];

const parametresModules = [
  { to: '/settings/users', label: 'Paramètres · Utilisateurs' },
  { to: '/settings/roles', label: 'Paramètres · Rôles' },
  { to: '/settings/activity-log', label: "Paramètres · Journal d'activité" },
];

const comingSoon = [
  'Documents',
];

export function Layout() {
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
        {m.label}
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
          <div className="coming-soon-title">Bientôt disponible</div>
          {comingSoon.map((m) => (
            <div key={m} className="nav-link disabled">{m}</div>
          ))}
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle secondary" onClick={() => setSidebarOpen((open) => !open)} aria-label="Ouvrir le menu">
              ☰
            </button>
            <div>{user?.company?.name}</div>
          </div>
          <div className="user-info">
            <span>{user?.name} {user?.role && <span className="badge">{user.role.name}</span>}</span>
            <button onClick={handleLogout}>Déconnexion</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
