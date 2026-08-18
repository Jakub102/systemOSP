import React, { useEffect, useState } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  CheckCircle2, 
  ShieldAlert, 
  X, 
  Minus, 
  Square, 
  Save, 
  LayoutDashboard, 
  ExternalLink, 
  Flame, 
  Lock, 
  User, 
  LogOut, 
  KeyRound, 
  ShieldCheck,
  Mail,
  Phone
} from 'lucide-react';
import { api, ApiError, clearSession, getStoredToken, getStoredUser, saveSession } from './api';
import type { AuthUser, Invitation, RegisterPayload } from './api';

interface FirefighterUser {
  id: string;
  username: string;
  fullName: string;
  password?: string;
  rank: string;
  unit: string;
  role: 'Admin' | 'Dyspozytor' | 'Dowódca' | 'Strażak';
  status: 'Aktywny' | 'Nieaktywny';
}

interface Incident {
  id: string;
  incidentNo: string;
  type: 'Pożar' | 'Miejscowe Zagrożenie' | 'Fałszywy Alarm' | 'Ćwiczenia';
  location: string;
  description: string;
  caller: string;
  status: 'Przyjęte' | 'W toku' | 'Zakończone';
  createdAt: string;
}

const INITIAL_USERS: FirefighterUser[] = [
  { id: '1', username: 'admin', fullName: 'Administrator Systemu SWD', password: 'admin', rank: 'Oficer Dyżurny', unit: 'KM PSP Poznań', role: 'Admin', status: 'Aktywny' },
  { id: '2', username: 'k.kowalski', fullName: 'asp. sztab. Krzysztof Kowalski', password: '123', rank: 'Aspirant sztabowy', unit: 'JRG-1 Poznań', role: 'Dowódca', status: 'Aktywny' },
  { id: '3', username: 'm.nowak', fullName: 'mł. kpt. Michał Nowak', password: '123', rank: 'Młodszy kapitan', unit: 'SKKM Poznań', role: 'Dyspozytor', status: 'Aktywny' },
  { id: '4', username: 'p.wisniewski', fullName: 'st. str. Piotr Wiśniewski', password: '123', rank: 'Starszy strażak', unit: 'OSP Główna', role: 'Strażak', status: 'Aktywny' },
];

const INITIAL_INCIDENTS: Incident[] = [
  { id: '1', incidentNo: 'ZD/2026/08/0101', type: 'Pożar', location: 'ul. Święty Marcin 14, Poznań', description: 'Pożar poddasza w kamienicy', caller: '112 / Zgłoszenie tel.', status: 'W toku', createdAt: '13:15:20' },
  { id: '2', incidentNo: 'ZD/2026/08/0102', type: 'Miejscowe Zagrożenie', location: 'ul. Hetmańska / Głogowska', description: 'Kolizja 2 aut osobowych, wyciek płynów', caller: 'WCPR', status: 'Przyjęte', createdAt: '13:42:05' },
  { id: '3', incidentNo: 'ZD/2026/08/0099', type: 'Fałszywy Alarm', location: 'ul. Półwiejska 32', description: 'Załączenie czujki SAP w centrum handlowym', caller: 'Monitoring SAP', status: 'Zakończone', createdAt: '11:04:12' },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [regForm, setRegForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    password_confirmation: ''
  });
  const [regSuccess, setRegSuccess] = useState('');

  const registerToken = new URLSearchParams(window.location.search).get('token') ?? '';
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [invitationError, setInvitationError] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'incidents'>('dashboard');
  const [users, setUsers] = useState<FirefighterUser[]>(INITIAL_USERS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [userModal, setUserModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data: Partial<FirefighterUser> }>({
    open: false,
    mode: 'add',
    data: {}
  });

  const [incidentModal, setIncidentModal] = useState<{ open: boolean; data: Partial<Incident> }>({
    open: false,
    data: {}
  });

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      setCurrentUser(user);
      api.me()
        .then(me => {
          setCurrentUser(me);
          saveSession(token, me);
        })
        .catch(() => {
          clearSession();
          setCurrentUser(null);
        });
    }
  }, []);

  useEffect(() => {
    if (authView !== 'register') return;
    setInvitation(null);
    setInvitationError('');

    if (!registerToken) {
      setInvitationError('Brak tokenu zaproszenia w adresie URL (/?token=...).');
      return;
    }

    api.verifyInvitation(registerToken)
      .then(setInvitation)
      .catch(err => setInvitationError(err instanceof ApiError ? err.message : 'Nieprawidłowy lub wygasły token zaproszenia.'));
  }, [authView, registerToken]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);

    try {
      const { token, user } = await api.login(loginForm.email, loginForm.password, 'Web Panel');
      saveSession(token, user);
      setCurrentUser(user);
      setLoginForm({ ...loginForm, password: '' });
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Błąd połączenia z serwerem.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);

    const payload: RegisterPayload = {
      token: registerToken,
      first_name: regForm.first_name.trim(),
      last_name: regForm.last_name.trim(),
      phone_number: regForm.phone_number.trim(),
      password: regForm.password,
      password_confirmation: regForm.password_confirmation
    };

    try {
      await api.register(payload);
      setRegSuccess('Rejestracja pomyślna! Możesz się teraz zalogować.');
      setAuthView('login');
      setRegForm({ first_name: '', last_name: '', phone_number: '', password: '', password_confirmation: '' });
      setLoginForm({ email: invitation?.email ?? '', password: '' });
    } catch (err) {
      if (err instanceof ApiError) {
        setLoginError(err.errors
          ? Object.values(err.errors).flat().join(' ')
          : err.message);
      } else {
        setLoginError('Błąd połączenia z serwerem.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (getStoredToken()) await api.logout();
    } catch {
      // sieć może nie odpowiadać — sesję czyścimy lokalnie
    }
    clearSession();
    setCurrentUser(null);
    setActiveTab('dashboard');
    setSelectedUserId(null);
    setSelectedIncidentId(null);
  };

  const handleDeleteUser = () => {
    if (selectedUserId) {
      if (currentUser && String(currentUser.id) === selectedUserId) {
        alert('Nie możesz usunąć aktualnie zalogowanego konta!');
        return;
      }
      setUsers(users.filter(u => u.id !== selectedUserId));
      setSelectedUserId(null);
    }
  };

  const handleOpenAddUser = () => {
    setUserModal({
      open: true,
      mode: 'add',
      data: {
        username: '',
        fullName: '',
        rank: 'Sekcyjny',
        unit: 'JRG-1 Poznań',
        role: 'Strażak',
        status: 'Aktywny'
      }
    });
  };

  const handleOpenEditUser = () => {
    const userToEdit = users.find(u => u.id === selectedUserId);
    if (userToEdit) {
      setUserModal({
        open: true,
        mode: 'edit',
        data: { ...userToEdit }
      });
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (userModal.mode === 'add') {
      const newUser: FirefighterUser = {
        id: String(Date.now()),
        username: userModal.data.username || `user_${Date.now().toString().slice(-4)}`,
        fullName: userModal.data.fullName || 'Nowy Funkcjonariusz',
        rank: userModal.data.rank || 'Sekcyjny',
        unit: userModal.data.unit || 'JRG-1 Poznań',
        role: (userModal.data.role as any) || 'Strażak',
        status: (userModal.data.status as any) || 'Aktywny',
        password: '123'
      };
      setUsers([...users, newUser]);
      setSelectedUserId(newUser.id);
    } else {
      setUsers(users.map(u => u.id === selectedUserId ? { ...u, ...userModal.data } as FirefighterUser : u));
    }
    setUserModal({ open: false, mode: 'add', data: {} });
  };

  const handleDeleteIncident = () => {
    if (selectedIncidentId) {
      setIncidents(incidents.filter(i => i.id !== selectedIncidentId));
      setSelectedIncidentId(null);
    }
  };

  const handleOpenAddIncident = () => {
    const currentNum = incidents.length + 105;
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    setIncidentModal({
      open: true,
      data: {
        incidentNo: `ZD/2026/08/0${currentNum}`,
        type: 'Pożar',
        location: '',
        description: '',
        caller: 'WCPR 112',
        status: 'Przyjęte',
        createdAt: timeString
      }
    });
  };

  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const newInc: Incident = {
      id: String(Date.now()),
      incidentNo: incidentModal.data.incidentNo || `ZD/2026/08/${Date.now().toString().slice(-4)}`,
      type: (incidentModal.data.type as any) || 'Miejscowe Zagrożenie',
      location: incidentModal.data.location || 'Nieokreślona lokalizacja',
      description: incidentModal.data.description || 'Brak dodatkowego opisu',
      caller: incidentModal.data.caller || '112',
      status: (incidentModal.data.status as any) || 'Przyjęte',
      createdAt: incidentModal.data.createdAt || '12:00:00'
    };
    setIncidents([newInc, ...incidents]);
    setSelectedIncidentId(newInc.id);
    setIncidentModal({ open: false, data: {} });
  };

  const handleChangeIncidentStatus = (status: 'Przyjęte' | 'W toku' | 'Zakończone') => {
    if (selectedIncidentId) {
      setIncidents(incidents.map(i => i.id === selectedIncidentId ? { ...i, status } : i));
    }
  };

  const activeIncidentsCount = incidents.filter(i => i.status === 'W toku').length;
  const pendingIncidentsCount = incidents.filter(i => i.status === 'Przyjęte').length;
  const completedIncidentsCount = incidents.filter(i => i.status === 'Zakończone').length;
  const activeUsersCount = users.filter(u => u.status === 'Aktywny').length;

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIncidents = incidents.filter(i => 
    i.incidentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== Ekran logowania / rejestracji =====
  if (!currentUser) {
    return (
      <div className="win-screen">
        <div className="win-grid-bg" />

        <div className="win-frame">
          <div className="win-titlebar">
            <div className="win-title">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>FireOS WinBox - SWD PSP [Logowanie do Węzła]</span>
            </div>
            <div className="win-title-btns">
              <button className="title-btn"><Minus className="w-2.5 h-2.5"/></button>
              <button className="title-btn"><Square className="w-2 h-2"/></button>
              <button className="title-btn title-btn-close"><X className="w-2.5 h-2.5"/></button>
            </div>
          </div>

          <div className="subbar">
            <div className="subbar-tabs">
              <button
                type="button"
                onClick={() => { setAuthView('login'); setLoginError(''); }}
                className={`tab-btn ${authView === 'login' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
              >
                Połącz z serwerem (Login)
              </button>
              <button
                type="button"
                onClick={() => { setAuthView('register'); setLoginError(''); }}
                className={`tab-btn ${authView === 'register' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
              >
                Nowe konto (Rejestracja)
              </button>
            </div>
            <span className="subbar-port">Port: 8291 / TCP</span>
          </div>

          {loginError && (
            <div className="msg msg-error">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {regSuccess && authView === 'login' && (
            <div className="msg msg-success">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{regSuccess}</span>
            </div>
          )}

          <div className="win-content">
            {authView === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className="field-row">
                  <label className="field-label">
                    <Mail className="w-3.5 h-3.5 text-neutral-500" />
                    Adres e-mail:
                  </label>
                  <input 
                    type="email" 
                    required
                    value={loginForm.email} 
                    onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                    className="field-input field-input-bold"
                    placeholder="np. jan.kowalski@osp.pl"
                  />
                </div>

                <div className="field-row">
                  <label className="field-label">
                    <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
                    Hasło dostępu:
                  </label>
                  <input 
                    type="password" 
                    required
                    value={loginForm.password} 
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    className="field-input"
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-footer">
                  <div className="form-note">
                    Urządzenie: <span className="font-bold text-neutral-700">Web Panel</span>
                  </div>
                  <button 
                    type="submit"
                    disabled={authLoading}
                    className="btn-login"
                  >
                    <Lock className="w-3.5 h-3.5 text-blue-700" />
                    <span>{authLoading ? 'Łączenie...' : 'Połącz (Connect)'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="auth-form auth-form-tight">
                <div className="invite-box">
                  {invitationError ? (
                    <div className="invite-warn">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-px" />
                      <span>{invitationError}</span>
                    </div>
                  ) : invitation ? (
                    <div className="invite-ok">
                      <div className="invite-ok-row">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Ważne zaproszenie dla: <span className="font-bold">{invitation.email}</span></span>
                      </div>
                      <div className="invite-meta">
                        {invitation.expires_at
                          ? `Ważne do: ${new Date(invitation.expires_at).toLocaleString('pl-PL')}`
                          : 'Zaproszenie bezterminowe'}
                      </div>
                    </div>
                  ) : (
                    <div className="invite-wait">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>Sprawdzanie tokenu zaproszenia...</span>
                    </div>
                  )}
                </div>

                <div className="field-row">
                  <label className="field-label">
                    <User className="w-3.5 h-3.5 text-neutral-500" />
                    Imię:
                  </label>
                  <input 
                    type="text" 
                    required
                    value={regForm.first_name} 
                    onChange={e => setRegForm({...regForm, first_name: e.target.value})}
                    className="field-input field-input-bold"
                    placeholder="np. Jan"
                  />
                </div>

                <div className="field-row">
                  <label className="field-label">
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
                    Nazwisko:
                  </label>
                  <input 
                    type="text" 
                    required
                    value={regForm.last_name} 
                    onChange={e => setRegForm({...regForm, last_name: e.target.value})}
                    className="field-input"
                    placeholder="np. Kowalski"
                  />
                </div>

                <div className="field-row">
                  <label className="field-label">
                    <Phone className="w-3.5 h-3.5 text-neutral-500" />
                    Telefon:
                  </label>
                  <input 
                    type="tel" 
                    required
                    maxLength={20}
                    value={regForm.phone_number} 
                    onChange={e => setRegForm({...regForm, phone_number: e.target.value})}
                    className="field-input"
                    placeholder="np. 123456789"
                  />
                </div>

                <div className="field-row">
                  <label className="field-label">
                    <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
                    Hasło:
                  </label>
                  <input 
                    type="password" 
                    required
                    minLength={8}
                    value={regForm.password} 
                    onChange={e => setRegForm({...regForm, password: e.target.value})}
                    className="field-input"
                    placeholder="Min. 8 znaków"
                  />
                </div>

                <div className="field-row">
                  <label className="field-label">
                    <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
                    Powtórz hasło:
                  </label>
                  <input 
                    type="password" 
                    required
                    minLength={8}
                    value={regForm.password_confirmation} 
                    onChange={e => setRegForm({...regForm, password_confirmation: e.target.value})}
                    className="field-input"
                    placeholder="Powtórz hasło"
                  />
                </div>

                <div className="form-footer form-footer-end">
                  <button 
                    type="button"
                    onClick={() => setAuthView('login')}
                    className="btn"
                  >
                    Wróć do logowania
                  </button>
                  <button 
                    type="submit"
                    disabled={authLoading || !!invitationError || !registerToken}
                    className="btn-success"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{authLoading ? 'Rejestrowanie...' : 'Zarejestruj konto'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="win-footer">
            <div>Fire-OS Standalone Shell</div>
            <div>Build: 2026.08</div>
          </div>
        </div>
      </div>
    );
  }

  // ===== Panel główny po zalogowaniu =====
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-head">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span className="sidebar-brand">SWD-PSP v2.4</span>
        </div>

        <div className="sidebar-user">
          <div>Jednostka: <span className="text-emerald-400">{currentUser.firehouse?.name ?? '—'}</span></div>
          <div>Konto: <span className="text-neutral-200 font-bold">{currentUser.full_name}</span></div>
          <div>Rola: <span className="text-neutral-200">{currentUser.roles.join(', ') || '—'}</span></div>
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
            onClick={() => { setActiveTab('users'); setSearchTerm(''); }}
            className={`nav-item ${activeTab === 'users' ? 'nav-item-active' : ''}`}
          >
            <div className="nav-item-label">
              <Users className="w-4 h-4" />
              <span>Użytkownicy i Strażacy</span>
            </div>
            <span className={`nav-count ${activeTab === 'users' ? 'nav-count-active' : ''}`}>
              {users.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('incidents'); setSearchTerm(''); }}
            className={`nav-item ${activeTab === 'incidents' ? 'nav-item-active' : ''}`}
          >
            <div className="nav-item-label">
              <AlertTriangle className="w-4 h-4" />
              <span>Dziennik Zdarzeń (Alarmy)</span>
            </div>
            <span className={`nav-count ${activeTab === 'incidents' ? 'nav-count-active' : ''}`}>
              {incidents.length}
            </span>
          </button>
        </nav>

        <div className="sidebar-foot">
          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Wyloguj (Disconnect)</span>
          </button>
        </div>
      </aside>

      <main className="workspace">
        {activeTab === 'dashboard' ? (
          <div className="dash-scroll">
            <div className="dash-head">
              <div className="dash-head-title">
                <LayoutDashboard className="w-4 h-4 text-blue-700" />
                <span className="font-bold text-neutral-800">Pulpit Podsumowania Systemu (Dashboard Overview)</span>
              </div>
              <span className="dash-head-meta">Brak aktywnych otwartych okien</span>
            </div>

            <div className="dash-grid">
              <div className="card">
                <div className="card-head">
                  <div className="card-title">
                    <Users className="w-3.5 h-3.5" />
                    <span>Podsumowanie: Użytkownicy i Obsada</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('users')}
                    title="Otwórz kartę użytkowników"
                    className="card-btn"
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
                    className="card-btn-open"
                  >
                    Otwórz moduł użytkowników &rarr;
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div className="card-title">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Podsumowanie: Stan Operacyjny (Alarmy)</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('incidents')}
                    title="Otwórz kartę zdarzeń"
                    className="card-btn"
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
                      <span>• Zgłoszenia przyjęte (Oczekujące):</span>
                      <span className="stat-detail-val stat-detail-val-warn">{pendingIncidentsCount}</span>
                    </div>
                    <div className="stat-detail-row">
                      <span>• Zakończone działania:</span>
                      <span className="stat-detail-val stat-detail-val-ok">{completedIncidentsCount}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('incidents')}
                    className="card-btn-open"
                  >
                    Otwórz dziennik zdarzeń &rarr;
                  </button>
                </div>
              </div>
            </div>

            <div className="status-bar">
              <div>Serwer łączności: <span className="text-emerald-700 font-bold">DSP-500 ACTIVE</span></div>
              <div>Zalogowano jako: <span className="font-semibold text-neutral-900">{currentUser.full_name}</span></div>
            </div>
          </div>
        ) : (
          <div className="win-window">
            <div className="win-head">
              <div className="win-head-title">
                {activeTab === 'users' ? <Users className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{activeTab === 'users' ? 'Zarządzanie Użytkownikami i Obsadą (Users)' : 'Rejestr Zgłoszeń i Działań Ratowniczych (Incidents)'}</span>
              </div>
              <div className="win-head-btns">
                <button 
                  onClick={() => setActiveTab('dashboard')} 
                  title="Zminimalizuj do podsumowania" 
                  className="title-btn"
                >
                  <Minus className="w-2.5 h-2.5"/>
                </button>
                <button className="title-btn">
                  <Square className="w-2 h-2"/>
                </button>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  title="Zamknij kartę"
                  className="title-btn title-btn-close"
                >
                  <X className="w-2.5 h-2.5"/>
                </button>
              </div>
            </div>

            <div className="toolbar">
              {activeTab === 'users' ? (
                <>
                  <button 
                    onClick={handleOpenAddUser}
                    className="tool-btn"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                    <span>Dodaj strażaka / użytkownika</span>
                  </button>
                  <button 
                    onClick={handleOpenEditUser}
                    disabled={!selectedUserId}
                    className="tool-btn"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edytuj (Modyfikuj)</span>
                  </button>
                  <button 
                    onClick={handleDeleteUser}
                    disabled={!selectedUserId}
                    className="tool-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Usuń</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleOpenAddIncident}
                    className="tool-btn"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                    <span>Nowe Zdarzenie (Alarm)</span>
                  </button>
                  <button 
                    onClick={handleDeleteIncident}
                    disabled={!selectedIncidentId}
                    className="tool-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Usuń</span>
                  </button>
                  <div className="tool-divider" />
                  <button 
                    onClick={() => handleChangeIncidentStatus('W toku')}
                    disabled={!selectedIncidentId}
                    className="tool-btn"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dysponuj (W toku)</span>
                  </button>
                  <button 
                    onClick={() => handleChangeIncidentStatus('Zakończone')}
                    disabled={!selectedIncidentId}
                    className="tool-btn"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Zakończ akcję</span>
                  </button>
                </>
              )}

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

            <div className="table-scroll">
              {activeTab === 'users' ? (
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
                          onDoubleClick={handleOpenEditUser}
                          className={rowClass}
                        >
                          <td className="td td-idx">
                            {index + 1}
                          </td>
                          <td className="td td-login">
                            {user.username}
                          </td>
                          <td className="td">
                            {user.fullName}
                          </td>
                          <td className="td">
                            {user.unit}
                          </td>
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
              ) : (
                <table className="data-table">
                  <thead>
                    <tr className="table-head">
                      <th className="th w-10 text-center">#</th>
                      <th className="th w-32">Numer Meldunku</th>
                      <th className="th w-36">Rodzaj Zdarzenia</th>
                      <th className="th w-48">Adres / Lokalizacja</th>
                      <th className="th">Opis / Sytuacja</th>
                      <th className="th w-24 text-center">Czas</th>
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
                          <td className="td td-idx">
                            {index + 1}
                          </td>
                          <td className="td td-no">
                            {inc.incidentNo}
                          </td>
                          <td className="td">
                            {inc.type}
                          </td>
                          <td className="td td-strong">
                            {inc.location}
                          </td>
                          <td className="td td-clip">
                            {inc.description}
                          </td>
                          <td className="td td-center">
                            {inc.createdAt}
                          </td>
                          <td className="td td-center">
                            <span className={`badge badge-status ${
                              inc.status === 'Przyjęte' ? 'badge-pending' :
                              inc.status === 'W toku' ? 'badge-live' : 'badge-done'
                            }`}>
                              {inc.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="win-footer">
              {activeTab === 'users' ? (
                <div>Użytkowników w systemie: <span className="font-semibold text-neutral-900">{users.length}</span> | Zaznaczono: <span className="font-semibold text-neutral-900">{selectedUserId ? '1' : '0'}</span></div>
              ) : (
                <div>Łącznie zdarzeń w dobie: <span className="font-semibold text-neutral-900">{incidents.length}</span> | Aktywnych (w toku): <span className="font-bold text-red-700">{activeIncidentsCount}</span></div>
              )}
              <div>Zalogowano: {currentUser.full_name}</div>
            </div>

          </div>
        )}
      </main>

      {userModal.open && (
        <div className="modal-backdrop">
          <div className="modal w-[420px]">
            <div className="modal-head">
              <span className="modal-title">
                {userModal.mode === 'add' ? 'Nowy Użytkownik / Strażak' : `Modyfikacja użytkownika: ${userModal.data.username}`}
              </span>
              <button 
                onClick={() => setUserModal({ open: false, mode: 'add', data: {} })}
                className="modal-close"
              >
                <X className="w-2.5 h-2.5"/>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="modal-form">
              <div className="field-row">
                <label className="modal-label">Login systemowy:</label>
                <input 
                  type="text" 
                  required
                  value={userModal.data.username || ''} 
                  onChange={e => setUserModal({...userModal, data: {...userModal.data, username: e.target.value}})}
                  className="modal-input"
                  placeholder="np. j.kowalski"
                />
              </div>

              <div className="field-row">
                <label className="modal-label">Imię i Nazwisko:</label>
                <input 
                  type="text" 
                  required
                  value={userModal.data.fullName || ''} 
                  onChange={e => setUserModal({...userModal, data: {...userModal.data, fullName: e.target.value}})}
                  className="modal-input"
                  placeholder="np. sekc. Jan Kowalski"
                />
              </div>

              <div className="field-row">
                <label className="modal-label">Jednostka / Baza:</label>
                <input 
                  type="text" 
                  value={userModal.data.unit || ''} 
                  onChange={e => setUserModal({...userModal, data: {...userModal.data, unit: e.target.value}})}
                  className="modal-input"
                  placeholder="np. JRG-1 Poznań"
                />
              </div>

              <div className="field-row">
                <label className="modal-label">Uprawnienia:</label>
                <select 
                  value={userModal.data.role || 'Strażak'}
                  onChange={e => setUserModal({...userModal, data: {...userModal.data, role: e.target.value as any}})}
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
                  value={userModal.data.status || 'Aktywny'}
                  onChange={e => setUserModal({...userModal, data: {...userModal.data, status: e.target.value as any}})}
                  className="modal-input"
                >
                  <option value="Aktywny">Aktywny</option>
                  <option value="Nieaktywny">Zablokowany / Urlop</option>
                </select>
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  onClick={() => setUserModal({ open: false, mode: 'add', data: {} })}
                  className="btn-ghost"
                >
                  Anuluj
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                >
                  <Save className="w-3 h-3" />
                  <span>Zapisz</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {incidentModal.open && (
        <div className="modal-backdrop">
          <div className="modal w-[460px]">
            <div className="modal-head">
              <span className="modal-title">Rejestracja Nowego Zgłoszenia Alarmowego</span>
              <button 
                onClick={() => setIncidentModal({ open: false, data: {} })}
                className="modal-close"
              >
                <X className="w-2.5 h-2.5"/>
              </button>
            </div>

            <form onSubmit={handleSaveIncident} className="modal-form">
              <div className="field-row">
                <label className="modal-label">Numer Zdarzenia:</label>
                <input 
                  type="text" 
                  readOnly
                  value={incidentModal.data.incidentNo || ''} 
                  className="modal-input modal-input-ro"
                />
              </div>

              <div className="field-row">
                <label className="modal-label">Rodzaj zdarzenia:</label>
                <select 
                  value={incidentModal.data.type || 'Pożar'}
                  onChange={e => setIncidentModal({...incidentModal, data: {...incidentModal.data, type: e.target.value as any}})}
                  className="modal-input"
                >
                  <option value="Pożar">Pożar (P)</option>
                  <option value="Miejscowe Zagrożenie">Miejscowe Zagrożenie (MZ)</option>
                  <option value="Fałszywy Alarm">Alarm Fałszywy (AF)</option>
                  <option value="Ćwiczenia">Ćwiczenia / Manewry</option>
                </select>
              </div>

              <div className="field-row">
                <label className="modal-label">Dokładny adres:</label>
                <input 
                  type="text" 
                  required
                  value={incidentModal.data.location || ''} 
                  onChange={e => setIncidentModal({...incidentModal, data: {...incidentModal.data, location: e.target.value}})}
                  className="modal-input"
                  placeholder="Miejscowość, ulica, nr domu/km trasy"
                />
              </div>

              <div className="field-row">
                <label className="modal-label">Zgłaszający / Źródło:</label>
                <input 
                  type="text" 
                  value={incidentModal.data.caller || ''} 
                  onChange={e => setIncidentModal({...incidentModal, data: {...incidentModal.data, caller: e.target.value}})}
                  className="modal-input"
                  placeholder="np. CPR 112 / Patrol Policji"
                />
              </div>

              <div className="field-row field-row-top">
                <label className="modal-label pt-1">Opis sytuacji:</label>
                <textarea 
                  rows={3}
                  value={incidentModal.data.description || ''} 
                  onChange={e => setIncidentModal({...incidentModal, data: {...incidentModal.data, description: e.target.value}})}
                  className="modal-input resize-none"
                  placeholder="Krótki opis zagrożenia, osoby poszkodowane itp."
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  onClick={() => setIncidentModal({ open: false, data: {} })}
                  className="btn-ghost"
                >
                  Anuluj
                </button>
                <button 
                  type="submit"
                  className="btn-danger"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Zarejestruj Zgłoszenie</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
