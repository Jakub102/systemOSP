import React from 'react';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  ExternalLink,
  Flame,
  Navigation,
} from 'lucide-react';
import type { AuthUser } from '../api';
import type { FirefighterUser, Incident } from '../types';

export interface DashboardViewProps {
  users: FirefighterUser[];
  incidents: Incident[];
  currentUser: AuthUser;
  setActiveTab: (tab: 'dashboard' | 'users' | 'incidents' | 'map') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  users,
  incidents,
  currentUser,
  setActiveTab,
}) => {
  const activeUsersCount = users.filter(u => u.status === 'Aktywny').length;
  const activeIncidentsCount = incidents.filter(i => i.status === 'ACTIVE').length;
  const fireCount = incidents.filter(i => i.main_category === 'F').length;
  const hazardCount = incidents.filter(i => i.main_category === 'LT').length;
  const accidentCount = incidents.filter(i => i.main_category === 'A').length;
  const medicalCount = incidents.filter(i => i.main_category === 'M').length;

  return (
    <div className="dash-scroll">
      <div className="dash-head">
        <div className="dash-head-title">
          <LayoutDashboard className="w-4 h-4 text-blue-700" />
          <span className="font-bold text-neutral-800">Pulpit Podsumowania Systemu (Dashboard Overview)</span>
        </div>
        <span className="dash-head-meta">Brak aktywnych otwartych okien</span>
      </div>

      <div className="dash-grid">
        {/* Karta 1: Użytkownicy i Obsada */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              <Users className="w-3.5 h-3.5" />
              <span>Podsumowanie: Użytkownicy i Obsada</span>
            </div>
            <button 
              onClick={() => setActiveTab('users')}
              title="Otwórz kartę użytkowników"
              className="card-btn cursor-pointer"
            >
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="card-body">
            <div className="stat-row">
              <span className="stat-label">Łącznie zarejestrowanych:</span>
              <span className="stat-value">{users.length}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Aktywni w służbie:</span>
              <span className="stat-value text-emerald-700">{activeUsersCount}</span>
            </div>
            <div className="stat-detail">
              <div className="stat-detail-row">
                <span>• Dowódcy i Administratorzy:</span>
                <span className="stat-detail-val">{users.filter(u => u.role === 'Dowódca' || u.role === 'Admin').length}</span>
              </div>
              <div className="stat-detail-row">
                <span>• Dyspozytorzy SKKM:</span>
                <span className="stat-detail-val">{users.filter(u => u.role === 'Dyspozytor').length}</span>
              </div>
              <div className="stat-detail-row">
                <span>• Strażacy:</span>
                <span className="stat-detail-val">{users.filter(u => u.role === 'Strażak').length}</span>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('users')}
              className="card-btn-open cursor-pointer"
            >
              Otwórz moduł użytkowników &rarr;
            </button>
          </div>
        </div>

        {/* Karta 2: Alarmy i Stan Operacyjny */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Podsumowanie: Stan Operacyjny (Alarmy)</span>
            </div>
            <button 
              onClick={() => setActiveTab('incidents')}
              title="Otwórz kartę zdarzeń"
              className="card-btn cursor-pointer"
            >
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="card-body">
            <div className="stat-row">
              <span className="stat-label">Meldunki w dobie (Łącznie):</span>
              <span className="stat-value stat-value-dark">{incidents.length}</span>
            </div>
            <div className="stat-row stat-row-hot">
              <span className="stat-label-hot">
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                Akcje w toku (Dysponowane):
              </span>
              <span className="stat-value stat-value-hot">{activeIncidentsCount}</span>
            </div>
            <div className="stat-detail">
              <div className="stat-detail-row">
                <span>• Pożary (F):</span>
                <span className="stat-detail-val">{fireCount}</span>
              </div>
              <div className="stat-detail-row">
                <span>• Zagrożenia (LT):</span>
                <span className="stat-detail-val">{hazardCount}</span>
              </div>
              <div className="stat-detail-row">
                <span>• Wypadki (A):</span>
                <span className="stat-detail-val">{accidentCount}</span>
              </div>
              <div className="stat-detail-row">
                <span>• Zdarzenia medyczne (M):</span>
                <span className="stat-detail-val">{medicalCount}</span>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('incidents')}
              className="card-btn-open cursor-pointer"
            >
              Otwórz dziennik zdarzeń &rarr;
            </button>
          </div>
        </div>

        {/* Karta 3: Lokalizacja Operacyjna GPS LIVE */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              <Navigation className="w-3.5 h-3.5 text-red-600" />
              <span>Lokalizacja Operacyjna (GPS LIVE)</span>
            </div>
            <button 
              onClick={() => setActiveTab('map')}
              title="Otwórz mapę operacyjną"
              className="card-btn cursor-pointer"
            >
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="card-body">
            <div className="stat-row">
              <span className="stat-label">Aktywne zdarzenia na mapie:</span>
              <span className="stat-value text-red-700 font-bold">{activeIncidentsCount}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Baza jednostki:</span>
              <span className="stat-value text-neutral-800 text-[11px] truncate">
                {currentUser.firehouse?.name || 'Remiza OSP'}
              </span>
            </div>
            <div className="stat-detail">
              <div className="stat-detail-row">
                <span>• Pozycjonowanie:</span>
                <span className="stat-detail-val text-emerald-700 font-semibold">GPS Telemetria LIVE</span>
              </div>
              <div className="stat-detail-row">
                <span>• Kolorystyka:</span>
                <span className="stat-detail-val">Oddzielny kolor na zdarzenie</span>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('map')}
              className="card-btn-open cursor-pointer"
            >
              Otwórz mapę operacyjną &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
