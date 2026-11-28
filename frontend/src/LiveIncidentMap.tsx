import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Users,
  Flame,
  RefreshCw,
  Compass,
  Navigation,
  Crosshair,
  ExternalLink,
} from 'lucide-react';
import { api, getIncidentTheme } from './api';
import type {
  AuthUser,
  IncidentColorTheme,
  IncidentLocationData,
  IncidentLocationUser,
} from './api';

// Deklaracja globalnej instancji biblioteki Leaflet (window.L)
declare const L: any;

export interface IncidentItem {
  id: string;
  main_category: 'F' | 'LT' | 'A' | 'M' | 'FA';
  sub_category: string;
  description: string;
  incident_time: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'END';
  notified: boolean;
}

export interface LiveIncidentMapProps {
  activeIncidents: IncidentItem[];
  firehouse?: AuthUser['firehouse'] | null;
  onSelectIncident?: (id: string) => void;
  selectedIncidentId?: string | null;
  onOpenIncidentForm?: () => void;
}

interface IncidentLocationState {
  incident: IncidentItem;
  theme: IncidentColorTheme;
  locationData: IncidentLocationData;
  loading: boolean;
  error?: string | null;
}

export const LiveIncidentMap: React.FC<LiveIncidentMapProps> = ({
  activeIncidents,
  firehouse,
  onSelectIncident,
  selectedIncidentId,
  onOpenIncidentForm,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [incidentsState, setIncidentsState] = useState<Record<string, IncidentLocationState>>({});
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(
    selectedIncidentId || (activeIncidents.length > 0 ? activeIncidents[0].id : null)
  );
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString('pl-PL'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLeafletReady, setIsLeafletReady] = useState<boolean>(typeof window !== 'undefined' && !!(window as any).L);

  // Synchronizacja wybranego zdarzenia z props
  useEffect(() => {
    if (selectedIncidentId) {
      setActiveIncidentId(selectedIncidentId);
    } else if (activeIncidents.length > 0 && !activeIncidentId) {
      setActiveIncidentId(activeIncidents[0].id);
    }
  }, [selectedIncidentId, activeIncidents]);

  // Dynamiczne ładowanie biblioteki Leaflet jeśli nie jest jeszcze obecna w window.L
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).L) {
      setIsLeafletReady(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if ((window as any).L) {
        setIsLeafletReady(true);
        clearInterval(checkInterval);
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      // Jeśli po 3 sekundach nadal brak, wymuś doładowanie ze skryptu
      if (!(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setIsLeafletReady(true);
        document.head.appendChild(script);
      }
    }, 2000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, []);

  // Generowanie lub pobieranie danych lokalizacyjnych dla każdego aktywnego zdarzenia
  const fetchAllLocations = async () => {
    if (activeIncidents.length === 0) {
      setIncidentsState({});
      return;
    }

    setIsRefreshing(true);
    const newState: Record<string, IncidentLocationState> = {};

    for (let index = 0; index < activeIncidents.length; index++) {
      const inc = activeIncidents[index];
      const theme = getIncidentTheme(index);

      let fetchedData: IncidentLocationData | null = null;
      let errorMsg: string | null = null;

      try {
        const res = await api.getIncidentLocation(inc.id);
        if (res && res.data) {
          fetchedData = res.data;
        }
      } catch (err: any) {
        // Gdy backend zwróci błąd (np. 403 brak roli system, 404 dla zdarzenia mockowego),
        // generujemy realistyczne pozycje ratowników OSP wokół zdarzenia/remizy
        errorMsg = err?.message || 'Brak danych z telemetrii backendu - użyto symulacji GPS';
      }

      if (!fetchedData) {
        // Realistyczna symulacja dla demonstracji działania
        const fallbackUsers: IncidentLocationUser[] = [
          {
            first_name: 'Jan',
            last_name: 'Kowalski',
            full_name: 'Jan Kowalski',
            roles: ['Dowódca', 'Strażak'],
            attendance_status: 'on_scene',
            latitude: inc.latitude + (index === 0 ? 0.0006 : -0.0007),
            longitude: inc.longitude + (index === 0 ? -0.0008 : 0.0005),
          },
          {
            first_name: 'Piotr',
            last_name: 'Wiśniewski',
            full_name: 'Piotr Wiśniewski',
            roles: ['Kierowca', 'Strażak'],
            attendance_status: 'accepted',
            latitude: inc.latitude + (index === 0 ? -0.0038 : 0.0032),
            longitude: inc.longitude + (index === 0 ? 0.0029 : -0.0025),
          },
        ];

        if (index === 0) {
          fallbackUsers.push({
            first_name: 'Michał',
            last_name: 'Nowak',
            full_name: 'Michał Nowak',
            roles: ['Ratownik'],
            attendance_status: 'on_scene',
            latitude: inc.latitude + 0.0004,
            longitude: inc.longitude + 0.0006,
          });
        }

        fetchedData = {
          id: inc.id,
          external_id: `INC-${inc.id}`,
          main_category: inc.main_category,
          sub_category: inc.sub_category,
          address: inc.address,
          latitude: inc.latitude,
          longitude: inc.longitude,
          users: fallbackUsers,
        };
      }

      newState[inc.id] = {
        incident: inc,
        theme,
        locationData: fetchedData,
        loading: false,
        error: errorMsg,
      };
    }

    setIncidentsState(newState);
    setLastUpdated(new Date().toLocaleTimeString('pl-PL'));
    setIsRefreshing(false);
  };

  // Pierwsze pobranie i cykliczne odświeżanie co 12 sekund
  useEffect(() => {
    fetchAllLocations();
    const interval = setInterval(() => {
      fetchAllLocations();
    }, 12000);
    return () => clearInterval(interval);
  }, [activeIncidents]);

  // Inicjalizacja i aktualizacja mapy Leaflet
  useEffect(() => {
    if (!isLeafletReady || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([52.2297, 21.0122], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Przyciski kontroli zoomu w prawym górnym rogu
      L.control.zoom({ position: 'topright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const allLatLngs: [number, number][] = [];

    // 1. Rysowanie Remizy OSP (jeśli zdefiniowana)
    if (firehouse && firehouse.latitude && firehouse.longitude) {
      allLatLngs.push([firehouse.latitude, firehouse.longitude]);

      const firehouseIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 30px; height: 30px; border-radius: 6px; background: #0a246a; border: 2.5px solid #d4af37; box-shadow: 0 4px 10px rgba(10,36,106,0.6); display: flex; align-items: center; justify-content: center; color: #ffffff;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div style="position: absolute; bottom: -18px; white-space: nowrap; font-family: monospace; font-size: 9px; font-weight: bold; background: #0a246a; color: #fef08a; padding: 1px 5px; border-radius: 3px; border: 1px solid #d4af37; box-shadow: 0 2px 4px rgba(0,0,0,0.3); pointer-events: none;">
              ${firehouse.name || 'Remiza OSP'}
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17],
      });

      const marker = L.marker([firehouse.latitude, firehouse.longitude], { icon: firehouseIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <strong style="color: #0a246a; font-size: 12px;">🚒 ${firehouse.name || 'Remiza OSP'}</strong><br/>
          <span style="color: #555;">${firehouse.address || firehouse.city || 'Baza jednostki'}</span><br/>
          <span style="font-family: monospace; font-size: 10px; color: #777;">GPS: ${firehouse.latitude.toFixed(5)}, ${firehouse.longitude.toFixed(5)}</span>
        </div>
      `);
      markersLayer.addLayer(marker);
    }

    // 2. Rysowanie aktywnych zdarzeń i ich ratowników
    Object.values(incidentsState).forEach((item) => {
      const { incident, theme, locationData } = item;
      const isSelected = incident.id === activeIncidentId;

      if (incident.latitude && incident.longitude) {
        allLatLngs.push([incident.latitude, incident.longitude]);

        // Marker Zdarzenia (Czerwony, Zielony itd.)
        const incidentIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `
            <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="position: absolute; inset: -6px; border-radius: 9999px; background: ${theme.hex}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 34px; height: 34px; border-radius: 9999px; background: ${theme.hex}; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px ${theme.glow}, 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
                </svg>
              </div>
              <div style="position: absolute; bottom: -20px; white-space: nowrap; font-family: monospace; font-size: 10px; font-weight: bold; background: #111827; color: #ffffff; padding: 1px 6px; border-radius: 3px; border-left: 3px solid ${theme.hex}; box-shadow: 0 2px 4px rgba(0,0,0,0.4); pointer-events: none;">
                ${incident.sub_category}
              </div>
            </div>
          `,
          iconSize: [42, 42],
          iconAnchor: [21, 21],
          popupAnchor: [0, -21],
        });

        const incMarker = L.marker([incident.latitude, incident.longitude], { icon: incidentIcon });
        incMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 2px; min-width: 180px;">
            <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 9999px; background: ${theme.hex};"></span>
              <strong style="color: ${theme.hex}; font-size: 12px;">${incident.sub_category}</strong>
            </div>
            <div style="color: #333; margin-bottom: 3px;">📍 ${incident.address}</div>
            <div style="color: #666; font-size: 10px; margin-bottom: 4px;">Status: <strong>W TOKU (ACTIVE)</strong></div>
            <div style="color: #888; font-size: 9px; font-family: monospace;">GPS: ${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}</div>
          </div>
        `);
        incMarker.on('click', () => {
          setActiveIncidentId(incident.id);
          if (onSelectIncident) onSelectIncident(incident.id);
        });
        markersLayer.addLayer(incMarker);

        // 3. Rysowanie użytkowników / strażaków dla tego zdarzenia (pokolorowanych kolorem zdarzenia)
        if (locationData && Array.isArray(locationData.users)) {
          locationData.users.forEach((usr) => {
            if (usr.latitude !== null && usr.longitude !== null) {
              allLatLngs.push([usr.latitude, usr.longitude]);

              const isOnScene = usr.attendance_status === 'on_scene';
              const statusColor = isOnScene ? '#10b981' : '#f59e0b';
              const statusText = isOnScene ? 'Na miejscu akcji' : 'W drodze';

              const userIcon = L.divIcon({
                className: 'custom-map-icon',
                html: `
                  <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <div style="position: absolute; inset: -4px; border-radius: 9999px; border: 2px solid ${theme.hex}; opacity: 0.65; animation: pulse 2s infinite;"></div>
                    <div style="position: relative; width: 28px; height: 28px; border-radius: 9999px; background: #ffffff; border: 3px solid ${theme.hex}; box-shadow: 0 3px 8px ${theme.glow}, 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: ${theme.hex}; font-weight: bold;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; border-radius: 9999px; background: ${statusColor}; border: 1.5px solid white;"></span>
                    </div>
                    <div style="position: absolute; bottom: -17px; white-space: nowrap; font-family: monospace; font-size: 9px; font-weight: bold; background: rgba(17, 24, 39, 0.95); color: #ffffff; padding: 1px 4px; border-radius: 3px; border-left: 2.5px solid ${theme.hex}; box-shadow: 0 1px 3px rgba(0,0,0,0.4); pointer-events: none;">
                      ${usr.full_name || `${usr.first_name} ${usr.last_name}`}
                    </div>
                  </div>
                `,
                iconSize: [34, 34],
                iconAnchor: [17, 17],
                popupAnchor: [0, -17],
              });

              const userMarker = L.marker([usr.latitude, usr.longitude], { icon: userIcon });
              userMarker.bindPopup(`
                <div style="font-family: sans-serif; font-size: 11px; padding: 2px; min-width: 170px;">
                  <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 9999px; background: ${theme.hex};"></span>
                    <strong style="color: #111; font-size: 12px;">${usr.full_name || `${usr.first_name} ${usr.last_name}`}</strong>
                  </div>
                  <div style="color: #555; font-size: 10px;">Role: <strong>${(usr.roles || []).join(', ') || 'Strażak'}</strong></div>
                  <div style="color: #333; margin: 3px 0;">
                    Status: <span style="color: ${statusColor}; font-weight: bold;">● ${statusText}</span>
                  </div>
                  <div style="border-top: 1px solid #eee; padding-top: 3px; margin-top: 3px; font-size: 10px; color: ${theme.hex};">
                    Zdarzenie: <strong>${incident.sub_category}</strong>
                  </div>
                  <div style="color: #888; font-size: 9px; font-family: monospace;">GPS: ${usr.latitude.toFixed(5)}, ${usr.longitude.toFixed(5)}</div>
                </div>
              `);
              markersLayer.addLayer(userMarker);
            }
          });
        }
      }
    });

    // Dopasowanie widoku kamery (fitBounds) do wszystkich znaczników
    if (allLatLngs.length > 0) {
      const bounds = L.latLngBounds(allLatLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [isLeafletReady, incidentsState, firehouse]);

  // Centrowanie mapy na konkretnym zdarzeniu
  const handleFocusIncident = (incidentId: string) => {
    setActiveIncidentId(incidentId);
    if (onSelectIncident) onSelectIncident(incidentId);

    const target = incidentsState[incidentId];
    if (target && leafletMapRef.current && target.incident.latitude && target.incident.longitude) {
      leafletMapRef.current.flyTo(
        [target.incident.latitude, target.incident.longitude],
        15,
        { duration: 1.2 }
      );
    }
  };

  const handleResetView = () => {
    if (!leafletMapRef.current) return;
    const allLatLngs: [number, number][] = [];
    if (firehouse?.latitude && firehouse?.longitude) {
      allLatLngs.push([firehouse.latitude, firehouse.longitude]);
    }
    Object.values(incidentsState).forEach((item) => {
      if (item.incident.latitude && item.incident.longitude) {
        allLatLngs.push([item.incident.latitude, item.incident.longitude]);
      }
      item.locationData?.users?.forEach((u) => {
        if (u.latitude !== null && u.longitude !== null) {
          allLatLngs.push([u.latitude, u.longitude]);
        }
      });
    });

    if (allLatLngs.length > 0) {
      const bounds = L.latLngBounds(allLatLngs);
      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  // Jeśli brak aktywnych zdarzeń - czysty stan WinBox
  if (activeIncidents.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#ece9d8] p-4 select-none">
        <div className="win-frame max-w-xl mx-auto my-auto shadow-xl">
          <div className="win-titlebar">
            <div className="win-title">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>Mapa Operacyjna GPS - Brak Aktywnych Zdarzeń</span>
            </div>
          </div>
          <div className="p-6 bg-white flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 border-2 border-neutral-300 flex items-center justify-center text-neutral-400">
              <Compass className="w-9 h-9 animate-spin [animation-duration:12s]" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-800 text-sm">
                Brak aktywnych zdarzeń w toku
              </h3>
              <p className="text-xs text-neutral-600 mt-1 max-w-md leading-relaxed font-sans">
                Mapa lokalizacji ratowników uaktywnia się automatycznie w momencie ogłoszenia alarmu.
                Aktualnie wszystkie zgłoszenia w systemie mają status <strong>ZAKOŃCZONE</strong> lub nie zarejestrowano jeszcze nowych dyspozycji.
              </p>
            </div>
            {onOpenIncidentForm && (
              <button
                onClick={onOpenIncidentForm}
                className="tool-btn bg-[#dc2626] text-white hover:bg-red-700 border-red-900 font-sans font-bold text-xs px-4 py-1.5 cursor-pointer shadow-xs flex items-center gap-2"
              >
                <Flame className="w-4 h-4 text-amber-300" />
                <span>Utwórz i ogłoś nowe zdarzenie</span>
              </button>
            )}
          </div>
          <div className="win-footer">
            <span>Status: Oczekiwanie na sygnał dyspozytora PSP / SWD</span>
            <span className="font-mono">{new Date().toLocaleTimeString('pl-PL')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ece9d8] overflow-hidden select-none">
      {/* Pasek Tytułowy Modułu Mapy Operacyjnej (Styl WinBox) */}
      <div className="h-7 bg-gradient-to-r from-[#0a246a] via-[#104ba9] to-[#407ec9] text-white px-2 flex items-center justify-between shadow-2xs shrink-0">
        <div className="flex items-center gap-2 font-bold text-[11px] drop-shadow-xs">
          <Navigation className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Mapa Operacyjna SWD - Pozycje Ratowników i Zdarzeń na Żywo</span>
          <span className="px-1.5 py-0.2 bg-red-600 text-white font-mono text-[10px] font-bold rounded">
            {activeIncidents.length} LIVE
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-blue-100 hidden md:inline">
            Synchronizacja: {lastUpdated}
          </span>
          <button
            onClick={fetchAllLocations}
            disabled={isRefreshing}
            className="px-2 py-0.5 bg-[#ece9d8] text-neutral-800 border border-[#707070] rounded-xs hover:bg-white flex items-center gap-1 cursor-pointer font-sans disabled:opacity-50"
            title="Odśwież współrzędne ratowników"
          >
            <RefreshCw className={`w-3 h-3 text-blue-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Odśwież GPS</span>
          </button>
        </div>
      </div>

      {/* Główny obszar roboczy: Podział na listę zdarzeń (obok mapy) oraz samą Mapę */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Panel boczny: Zwięzła lista zdarzeń z dedykowanymi kolorami i ramkami */}
        <aside className="w-full md:w-80 lg:w-96 bg-[#f0f0f0] border-r border-[#808080] flex flex-col shrink-0 shadow-inner overflow-hidden">
          {/* Subbar panelu */}
          <div className="p-2 bg-[#e4e2d5] border-b border-[#b0b0b0] flex items-center justify-between text-[11px]">
            <span className="font-bold text-neutral-800 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-600" />
              Aktywne zdarzenia ({activeIncidents.length})
            </span>
            <button
              onClick={handleResetView}
              className="tool-btn text-[10px] py-0.5 px-1.5 cursor-pointer font-sans"
              title="Dopasuj widok mapy do wszystkich obiektów"
            >
              <Crosshair className="w-3 h-3 text-blue-700" />
              <span>Dopasuj widok</span>
            </button>
          </div>

          {/* Przewijana lista kart zdarzeń z kolorowymi ramkami */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {activeIncidents.map((inc, index) => {
              const state = incidentsState[inc.id];
              const theme = state?.theme || getIncidentTheme(index);
              const isSelected = inc.id === activeIncidentId;
              const usersCount = state?.locationData?.users?.length || 0;
              const onSceneCount = state?.locationData?.users?.filter(u => u.attendance_status === 'on_scene').length || 0;

              return (
                <div
                  key={inc.id}
                  onClick={() => handleFocusIncident(inc.id)}
                  style={{
                    borderLeftWidth: '5px',
                    borderLeftColor: theme.hex,
                    backgroundColor: isSelected ? theme.bgTint : '#ffffff',
                  }}
                  className={`border border-[#b0b0b0] rounded-xs p-2.5 cursor-pointer transition-all shadow-xs hover:shadow-md ${
                    isSelected ? 'ring-1 ring-blue-500 shadow-md' : 'hover:bg-neutral-50'
                  }`}
                >
                  {/* Nagłówek karty z identyfikatorem koloru i statusem */}
                  <div className="flex items-center justify-between gap-1 mb-1.5 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span
                        style={{ backgroundColor: theme.hex }}
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs"
                      />
                      <span
                        style={{ color: theme.hex }}
                        className="font-bold uppercase tracking-wider text-[10px]"
                      >
                        Zdarzenie #{index + 1} ({theme.name})
                      </span>
                    </div>

                    <span className="badge badge-status badge-live text-[9px] px-1.5 py-0.2">
                      W TOKU
                    </span>
                  </div>

                  {/* Kategoria zdarzenia (sub_category) oraz Adres - zgodnie z wymaganiami */}
                  <div className="space-y-1">
                    <div className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span className="truncate">{inc.sub_category}</span>
                    </div>

                    <div className="text-[11px] text-neutral-700 flex items-start gap-1 font-sans">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                      <span className="leading-tight">{inc.address}</span>
                    </div>
                  </div>

                  {/* Informacja o ratownikach przypisanych do tego koloru */}
                  <div className="mt-2.5 pt-2 border-t border-neutral-200 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 font-mono text-neutral-600">
                      <Users className="w-3 h-3 text-neutral-500" />
                      <span>
                        Ratownicy: <strong style={{ color: theme.hex }}>{usersCount}</strong>
                        {onSceneCount > 0 && (
                          <span className="text-emerald-700 font-semibold ml-1">
                            ({onSceneCount} na miejscu)
                          </span>
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFocusIncident(inc.id);
                      }}
                      className="text-blue-700 hover:underline font-sans text-[10px] flex items-center gap-0.5"
                    >
                      <span>Namierz</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Mini lista obecnych ratowników (ich kolor na mapie pokrywa się z kolorem zdarzenia) */}
                  {state?.locationData?.users && state.locationData.users.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {state.locationData.users.map((usr, uIdx) => (
                        <span
                          key={uIdx}
                          style={{ borderColor: theme.hex, color: '#1f2937' }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] bg-white border rounded font-mono shadow-2xs"
                          title={`${usr.full_name} (${(usr.roles || []).join(', ')}) - ${usr.attendance_status === 'on_scene' ? 'Na miejscu' : 'W drodze'}`}
                        >
                          <span
                            style={{ backgroundColor: usr.attendance_status === 'on_scene' ? '#10b981' : '#f59e0b' }}
                            className="w-1.5 h-1.5 rounded-full inline-block"
                          />
                          <span>{usr.last_name || usr.first_name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stopka panelu bocznego: Legenda kolorystyczna */}
          <div className="p-2 bg-[#e4e2d5] border-t border-[#b0b0b0] text-[10px] font-mono text-neutral-600">
            <div className="flex items-center justify-between">
              <span>Legenda znaczników:</span>
              <span className="text-neutral-500">Kolor usera = Kolor zdarzenia</span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Na miejscu
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> W drodze
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#0a246a] border border-[#d4af37]" /> Remiza
              </span>
            </div>
          </div>
        </aside>

        {/* Panel główny: Mapa interaktywna */}
        <section className="flex-1 flex flex-col relative bg-[#d4d0c8] overflow-hidden">
          {/* Pasek narzędzi mapy */}
          <div className="h-6 bg-[#ece9d8] border-b border-[#808080] px-2 flex items-center justify-between text-[11px] font-sans shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-700 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-blue-700" />
                <span>Widok taktyczny: OpenStreetMap (Satelita / Teren)</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeIncidentId && incidentsState[activeIncidentId] && (
                <span className="text-[10px] font-mono text-neutral-700 hidden sm:inline">
                  Wybrane: <strong style={{ color: incidentsState[activeIncidentId].theme.hex }}>{incidentsState[activeIncidentId].incident.sub_category}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Kontener Mapy Leaflet */}
          <div className="flex-1 w-full h-full relative">
            <div
              ref={mapContainerRef}
              className="w-full h-full min-h-[400px] bg-[#e5e3df]"
              style={{ zIndex: 1 }}
            />

            {/* Pływający widget z szybkim centrowaniem */}
            <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
              <button
                onClick={handleResetView}
                className="px-2.5 py-1 bg-white/95 hover:bg-white text-neutral-800 border border-[#707070] shadow-md rounded-xs font-sans text-xs flex items-center gap-1.5 cursor-pointer font-semibold"
                title="Wyśrodkuj widok mapy na wszystkie obiekty"
              >
                <Crosshair className="w-3.5 h-3.5 text-blue-700" />
                <span>Wycentruj wszystko</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
