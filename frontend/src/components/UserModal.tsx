import React from 'react';
import { X, Save } from 'lucide-react';
import type { FirefighterUser } from '../types';

export interface UserModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  data: Partial<FirefighterUser>;
  onClose: () => void;
  onChangeData: (data: Partial<FirefighterUser>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  mode,
  data,
  onClose,
  onChangeData,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal w-[420px]">
        <div className="modal-head">
          <span className="modal-title">
            {mode === 'add' ? 'Nowy Użytkownik / Strażak' : `Modyfikacja użytkownika: ${data.username}`}
          </span>
          <button 
            onClick={onClose}
            className="modal-close cursor-pointer"
          >
            <X className="w-2.5 h-2.5"/>
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-form">
          <div className="field-row">
            <label className="modal-label">Login systemowy:</label>
            <input 
              type="text" 
              required
              value={data.username || ''} 
              onChange={e => onChangeData({ ...data, username: e.target.value })}
              className="modal-input"
              placeholder="np. j.kowalski"
            />
          </div>

          <div className="field-row">
            <label className="modal-label">Imię i Nazwisko:</label>
            <input 
              type="text" 
              required
              value={data.fullName || ''} 
              onChange={e => onChangeData({ ...data, fullName: e.target.value })}
              className="modal-input"
              placeholder="np. sekc. Jan Kowalski"
            />
          </div>

          <div className="field-row">
            <label className="modal-label">Jednostka / Baza:</label>
            <input 
              type="text" 
              value={data.unit || ''} 
              onChange={e => onChangeData({ ...data, unit: e.target.value })}
              className="modal-input"
              placeholder="np. JRG-1 Poznań"
            />
          </div>

          <div className="field-row">
            <label className="modal-label">Uprawnienia:</label>
            <select 
              value={data.role || 'Strażak'}
              onChange={e => onChangeData({ ...data, role: e.target.value as any })}
              className="modal-input"
            >
              <option value="Strażak">Strażak (Podstawowe)</option>
              <option value="Dowódca">Dowódca Sekcji/Zmiany</option>
              <option value="Dyspozytor">Dyspozytor SKKM/SKKP</option>
              <option value="Admin">Administrator Systemu</option>
            </select>
          </div>

          <div className="field-row">
            <label className="modal-label">Status konta:</label>
            <select 
              value={data.status || 'Aktywny'}
              onChange={e => onChangeData({ ...data, status: e.target.value as any })}
              className="modal-input"
            >
              <option value="Aktywny">Aktywny</option>
              <option value="Nieaktywny">Zablokowany / Urlop</option>
            </select>
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
              className="btn-primary cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3 h-3" />
              <span>Zapisz</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
