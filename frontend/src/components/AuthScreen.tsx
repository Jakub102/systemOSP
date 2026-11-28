import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Mail,
  KeyRound,
  Lock,
  User,
  ShieldCheck,
  Phone,
  Save,
} from 'lucide-react';
import type { Invitation, RegisterPayload } from '../api';

export interface AuthScreenProps {
  authView: 'login' | 'register';
  setAuthView: (view: 'login' | 'register') => void;
  loginForm: { email: string; password: string };
  setLoginForm: React.Dispatch<React.SetStateAction<{ email: string; password: string }>>;
  loginError: string;
  setLoginError: (err: string) => void;
  authLoading: boolean;
  regSuccess: string;
  regForm: RegisterPayload;
  setRegForm: React.Dispatch<React.SetStateAction<RegisterPayload>>;
  registerToken: string;
  invitation: Invitation | null;
  invitationError: string;
  onLoginSubmit: (e: React.FormEvent) => void;
  onRegisterSubmit: (e: React.FormEvent) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  authView,
  setAuthView,
  loginForm,
  setLoginForm,
  loginError,
  setLoginError,
  authLoading,
  regSuccess,
  regForm,
  setRegForm,
  registerToken,
  invitation,
  invitationError,
  onLoginSubmit,
  onRegisterSubmit,
}) => {
  return (
    <div className="win-screen">
      <div className="win-grid-bg" />

      <div className="win-frame">
        <div className="win-titlebar">
          <div className="win-title">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>FireOS WinBox - SWD PSP [Logowanie do Węzła]</span>
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
            <form onSubmit={onLoginSubmit} className="auth-form">
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
            <form onSubmit={onRegisterSubmit} className="auth-form auth-form-tight">
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
};
