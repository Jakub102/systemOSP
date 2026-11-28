import { useRef, useState, useEffect } from 'react';

export type MainCategory = 'F' | 'LT' | 'A' | 'M' | 'FA';

export interface FirefighterUser {
  id: string;
  username: string;
  fullName: string;
  password?: string;
  rank: string;
  unit: string;
  role: 'Admin' | 'Dyspozytor' | 'Dowódca' | 'Strażak';
  status: 'Aktywny' | 'Nieaktywny';
}

export interface Incident {
  id: string;
  main_category: MainCategory;
  sub_category: string;
  description: string;
  incident_time: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'END';
  notified: boolean;
}

export const MAIN_CATEGORY_LABELS: Record<MainCategory, string> = {
  F: 'Pożar',
  LT: 'Miejscowe zagrożenie',
  A: 'Wypadek',
  M: 'Zdarzenie medyczne',
  FA: 'Fałszywy alarm',
};

export const STATUS_LABELS: Record<Incident['status'], string> = {
  ACTIVE: 'W toku',
  END: 'Zakończone',
};

export function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatIncidentTime(value: string): string {
  const d = new Date(value.replace(' ', 'T'));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return 'Brak terminu';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const INITIAL_USERS: FirefighterUser[] = [
  { id: '1', username: 'admin', fullName: 'Administrator Systemu SWD', password: 'admin', rank: 'Oficer Dyżurny', unit: 'KM PSP Poznań', role: 'Admin', status: 'Aktywny' },
  { id: '2', username: 'k.kowalski', fullName: 'asp. sztab. Krzysztof Kowalski', password: '123', rank: 'Aspirant sztabowy', unit: 'JRG-1 Poznań', role: 'Dowódca', status: 'Aktywny' },
  { id: '3', username: 'm.nowak', fullName: 'mł. kpt. Michał Nowak', password: '123', rank: 'Młodszy kapitan', unit: 'SKKM Poznań', role: 'Dyspozytor', status: 'Aktywny' },
  { id: '4', username: 'p.wisniewski', fullName: 'st. str. Piotr Wiśniewski', password: '123', rank: 'Starszy strażak', unit: 'OSP Główna', role: 'Strażak', status: 'Aktywny' },
];

export const INITIAL_INCIDENTS: Incident[] = [
  { id: '1', main_category: 'F', sub_category: 'Budynek mieszkalny', description: 'Zgłoszenie o zadymieniu na klatce schodowej w budynku wielorodzinnym. Wyczuwalny zapach spalenizny z mieszkania na 2. piętrze.', incident_time: '2026-07-22 11:15:00', address: 'ul. Strażacka 12, 00-515 Warszawa', latitude: 52.21584, longitude: 21.01121, status: 'ACTIVE', notified: true },
  { id: '2', main_category: 'LT', sub_category: 'Kolizja drogowa', description: 'Kolizja 2 aut osobowych, wyciek płynów eksploatacyjnych na jezdnię.', incident_time: '2026-07-22 09:40:00', address: 'ul. Hetmańska / Głogowska, Poznań', latitude: 52.3924, longitude: 16.90212, status: 'END', notified: false },
  { id: '3', main_category: 'M', sub_category: 'Zasłabnięcie', description: 'Zasłabnięcie osoby w centrum handlowym. Zespół medyczny w drodze.', incident_time: '2026-07-22 08:05:00', address: 'ul. Półwiejska 32, Poznań', latitude: 52.40637, longitude: 16.9307, status: 'ACTIVE', notified: false },
];

export function useVerticalSplitter(storageKey: string, initialHeight = 260, minTop = 130, minBottom = 110) {
  const [bottomHeight, setBottomHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= minBottom) return parsed;
      }
    } catch {
      // ignore
    }
    return initialHeight;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heightRef = useRef(bottomHeight);
  heightRef.current = bottomHeight;

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const rect = containerRef.current.getBoundingClientRect();
      const newHeight = rect.bottom - clientY;
      const clamped = Math.max(minBottom, Math.min(newHeight, rect.height - minTop));
      setBottomHeight(clamped);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      try {
        localStorage.setItem(storageKey, String(heightRef.current));
      } catch {
        // ignore
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, minTop, minBottom, storageKey]);

  return {
    bottomHeight,
    isDragging,
    containerRef,
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    onTouchStart: () => {
      setIsDragging(true);
    },
  };
}
