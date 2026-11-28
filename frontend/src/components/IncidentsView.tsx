import React from 'react';
import {
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  BellRing,
  Navigation,
  Search,
  X,
  Flame,
  ShieldCheck,
  Lock,
  MapPin,
  Radio,
} from 'lucide-react';
import type { AuthUser } from '../api';
import type { Incident, MainCategory, useVerticalSplitter } from '../types';
import { MAIN_CATEGORY_LABELS, STATUS_LABELS, formatIncidentTime } from '../types';

export interface IncidentsViewProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  flashMsg: string;
  onOpenAddIncident: () => void;
  onDeleteIncident: () => void;
  onChangeIncidentStatus: (status: 'ACTIVE' | 'END') => void;
  onSendIncident: () => void;
  sendingIncident: boolean;
  selectedIncident?: Incident;
  onOpenMap: (incidentId?: string) => void;
  onCloseView: () => void;
  currentUser: AuthUser;
  isUserAdmin: boolean;
  newIncForm: {
    main_category: MainCategory;
    sub_category: string;
    address: string;
    incident_time: string;
    latitude: string;
    longitude: string;
    description: string;
    sendPush: boolean;
  };
  setNewIncForm: React.Dispatch<React.SetStateAction<{
    main_category: MainCategory;
    sub_category: string;
    address: string;
    incident_time: string;
    latitude: string;
    longitude: string;
    description: string;
    sendPush: boolean;
  }>>;
  creatingIncident: boolean;
  onCreateIncidentSubmit: (e: React.FormEvent) => void;
  onFillFirehouseCoords: () => void;
  onResetIncidentForm: () => void;
  incidentFormError: string;
  incidentFormSuccess: string;
  splitter: ReturnType<typeof useVerticalSplitter>;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  selectedIncidentId,
  setSelectedIncidentId,
  searchTerm,
  setSearchTerm,
  flashMsg,
  onOpenAddIncident,
  onDeleteIncident,
  onChangeIncidentStatus,
  onSendIncident,
  sendingIncident,
  selectedIncident,
  onOpenMap,
  onCloseView,
  currentUser,
  isUserAdmin,
  newIncForm,
  setNewIncForm,
  creatingIncident,
  onCreateIncidentSubmit,
  onFillFirehouseCoords,
  onResetIncidentForm,
  incidentFormError,
  incidentFormSuccess,
  splitter,
}) => {
  const q = searchTerm.toLowerCase();
  const filteredIncidents = incidents.filter(i =>
    i.sub_category.toLowerCase().includes(q) ||
    i.description.toLowerCase().includes(q) ||
    i.address.toLowerCase().includes(q) ||
    MAIN_CATEGORY_LABELS[i.main_category].toLowerCase().includes(q)
  );

  const activeIncidentsCount = incidents.filter(i => i.status === 'ACTIVE').length;

  return (
    <div className="win-window">
      {/* Pasek Tytułowy Okna */}
      <div className="win-head">
        <div className="win-head-title">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Rejestr Zgłoszeń i Działań Ratowniczych (Incidents)</span>
        </div>
        <div className="win-head-btns">
          <button 
            onClick={onCloseView}
            title="Zamknij kartę"
            className="title-btn title-btn-close cursor-pointer"
          >
            <X className="w-2.5 h-2.5"/>
          </button>
        </div>
      </div>

      {/* Pasek Narzędziowy */}
      <div className="toolbar">
        <button 
          onClick={onOpenAddIncident}
          className="tool-btn cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-600 font-bold" />
          <span>Nowe Zdarzenie (Alarm)</span>
        </button>
        <button 
          onClick={onDeleteIncident}
          disabled={!selectedIncidentId}
          className="tool-btn cursor-pointer disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-600" />
          <span>Usuń</span>
        </button>
        <div className="tool-divider" />
        <button 
          onClick={() => onChangeIncidentStatus('ACTIVE')}
          disabled={!selectedIncidentId}
          className="tool-btn cursor-pointer disabled:opacity-50"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Dysponuj (W toku)</span>
        </button>
        <button 
          onClick={() => onChangeIncidentStatus('END')}
          disabled={!selectedIncidentId}
          className="tool-btn cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zakończ akcję</span>
        </button>
        <div className="tool-divider" />
        <button 
          onClick={onSendIncident}
          disabled={!selectedIncidentId || sendingIncident || !!selectedIncident?.notified}
          className="tool-btn cursor-pointer disabled:opacity-50"
        >
          <BellRing className="w-3.5 h-3.5 text-blue-600" />
          <span>{sendingIncident ? 'Wysyłanie...' : selectedIncident?.notified ? 'Wysłano (push)' : 'Wyślij zdarzenie (push)'}</span>
        </button>
        <div className="tool-divider" />
        <button 
          type="button"
          onClick={() => {
            if (selectedIncidentId) {
              onOpenMap(selectedIncidentId);
            } else {
              onOpenMap();
            }
          }}
          className="tool-btn bg-red-50 text-red-700 hover:bg-red-100 border-red-300 font-semibold cursor-pointer"
          title="Pokaż aktywne zdarzenia i ratowników na mapie operacyjnej"
        >
          <Navigation className="w-3.5 h-3.5 text-red-600" />
          <span>Mapa GPS</span>
          {activeIncidentsCount > 0 && (
            <span className="badge badge-status badge-live text-[9px] px-1 py-0">{activeIncidentsCount} LIVE</span>
          )}
        </button>

        <div className="search-box">
          <Search className="w-3 h-3 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Filtruj tabelę..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {flashMsg && (
        <div className="flash-bar">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{flashMsg}</span>
        </div>
      )}

      {/* Kontener Roboczy z Podziałem Pionowym (Splitter) */}
      <div ref={splitter.containerRef} className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
        {/* Górny Panel: Tabela Dziennika Zdarzeń */}
        <div className="flex-1 overflow-auto min-h-0">
          <table className="data-table">
            <thead>
              <tr className="table-head">
                <th className="th w-10 text-center">#</th>
                <th className="th w-24">Kategoria</th>
                <th className="th w-36">Podkategoria</th>
                <th className="th">Opis / Sytuacja</th>
                <th className="th w-32 text-center">Czas zdarzenia</th>
                <th className="th w-48">Adres / Lokalizacja</th>
                <th className="th w-24 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((inc, index) => {
                const isSelected = selectedIncidentId === inc.id;
                const rowClass = isSelected ? 'tr tr-selected' : index % 2 === 1 ? 'tr tr-alt' : 'tr';
                return (
                  <tr 
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className={rowClass}
                  >
                    <td className="td td-idx">{index + 1}</td>
                    <td className="td">
                      <span className={`badge badge-cat badge-cat-${inc.main_category}`}>
                        {MAIN_CATEGORY_LABELS[inc.main_category]}
                      </span>
                    </td>
                    <td className="td td-strong">{inc.sub_category}</td>
                    <td className="td td-clip">{inc.description}</td>
                    <td className="td td-center whitespace-nowrap">
                      {formatIncidentTime(inc.incident_time)}
                    </td>
                    <td className="td">
                      <div>{inc.address}</div>
                      <div className="text-[10px] text-neutral-500">
                        {inc.latitude.toFixed(6)}, {inc.longitude.toFixed(6)}
                      </div>
                    </td>
                    <td className="td td-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`badge badge-status ${inc.status === 'ACTIVE' ? 'badge-live' : 'badge-done'}`}>
                          {STATUS_LABELS[inc.status]}
                        </span>
                        {inc.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenMap(inc.id);
                            }}
                            className="tool-btn text-[10px] py-0.5 px-1.5 flex items-center gap-1 text-red-700 hover:bg-red-50 border-red-300 cursor-pointer font-sans"
                            title="Pokaż to zdarzenie i pozycje ratowników na mapie"
                          >
                            <Navigation className="w-3 h-3 text-red-600" />
                            <span>Mapa</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Belka regulacji wysokości paneli (Splitter) */}
        <div
          onMouseDown={splitter.onMouseDown}
          onTouchStart={splitter.onTouchStart}
          className={`h-2 bg-[#ece9d8] border-y border-[#9c9a90] hover:bg-[#d8d4c7] active:bg-[#c0bcaf] cursor-row-resize flex items-center justify-center select-none transition-colors group relative z-10 shrink-0 ${
            splitter.isDragging ? 'bg-[#c0bcaf] shadow-inner ring-1 ring-red-500' : ''
          }`}
          title="Przeciągnij w pionie, aby zmienić proporcje tabeli i formularza"
        >
          <div className="w-12 h-1 flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <span className="w-1 h-1 rounded-full bg-[#555]" />
            <span className="w-1 h-1 rounded-full bg-[#555]" />
            <span className="w-1 h-1 rounded-full bg-[#555]" />
            <span className="w-1 h-1 rounded-full bg-[#555]" />
            <span className="w-1 h-1 rounded-full bg-[#555]" />
          </div>
        </div>

        {/* Dolny Panel: Formularz Tworzenia i Dysponowania Nowego Incydentu (Dla Administratora) */}
        <div
          style={{ height: `${splitter.bottomHeight}px`, maxHeight: 'calc(100% - 130px)' }}
          className="bg-[#ece9d8] flex flex-col shrink-0 overflow-hidden shadow-sm"
        >
          {/* Pasek Tytułowy Modułu Rejestracji Incydentu */}
          <div className="h-6 bg-gradient-to-r from-[#8b0000] via-[#b91c1c] to-[#f87171] text-white px-2 flex items-center justify-between shadow-2xs select-none">
            <div className="flex items-center gap-1.5 font-bold text-[11px]">
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Rejestracja i Dysponowanie Zdarzenia (Panel Administratora)</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              {isUserAdmin ? (
                <span className="px-1.5 py-0.2 bg-red-950/70 rounded border border-red-400 font-mono text-white flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-300" />
                  Uprawnienia: Administrator
                </span>
              ) : (
                <span className="px-1.5 py-0.2 bg-neutral-700/80 rounded border border-neutral-500 font-mono text-neutral-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-neutral-400" />
                  Wymagane konto Administratora
                </span>
              )}
            </div>
          </div>

          {/* Zawartość: Formularz lub Informacja o braku uprawnień */}
          {isUserAdmin ? (
            <div className="p-2 bg-[#f4f2e6] overflow-auto flex-1">
              <form onSubmit={onCreateIncidentSubmit} className="space-y-2 text-[11px] font-mono">
                {/* Wiersz 1: Kategoria, Podkategoria, Czas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="flex items-center gap-1">
                    <label className="font-sans font-semibold text-neutral-700 text-[10px] w-24 shrink-0">
                      Kategoria:
                    </label>
                    <select
                      value={newIncForm.main_category}
                      onChange={e => setNewIncForm({ ...newIncForm, main_category: e.target.value as MainCategory })}
                      className="field-input py-0.5 px-1.5 text-xs bg-white font-sans flex-1"
                    >
                      <option value="F">F - Pożar</option>
                      <option value="LT">LT - Miejscowe zagrożenie</option>
                      <option value="A">A - Wypadek drogowy</option>
                      <option value="M">M - Zdarzenie medyczne</option>
                      <option value="FA">FA - Fałszywy alarm</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <label className="font-sans font-semibold text-neutral-700 text-[10px] w-24 shrink-0">
                      Podkategoria:
                    </label>
                    <input
                      type="text"
                      required
                      value={newIncForm.sub_category}
                      onChange={e => setNewIncForm({ ...newIncForm, sub_category: e.target.value })}
                      placeholder="np. Budynek mieszkalny"
                      className="field-input py-0.5 px-1.5 text-xs bg-white flex-1"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <label className="font-sans font-semibold text-neutral-700 text-[10px] w-24 shrink-0">
                      Czas zdarzenia:
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={newIncForm.incident_time}
                      onChange={e => setNewIncForm({ ...newIncForm, incident_time: e.target.value })}
                      className="field-input py-0.5 px-1.5 text-xs bg-white flex-1"
                    />
                  </div>
                </div>

                {/* Wiersz 2: Adres i Współrzędne GPS */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <div className="md:col-span-6 flex items-center gap-1">
                    <label className="font-sans font-semibold text-neutral-700 text-[10px] w-24 shrink-0">
                      Adres / Miejsce:
                    </label>
                    <input
                      type="text"
                      required
                      value={newIncForm.address}
                      onChange={e => setNewIncForm({ ...newIncForm, address: e.target.value })}
                      placeholder="Miejscowość, ulica, nr domu / km trasy"
                      className="field-input py-0.5 px-1.5 text-xs bg-white flex-1"
                    />
                  </div>

                  <div className="md:col-span-3 flex items-center gap-1">
                    <label className="font-sans font-semibold text-neutral-700 text-[10px] w-14 shrink-0">
                      Lat:
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newIncForm.latitude}
                      onChange={e => setNewIncForm({ ...newIncForm, latitude: e.target.value })}
                      placeholder="52.406370"
                      className="field-input py-0.5 px-1.5 text-xs bg-white flex-1 font-mono"
                    />
                  </div>

                  <div className="md:col-span-3 flex items-center gap-1">
                    <label className="font-sans font-semibold text-neutral-700 text-[10px] w-14 shrink-0">
                      Lng:
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newIncForm.longitude}
                      onChange={e => setNewIncForm({ ...newIncForm, longitude: e.target.value })}
                      placeholder="16.925167"
                      className="field-input py-0.5 px-1.5 text-xs bg-white flex-1 font-mono"
                    />
                    <button
                      type="button"
                      onClick={onFillFirehouseCoords}
                      className="tool-btn text-[10px] py-0.5 px-1.5 whitespace-nowrap cursor-pointer shrink-0"
                      title="Wstaw współrzędne remizy"
                    >
                      <MapPin className="w-3 h-3 text-red-600" />
                      <span>Remiza</span>
                    </button>
                  </div>
                </div>

                {/* Wiersz 3: Opis zdarzenia */}
                <div className="flex items-start gap-1">
                  <label className="font-sans font-semibold text-neutral-700 text-[10px] w-24 shrink-0 pt-1">
                    Opis sytuacji:
                  </label>
                  <textarea
                    rows={2}
                    value={newIncForm.description}
                    onChange={e => setNewIncForm({ ...newIncForm, description: e.target.value })}
                    placeholder="Zadysponowane zastępy, rodzaj zagrożenia, poszkodowani..."
                    className="field-input py-1 px-1.5 text-xs bg-white font-sans flex-1 resize-none"
                  />
                </div>

                {/* Wiersz 4: Pasek akcji i wysyłania */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#c0c0c0]">
                  <label className="flex items-center gap-1.5 font-sans text-[11px] text-neutral-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newIncForm.sendPush}
                      onChange={e => setNewIncForm({ ...newIncForm, sendPush: e.target.checked })}
                      className="rounded-xs"
                    />
                    <Radio className="w-3.5 h-3.5 text-red-600" />
                    <span className="font-semibold">Wyślij powiadomienie alarmowe PUSH do strażaków (FCM)</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onResetIncidentForm}
                      className="tool-btn text-[11px] py-1 px-2.5 font-sans cursor-pointer"
                    >
                      Wyczyść
                    </button>

                    <button
                      type="submit"
                      disabled={creatingIncident}
                      className="tool-btn bg-[#dc2626] text-white hover:bg-red-700 border-red-900 font-sans font-bold text-xs px-3 py-1 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-300" />
                      <span>{creatingIncident ? 'Rejestrowanie...' : 'Zarejestruj i zadysponuj alarm'}</span>
                    </button>
                  </div>
                </div>

                {incidentFormError && (
                  <div className="mt-1.5 px-2 py-0.5 bg-red-100 border border-red-400 text-red-800 text-[10px] font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                    <span>{incidentFormError}</span>
                  </div>
                )}
                {incidentFormSuccess && (
                  <div className="mt-1.5 px-2 py-0.5 bg-emerald-100 border border-emerald-400 text-emerald-800 text-[10px] font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{incidentFormSuccess}</span>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="p-4 bg-[#f8f9fa] border-b border-[#c0c0c0] flex items-center gap-3">
              <Lock className="w-6 h-6 text-neutral-400 shrink-0" />
              <div>
                <div className="font-bold text-neutral-800 text-xs">
                  Rejestracja incydentów dostępna wyłącznie dla Administratora Systemu
                </div>
                <div className="text-[11px] text-neutral-500 font-sans mt-0.5">
                  Twoje obecne konto ({currentUser?.full_name}) nie posiada uprawnień administratora. Zaloguj się na konto administratora (np. admin@vfd.pl), aby móc dysponować nowe zdarzenia.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stopka Okna */}
      <div className="win-footer">
        <div>
          Łącznie zdarzeń w dobie: <span className="font-semibold text-neutral-900">{incidents.length}</span> | Aktywnych (w toku): <span className="font-bold text-red-700">{activeIncidentsCount}</span> | Push wysłany: <span className="font-semibold text-neutral-900">{incidents.filter(i => i.notified).length}</span>
        </div>
        <div>Zalogowano: {currentUser.full_name}</div>
      </div>
    </div>
  );
};
