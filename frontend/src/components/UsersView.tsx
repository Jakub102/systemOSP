import React from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  X,
  Mail,
  RefreshCw,
  UserPlus,
  Send,
  AlertTriangle,
} from 'lucide-react';
import type { AuthUser, PendingInvitation, RoleOption } from '../api';
import { INVITATION_ROLES } from '../api';
import type { FirefighterUser, useVerticalSplitter } from '../types';
import { formatDateTime } from '../types';

export interface UsersViewProps {
  users: FirefighterUser[];
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  flashMsg: string;
  onOpenAddUser: () => void;
  onOpenEditUser: () => void;
  onDeleteUser: () => void;
  onCloseView: () => void;
  currentUser: AuthUser;
  invitationsList: PendingInvitation[];
  invitationsLoading: boolean;
  onFetchInvitations: (showFlash?: boolean) => void;
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  inviteRole: number;
  setInviteRole: (role: number) => void;
  sendingInvite: boolean;
  onSendInvitation: (e: React.FormEvent) => void;
  onDeleteInvitation: (id: number) => void;
  deletingInviteId: number | null;
  inviteError: string;
  inviteSuccess: string;
  splitter: ReturnType<typeof useVerticalSplitter>;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  selectedUserId,
  setSelectedUserId,
  searchTerm,
  setSearchTerm,
  flashMsg,
  onOpenAddUser,
  onOpenEditUser,
  onDeleteUser,
  onCloseView,
  currentUser,
  invitationsList,
  invitationsLoading,
  onFetchInvitations,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  sendingInvite,
  onSendInvitation,
  onDeleteInvitation,
  deletingInviteId,
  inviteError,
  inviteSuccess,
  splitter,
}) => {
  const q = searchTerm.toLowerCase();
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(q) ||
    u.fullName.toLowerCase().includes(q) ||
    u.unit.toLowerCase().includes(q) ||
    u.role.toLowerCase().includes(q)
  );

  return (
    <div className="win-window">
      {/* Pasek Tytułowy Okna */}
      <div className="win-head">
        <div className="win-head-title">
          <Users className="w-3.5 h-3.5" />
          <span>Zarządzanie Użytkownikami i Obsadą (Users)</span>
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
          onClick={onOpenAddUser}
          className="tool-btn cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-600 font-bold" />
          <span>Dodaj strażaka / użytkownika</span>
        </button>
        <button 
          onClick={onOpenEditUser}
          disabled={!selectedUserId}
          className="tool-btn cursor-pointer disabled:opacity-50"
        >
          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
          <span>Edytuj (Modyfikuj)</span>
        </button>
        <button 
          onClick={onDeleteUser}
          disabled={!selectedUserId}
          className="tool-btn cursor-pointer disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-600" />
          <span>Usuń</span>
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
        {/* Górny Panel: Tabela zarejestrowanych strażaków / użytkowników */}
        <div className="flex-1 overflow-auto min-h-0">
          <table className="data-table">
            <thead>
              <tr className="table-head">
                <th className="th w-10 text-center">#</th>
                <th className="th w-28">Login</th>
                <th className="th">Imię i Nazwisko / Stopień</th>
                <th className="th w-36">Jednostka (JRG/OSP)</th>
                <th className="th w-28 text-center">Uprawnienia</th>
                <th className="th w-20 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => {
                const isSelected = selectedUserId === user.id;
                const rowClass = isSelected ? 'tr tr-selected' : index % 2 === 1 ? 'tr tr-alt' : 'tr';
                return (
                  <tr 
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    onDoubleClick={onOpenEditUser}
                    className={rowClass}
                  >
                    <td className="td td-idx">{index + 1}</td>
                    <td className="td td-login">{user.username}</td>
                    <td className="td">{user.fullName}</td>
                    <td className="td">{user.unit}</td>
                    <td className="td td-center">
                      <span className={`badge badge-role ${
                        user.role === 'Admin' ? 'badge-role-admin' :
                        user.role === 'Dyspozytor' ? 'badge-role-dyspozytor' :
                        user.role === 'Dowódca' ? 'badge-role-dowodca' : 'badge-role-strazak'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="td td-center">
                      <span className={`badge badge-status ${
                        user.status === 'Aktywny' ? 'badge-on' : 'badge-off'
                      }`}>
                        {user.status}
                      </span>
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
            splitter.isDragging ? 'bg-[#c0bcaf] shadow-inner ring-1 ring-blue-500' : ''
          }`}
          title="Przeciągnij w pionie, aby zmienić proporcje tabeli i modułu zaproszeń"
        >
          <div className="w-12 h-1 flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <span className="w-1 h-1 rounded-full bg-[#555]" />
            <span className="w-1 h-1 rounded-full bg-[#555]" />
            <span className="w-1 h-1 rounded-full bg-[#555]" />
            <span className="w-1 h-1 rounded-full bg-[#555]" />
            <span className="w-1 h-1 rounded-full bg-[#555]" />
          </div>
        </div>

        {/* Dolny Panel: Sekcja Zaproszeń do Jednostki (Wiszące w systemie) */}
        <div
          style={{ height: `${splitter.bottomHeight}px`, maxHeight: 'calc(100% - 130px)' }}
          className="bg-[#ece9d8] flex flex-col shrink-0 overflow-hidden shadow-sm"
        >
          {/* Pasek Tytułowy Modułu Zaproszeń */}
          <div className="h-6 bg-gradient-to-r from-[#0a246a] via-[#104ba9] to-[#a6caf0] text-white px-2 flex items-center justify-between shadow-2xs select-none">
            <div className="flex items-center gap-1.5 font-bold text-[11px]">
              <Mail className="w-3.5 h-3.5" />
              <span>Aktualne Zaproszenia do Jednostki (Wiszące w systemie)</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-900/80 rounded border border-blue-400 font-mono text-white">
                {invitationsList.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onFetchInvitations(false)}
                disabled={invitationsLoading}
                className="tool-btn text-black text-[10px] py-0 px-2 h-4.5 cursor-pointer disabled:opacity-50"
                title="Odśwież listę oczekujących zaproszeń"
              >
                <RefreshCw className={`w-3 h-3 text-blue-700 ${invitationsLoading ? 'animate-spin' : ''}`} />
                <span>{invitationsLoading ? 'Pobieranie...' : 'Odśwież listę'}</span>
              </button>
            </div>
          </div>

          {/* Formularz Zapraszania Nowego Członka */}
          <div className="p-2 bg-[#f4f2e6] border-b border-[#b0b0b0]">
            <form onSubmit={onSendInvitation} className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="font-sans font-bold text-neutral-800 flex items-center gap-1 whitespace-nowrap">
                <UserPlus className="w-3.5 h-3.5 text-blue-700" />
                Nowe zaproszenie:
              </span>
              
              <div className="flex items-center gap-1 flex-1 min-w-[220px]">
                <label className="font-sans font-semibold text-neutral-700 text-[10px] whitespace-nowrap">
                  E-mail:
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="np. nowystrazak@osp.pl"
                  className="field-input py-0.5 px-1.5 text-xs bg-white font-mono flex-1"
                />
              </div>

              <div className="flex items-center gap-1">
                <label className="font-sans font-semibold text-neutral-700 text-[10px] whitespace-nowrap">
                  Rola:
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(Number(e.target.value))}
                  className="field-input py-0.5 px-1.5 text-xs bg-white font-sans"
                >
                  {INVITATION_ROLES
                    .filter(r => r.name !== 'admin' || (currentUser?.roles?.includes('Administrator') || currentUser?.roles?.includes('admin')))
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))
                  }
                </select>
              </div>

              <button
                type="submit"
                disabled={sendingInvite}
                className="tool-btn bg-[#2563eb] text-white hover:bg-blue-700 border-blue-900 font-sans font-bold text-xs px-2.5 py-0.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>{sendingInvite ? 'Wysyłanie...' : 'Wyślij zaproszenie'}</span>
              </button>
            </form>

            {inviteError && (
              <div className="mt-1.5 px-2 py-0.5 bg-red-100 border border-red-400 text-red-800 text-[10px] font-mono flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}
            {inviteSuccess && (
              <div className="mt-1.5 px-2 py-0.5 bg-emerald-100 border border-emerald-400 text-emerald-800 text-[10px] font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{inviteSuccess}</span>
              </div>
            )}
          </div>

          {/* Tabela Wiszących Zaproszeń */}
          <div className="overflow-auto max-h-44 bg-white">
            <table className="data-table">
              <thead>
                <tr className="table-head">
                  <th className="th w-10 text-center">#</th>
                  <th className="th">Adres e-mail</th>
                  <th className="th w-36">Przypisana rola</th>
                  <th className="th w-36 text-center">Ważność (do)</th>
                  <th className="th w-36 text-center">Status</th>
                  <th className="th w-28 text-center">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {invitationsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-neutral-500 font-sans text-xs italic">
                      Brak wiszących zaproszeń w systemie. Użyj powyższego formularza, aby wysłać nowe zaproszenie.
                    </td>
                  </tr>
                ) : (
                  invitationsList.map((inv, idx) => {
                    const isExp = inv.expires_at ? new Date(inv.expires_at).getTime() < Date.now() : false;
                    return (
                      <tr key={inv.id} className={idx % 2 === 1 ? 'tr tr-alt' : 'tr'}>
                        <td className="td td-idx">{idx + 1}</td>
                        <td className="td font-bold text-neutral-800 font-mono">{inv.email}</td>
                        <td className="td">
                          <span className="badge badge-role badge-role-strazak font-sans">
                            {inv.role_name || INVITATION_ROLES.find(r => r.id === inv.role_id)?.label || 'Strażak'}
                          </span>
                        </td>
                        <td className="td td-center font-mono text-[10px] text-neutral-600">
                          {formatDateTime(inv.expires_at)}
                        </td>
                        <td className="td td-center">
                          {isExp ? (
                            <span className="badge badge-cat-F">Wygasło</span>
                          ) : (
                            <span className="badge bg-amber-100 text-amber-900 border border-amber-300">
                              Oczekuje w systemie
                            </span>
                          )}
                        </td>
                        <td className="td td-center">
                          <button
                            onClick={() => onDeleteInvitation(inv.id)}
                            disabled={deletingInviteId === inv.id}
                            className="tool-btn text-red-700 hover:text-red-900 hover:bg-red-50 border-red-300 text-[10px] py-0.5 px-1.5 mx-auto cursor-pointer disabled:opacity-50"
                            title="Usuń / Anuluj to zaproszenie"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                            <span>{deletingInviteId === inv.id ? 'Usuwanie...' : 'Usuń'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stopka Okna */}
      <div className="win-footer">
        <div>
          Użytkowników w systemie: <span className="font-semibold text-neutral-900">{users.length}</span> | Zaznaczono: <span className="font-semibold text-neutral-900">{selectedUserId ? '1' : '0'}</span> | Oczekujących zaproszeń: <span className="font-semibold text-amber-800">{invitationsList.length}</span>
        </div>
        <div>Zalogowano: {currentUser.full_name}</div>
      </div>
    </div>
  );
};
