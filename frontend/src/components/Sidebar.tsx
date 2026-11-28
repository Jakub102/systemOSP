import React from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  AlertTriangle,
  Navigation,
  LogOut,
} from 'lucide-react';
import type { AuthUser } from '../api';

export interface SidebarProps {
  currentUser: AuthUser;
  activeTab: 'dashboard' | 'users' | 'incidents' | 'map';
  setActiveTab: (tab: 'dashboard' | 'users' | 'incidents' | 'map') => void;
  usersCount: number;
  incidentsCount: number;
  activeIncidentsCount: number;
  onLogout: () => void;
  onClearSearch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  usersCount,
  incidentsCount,
  activeIncidentsCount,
  onLogout,
  onClearSearch,
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <ShieldAlert className="w-4 h-4 text-red-500" />
        <span className="sidebar-brand">SWD-PSP v2.4</span>
      </div>

      <div className="sidebar-user">
        <div>Jednostka: <span className="text-emerald-400">{currentUser.firehouse?.name ?? '—'}</span></div>
        <div>Konto: <span className="text-neutral-200 font-bold">{currentUser.full_name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Użytkownik'}</span></div>
        <div>Rola: <span className="text-neutral-200">{(currentUser.roles || []).join(', ') || '—'}</span></div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">Pulpit Główny</div>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`nav-item ${activeTab === 'dashboard' ? 'nav-item-active' : ''}`}
        >
          <div className="nav-item-label">
            <LayoutDashboard className="w-4 h-4" />
            <span>Podsumowanie Kart</span>
          </div>
        </button>

        <div className="nav-section">Moduły Zarządzania</div>

        <button
          onClick={() => { setActiveTab('users'); onClearSearch(); }}
          className={`nav-item ${activeTab === 'users' ? 'nav-item-active' : ''}`}
        >
          <div className="nav-item-label">
            <Users className="w-4 h-4" />
            <span>Użytkownicy i Strażacy</span>
          </div>
          <span className={`nav-count ${activeTab === 'users' ? 'nav-count-active' : ''}`}>
            {usersCount}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('incidents'); onClearSearch(); }}
          className={`nav-item ${activeTab === 'incidents' ? 'nav-item-active' : ''}`}
        >
          <div className="nav-item-label">
            <AlertTriangle className="w-4 h-4" />
            <span>Dziennik Zdarzeń (Alarmy)</span>
          </div>
          <span className={`nav-count ${activeTab === 'incidents' ? 'nav-count-active' : ''}`}>
            {incidentsCount}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('map'); onClearSearch(); }}
          className={`nav-item ${activeTab === 'map' ? 'nav-item-active' : ''}`}
        >
          <div className="nav-item-label">
            <Navigation className="w-4 h-4 text-red-600" />
            <span>Mapa Operacyjna GPS</span>
          </div>
          {activeIncidentsCount > 0 ? (
            <span className="px-1.5 py-0.2 bg-red-600 text-white font-mono text-[10px] font-bold rounded animate-pulse">
              {activeIncidentsCount} LIVE
            </span>
          ) : (
            <span className={`nav-count ${activeTab === 'map' ? 'nav-count-active' : ''}`}>
              0
            </span>
          )}
        </button>
      </nav>

      <div className="sidebar-foot">
        <button
          onClick={onLogout}
          className="logout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Wyloguj (Disconnect)</span>
        </button>
      </div>
    </aside>
  );
};
