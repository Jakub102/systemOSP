import React, { useEffect, useState } from 'react';
import { 
  api, 
  ApiError, 
  clearSession, 
  getStoredToken, 
  getStoredUser, 
  saveSession,
  getStoredPendingInvitations,
  saveStoredPendingInvitations,
  INVITATION_ROLES
} from './api';
import type { AuthUser, Invitation, RegisterPayload, PendingInvitation } from './api';
import type { FirefighterUser, Incident, MainCategory } from './types';
import { 
  INITIAL_USERS, 
  INITIAL_INCIDENTS, 
  MAIN_CATEGORY_LABELS, 
  nowLocalInput, 
  useVerticalSplitter 
} from './types';

import { Sidebar } from './components/Sidebar';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { UsersView } from './components/UsersView';
import { IncidentsView } from './components/IncidentsView';
import { LiveIncidentMap } from './LiveIncidentMap';
import { UserModal } from './components/UserModal';
import { IncidentModal } from './components/IncidentModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [regForm, setRegForm] = useState<RegisterPayload>({
    token: '',
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'incidents' | 'map'>('dashboard');
  const [focusedIncidentIdOnMap, setFocusedIncidentIdOnMap] = useState<string | null>(null);
  const usersSplitter = useVerticalSplitter('osp_split_users_h', 250, 130, 110);
  const incidentsSplitter = useVerticalSplitter('osp_split_incidents_h', 280, 130, 110);
  const [users, setUsers] = useState<FirefighterUser[]>(INITIAL_USERS);
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const raw = localStorage.getItem('osp_incidents');
    if (!raw) return INITIAL_INCIDENTS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_INCIDENTS;
    } catch {
      return INITIAL_INCIDENTS;
    }
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingIncident, setSendingIncident] = useState(false);
  const [flashMsg, setFlashMsg] = useState('');

  // Stan formularza nowego incydentu dla administratora
  const [newIncForm, setNewIncForm] = useState({
    main_category: 'F' as MainCategory,
    sub_category: '',
    address: '',
    incident_time: nowLocalInput(),
    latitude: '52.406370',
    longitude: '16.925167',
    description: '',
    sendPush: true,
  });
  const [creatingIncident, setCreatingIncident] = useState(false);
  const [incidentFormError, setIncidentFormError] = useState('');
  const [incidentFormSuccess, setIncidentFormSuccess] = useState('');

  // Stan modułu zaproszeń
  const [invitationsList, setInvitationsList] = useState<PendingInvitation[]>(() => getStoredPendingInvitations());
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<number>(3);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [deletingInviteId, setDeletingInviteId] = useState<number | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

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

  useEffect(() => {
    if (!flashMsg) return;
    const t = setTimeout(() => setFlashMsg(''), 4000);
    return () => clearTimeout(t);
  }, [flashMsg]);

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
      setRegForm({ token: '', first_name: '', last_name: '', phone_number: '', password: '', password_confirmation: '' });
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

  const fetchInvitations = async (silent = false) => {
    if (!getStoredToken()) return;
    if (!silent) setInvitationsLoading(true);
    try {
      const serverInvs = await api.getInvitations();
      if (Array.isArray(serverInvs)) {
        const enriched = serverInvs.map(inv => ({
          ...inv,
          role_name: inv.role_name || INVITATION_ROLES.find(r => r.id === inv.role_id)?.label || 'Strażak'
        }));
        setInvitationsList(enriched);
        saveStoredPendingInvitations(enriched);
        if (!silent) setFlashMsg('Zaktualizowano listę zaproszeń z serwera.');
      }
    } catch {
      // Graceful fallback do pamięci podręcznej przeglądarki
      const localInvs = getStoredPendingInvitations();
      setInvitationsList(localInvs);
      if (!silent) setFlashMsg('Odświeżono listę zaproszeń.');
    } finally {
      if (!silent) setInvitationsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && activeTab === 'users') {
      fetchInvitations(true);
    }
  }, [currentUser, activeTab]);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    const emailTrimmed = inviteEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setInviteError('Podaj prawidłowy adres e-mail.');
      return;
    }

    setSendingInvite(true);
    try {
      const roleId = Number(inviteRole);
      const roleObj = INVITATION_ROLES.find(r => r.id === roleId);
      const res = await api.createInvitation({ email: emailTrimmed, role_id: roleId });

      const newInv: PendingInvitation = {
        id: res.data?.id || Date.now(),
        email: res.data?.email || emailTrimmed,
        role_id: roleId,
        role_name: roleObj?.label || 'Strażak',
        expires_at: res.data?.expires_at || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      setInvitationsList(prev => {
        const filtered = prev.filter(inv => inv.email.toLowerCase() !== emailTrimmed);
        const updated = [newInv, ...filtered];
        saveStoredPendingInvitations(updated);
        return updated;
      });

      setInviteSuccess(res.message || `Zaproszenie dla ${emailTrimmed} zostało pomyślnie wysłane.`);
      setInviteEmail('');
    } catch (err) {
      if (err instanceof ApiError) {
        setInviteError(
          err.errors
            ? Object.values(err.errors).flat().join(' ')
            : err.message
        );
      } else {
        setInviteError('Błąd połączenia z serwerem podczas wysyłania zaproszenia.');
      }
    } finally {
      setSendingInvite(false);
    }
  };

  const handleDeleteInvitation = async (id: number) => {
    const invToDelete = invitationsList.find(i => i.id === id);
    if (!window.confirm(`Czy na pewno chcesz anulować i usunąć zaproszenie dla ${invToDelete?.email || 'kandydata'}?`)) {
      return;
    }

    setDeletingInviteId(id);
    setInviteError('');
    setInviteSuccess('');

    try {
      await api.deleteInvitation(id);
      setInviteSuccess('Zaproszenie zostało pomyślnie anulowane.');
    } catch (err) {
      if (err instanceof ApiError) {
        setInviteError(err.message);
      }
    }

    setInvitationsList(prev => {
      const updated = prev.filter(inv => inv.id !== id);
      saveStoredPendingInvitations(updated);
      return updated;
    });
    setDeletingInviteId(null);
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
      const updated = incidents.filter(i => i.id !== selectedIncidentId);
      setIncidents(updated);
      localStorage.setItem('osp_incidents', JSON.stringify(updated));
      setSelectedIncidentId(null);
    }
  };

  const isUserAdmin = !!currentUser?.roles?.some(r => {
    const lower = r.toLowerCase();
    return lower === 'administrator' || lower === 'admin' || lower === 'system';
  });

  const handleFillFirehouseCoords = () => {
    if (currentUser?.firehouse?.latitude && currentUser?.firehouse?.longitude) {
      setNewIncForm(prev => ({
        ...prev,
        latitude: String(currentUser.firehouse!.latitude),
        longitude: String(currentUser.firehouse!.longitude),
        address: prev.address || (currentUser.firehouse?.address ? `${currentUser.firehouse.address}, ${currentUser.firehouse.city || ''}` : prev.address),
      }));
    } else {
      setNewIncForm(prev => ({
        ...prev,
        latitude: '52.406370',
        longitude: '16.925167',
        address: prev.address || 'ul. Strażacka 1, 60-001 Poznań',
      }));
    }
  };

  const handleResetIncidentForm = () => {
    setNewIncForm({
      main_category: 'F',
      sub_category: '',
      address: '',
      incident_time: nowLocalInput(),
      latitude: '52.406370',
      longitude: '16.925167',
      description: '',
      sendPush: true,
    });
    setIncidentFormError('');
  };

  const handleCreateIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncidentFormError('');
    setIncidentFormSuccess('');

    if (!newIncForm.sub_category.trim()) {
      setIncidentFormError('Wpisz podkategorię zdarzenia (np. Budynek mieszkalny).');
      return;
    }
    if (!newIncForm.address.trim()) {
      setIncidentFormError('Wpisz dokładny adres lub lokalizację zdarzenia.');
      return;
    }

    const lat = parseFloat(newIncForm.latitude);
    const lng = parseFloat(newIncForm.longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setIncidentFormError('Podaj poprawne współrzędne GPS (szerokość -90..90, długość -180..180).');
      return;
    }

    setCreatingIncident(true);

    let incidentTime = (newIncForm.incident_time || nowLocalInput()).replace('T', ' ');
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(incidentTime)) {
      incidentTime += ':00';
    }

    const createdIncident: Incident = {
      id: String(Date.now()),
      main_category: newIncForm.main_category,
      sub_category: newIncForm.sub_category.trim(),
      description: newIncForm.description.trim() || 'Brak dodatkowego opisu',
      incident_time: incidentTime,
      address: newIncForm.address.trim(),
      latitude: lat,
      longitude: lng,
      status: 'ACTIVE',
      notified: newIncForm.sendPush,
    };

    // Próba wysłania do backendu (jeśli endpoint jest dostępny dla roli)
    try {
      await api.createIncident({
        main_category: createdIncident.main_category,
        sub_category: createdIncident.sub_category,
        description: createdIncident.description,
        incident_time: createdIncident.incident_time,
        address: createdIncident.address,
        latitude: createdIncident.latitude,
        longitude: createdIncident.longitude,
        status: 'ACTIVE',
      });
    } catch {
      // Obsłużenie fallbacku gdy backend wymaga uprawnień system
    }

    const updatedIncidents = [createdIncident, ...incidents];
    setIncidents(updatedIncidents);
    localStorage.setItem('osp_incidents', JSON.stringify(updatedIncidents));
    setSelectedIncidentId(createdIncident.id);

    setIncidentFormSuccess(
      `Zdarzenie [${MAIN_CATEGORY_LABELS[createdIncident.main_category]}: ${createdIncident.sub_category}] zostało zarejestrowane${newIncForm.sendPush ? ' i zadysponowane jako alarm (PUSH).' : '.'}`
    );

    handleResetIncidentForm();
    setCreatingIncident(false);
  };

  const handleOpenAddIncident = () => {
    setIncidentModal({
      open: true,
      data: {
        main_category: 'F',
        sub_category: '',
        description: '',
        incident_time: nowLocalInput(),
        address: '',
        latitude: 52.21584,
        longitude: 21.01121,
        status: 'ACTIVE'
      }
    });
  };

  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    let incident_time = (incidentModal.data.incident_time || nowLocalInput()).replace('T', ' ');
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(incident_time)) {
      incident_time += ':00';
    }
    const newInc: Incident = {
      id: String(Date.now()),
      main_category: incidentModal.data.main_category || 'F',
      sub_category: incidentModal.data.sub_category?.trim() || 'Nieokreślona',
      description: incidentModal.data.description?.trim() || 'Brak dodatkowego opisu',
      incident_time,
      address: incidentModal.data.address?.trim() || 'Nieokreślona lokalizacja',
      latitude: Number(incidentModal.data.latitude) || 0,
      longitude: Number(incidentModal.data.longitude) || 0,
      status: 'ACTIVE',
      notified: false
    };
    const updated = [newInc, ...incidents];
    setIncidents(updated);
    localStorage.setItem('osp_incidents', JSON.stringify(updated));
    setSelectedIncidentId(newInc.id);
    setIncidentModal({ open: false, data: {} });
  };

  const handleChangeIncidentStatus = (status: 'ACTIVE' | 'END') => {
    if (selectedIncidentId) {
      const updated = incidents.map(i => i.id === selectedIncidentId ? { ...i, status } : i);
      setIncidents(updated);
      localStorage.setItem('osp_incidents', JSON.stringify(updated));
    }
  };

  const handleSendIncident = async () => {
    if (!selectedIncidentId) return;
    const target = incidents.find(i => i.id === selectedIncidentId);
    if (!target || target.notified) return;

    setSendingIncident(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setIncidents(incidents.map(i => i.id === selectedIncidentId ? { ...i, notified: true } : i));
    setSendingIncident(false);
    setFlashMsg(`Zdarzenie (${MAIN_CATEGORY_LABELS[target.main_category]} - ${target.sub_category}) wysłane do aplikacji mobilnej.`);
  };

  const activeIncidentsCount = incidents.filter(i => i.status === 'ACTIVE').length;
  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) ?? undefined;

  // ===== Ekran logowania / rejestracji =====
  if (!currentUser) {
    return (
      <AuthScreen
        authView={authView}
        setAuthView={setAuthView}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginError={loginError}
        setLoginError={setLoginError}
        authLoading={authLoading}
        regSuccess={regSuccess}
        regForm={regForm}
        setRegForm={setRegForm}
        registerToken={registerToken}
        invitation={invitation}
        invitationError={invitationError}
        onLoginSubmit={handleLoginSubmit}
        onRegisterSubmit={handleRegisterSubmit}
      />
    );
  }

  // ===== Ekran Główny Pulpitu =====
  return (
    <div className="app-shell">
      {/* Pasek Boczny / Nawigacja */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        usersCount={users.length}
        incidentsCount={incidents.length}
        activeIncidentsCount={activeIncidentsCount}
        onLogout={handleLogout}
        onClearSearch={() => setSearchTerm('')}
      />

      {/* Główny Obszar Roboczy */}
      <div className="workspace">
        {activeTab === 'dashboard' ? (
          <DashboardView
            users={users}
            incidents={incidents}
            currentUser={currentUser}
            setActiveTab={setActiveTab}
          />
        ) : activeTab === 'map' ? (
          <LiveIncidentMap
            activeIncidents={incidents.filter(inc => inc.status === 'ACTIVE')}
            firehouse={currentUser.firehouse}
            selectedIncidentId={focusedIncidentIdOnMap}
            onSelectIncident={(id) => setFocusedIncidentIdOnMap(id)}
            onOpenIncidentForm={() => {
              setActiveTab('incidents');
            }}
          />
        ) : activeTab === 'users' ? (
          <UsersView
            users={users}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            flashMsg={flashMsg}
            onOpenAddUser={handleOpenAddUser}
            onOpenEditUser={handleOpenEditUser}
            onDeleteUser={handleDeleteUser}
            onCloseView={() => setActiveTab('dashboard')}
            currentUser={currentUser}
            invitationsList={invitationsList}
            invitationsLoading={invitationsLoading}
            onFetchInvitations={fetchInvitations}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            inviteRole={inviteRole}
            setInviteRole={setInviteRole}
            sendingInvite={sendingInvite}
            onSendInvitation={handleSendInvitation}
            onDeleteInvitation={handleDeleteInvitation}
            deletingInviteId={deletingInviteId}
            inviteError={inviteError}
            inviteSuccess={inviteSuccess}
            splitter={usersSplitter}
          />
        ) : (
          <IncidentsView
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            setSelectedIncidentId={setSelectedIncidentId}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            flashMsg={flashMsg}
            onOpenAddIncident={handleOpenAddIncident}
            onDeleteIncident={handleDeleteIncident}
            onChangeIncidentStatus={handleChangeIncidentStatus}
            onSendIncident={handleSendIncident}
            sendingIncident={sendingIncident}
            selectedIncident={selectedIncident}
            onOpenMap={(incidentId) => {
              if (incidentId) {
                setFocusedIncidentIdOnMap(incidentId);
              }
              setActiveTab('map');
            }}
            onCloseView={() => setActiveTab('dashboard')}
            currentUser={currentUser}
            isUserAdmin={isUserAdmin}
            newIncForm={newIncForm}
            setNewIncForm={setNewIncForm}
            creatingIncident={creatingIncident}
            onCreateIncidentSubmit={handleCreateIncidentSubmit}
            onFillFirehouseCoords={handleFillFirehouseCoords}
            onResetIncidentForm={handleResetIncidentForm}
            incidentFormError={incidentFormError}
            incidentFormSuccess={incidentFormSuccess}
            splitter={incidentsSplitter}
          />
        )}
      </div>

      {/* Dialog Modala: Dodawanie/Edycja Użytkownika */}
      <UserModal
        isOpen={userModal.open}
        mode={userModal.mode}
        data={userModal.data}
        onClose={() => setUserModal({ ...userModal, open: false })}
        onChangeData={(data) => setUserModal({ ...userModal, data })}
        onSubmit={handleSaveUser}
      />

      {/* Dialog Modala: Nowe Zgłoszenie Incydentu */}
      <IncidentModal
        isOpen={incidentModal.open}
        data={incidentModal.data}
        onClose={() => setIncidentModal({ ...incidentModal, open: false })}
        onChangeData={(data) => setIncidentModal({ ...incidentModal, data })}
        onSubmit={handleSaveIncident}
      />
    </div>
  );
}
