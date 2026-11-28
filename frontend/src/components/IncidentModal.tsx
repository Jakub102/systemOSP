import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { Incident } from '../types';

export interface IncidentModalProps {
  isOpen: boolean;
  data: Partial<Incident>;
  onClose: () => void;
  onChangeData: (data: Partial<Incident>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  isOpen,
  data,
  onClose,
  onChangeData,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal w-[460px]">
        <div className="modal-head">
          <span className="modal-title">Rejestracja Nowego Zgłoszenia Alarmowego</span>
          <button 
            onClick={onClose}
            className="modal-close cursor-pointer"
          >
            <X className="w-2.5 h-2.5"/>
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-form">
          <div className="field-row">
            <label className="modal-label">Kategoria główna:</label>
            <select 
              value={data.main_category || 'F'}
              onChange={e => onChangeData({ ...data, main_category: e.target.value as any })}
              className="modal-input"
            >
              <option value="F">F - Pożar</option>
              <option value="LT">LT - Miejscowe zagrożenie</option>
              <option value="A">A - Wypadek</option>
              <option value="M">M - Zdarzenie medyczne</option>
              <option value="FA">FA - Fałszywy alarm</option>
            </select>
          </div>

          <div className="field-row">
            <label className="modal-label">Podkategoria:</label>
            <input 
              type="text" 
              required
              value={data.sub_category || ''} 
              onChange={e => onChangeData({ ...data, sub_category: e.target.value })}
              className="modal-input"
              placeholder="np. Budynek mieszkalny"
            />
          </div>

          <div className="field-row">
            <label className="modal-label">Adres zdarzenia:</label>
            <input 
              type="text" 
              required
              value={data.address || ''} 
              onChange={e => onChangeData({ ...data, address: e.target.value })}
              className="modal-input"
              placeholder="Miejscowość, ulica, nr domu/km trasy"
            />
          </div>

          <div className="field-row">
            <label className="modal-label">Czas zdarzenia:</label>
            <input 
              type="datetime-local" 
              required
              value={data.incident_time || ''} 
              onChange={e => onChangeData({ ...data, incident_time: e.target.value })}
              className="modal-input"
            />
          </div>

          <div className="field-row">
            <label className="modal-label">Szerokość (lat):</label>
            <input 
              type="number" 
              required
              step="any"
              value={Number.isFinite(data.latitude) ? data.latitude : ''} 
              onChange={e => onChangeData({ ...data, latitude: parseFloat(e.target.value) })}
              className="modal-input font-mono"
              placeholder="52.21584"
            />
          </div>

          <div className="field-row">
            <label className="modal-label">Długość (lng):</label>
            <input 
              type="number" 
              required
              step="any"
              value={Number.isFinite(data.longitude) ? data.longitude : ''} 
              onChange={e => onChangeData({ ...data, longitude: parseFloat(e.target.value) })}
              className="modal-input font-mono"
              placeholder="21.01121"
            />
          </div>

          <div className="field-row field-row-top">
            <label className="modal-label pt-1">Opis sytuacji:</label>
            <textarea 
              rows={3}
              value={data.description || ''} 
              onChange={e => onChangeData({ ...data, description: e.target.value })}
              className="modal-input resize-none"
              placeholder="Krótki opis zagrożenia, osoby poszkodowane itp."
            />
          </div>

          <div className="modal-footer">
            <button 
              type="button"
              onClick={onClose}
              className="btn-ghost cursor-pointer"
            >
              Anuluj
            </button>
            <button 
              type="submit"
              className="btn-danger cursor-pointer flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Zarejestruj Zgłoszenie</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
