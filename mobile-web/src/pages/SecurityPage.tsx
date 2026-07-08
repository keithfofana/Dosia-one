import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { confirmTwoFactor, disableTwoFactor, enableTwoFactor } from '../api/twoFactor';
import { listSessions, revokeSession } from '../api/sessions';
import { updateLocale } from '../api/profile';
import { SUPPORTED_LOCALES, type SupportedLocale } from '../i18n';
import type { SessionInfo, TwoFactorSetup } from '../types/models';

const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
  sw: 'Kiswahili',
};

function describeError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const errors = err.response?.data?.errors as Record<string, string[]> | undefined;
    const firstMessage = errors ? Object.values(errors)[0]?.[0] : undefined;
    return firstMessage ?? err.response?.data?.message ?? fallback;
  }
  return fallback;
}

export function SecurityPage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();

  const [localeSaving, setLocaleSaving] = useState(false);
  const [localeSaved, setLocaleSaved] = useState(false);

  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSaving, setConfirmSaving] = useState(false);

  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableError, setDisableError] = useState<string | null>(null);
  const [disableSaving, setDisableSaving] = useState(false);

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const loadSessions = () => {
    setSessionsLoading(true);
    listSessions().then(setSessions).finally(() => setSessionsLoading(false));
  };

  useEffect(loadSessions, []);

  const handleStartEnable = async () => {
    setConfirmError(null);
    const result = await enableTwoFactor();
    setSetup(result);
  };

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setConfirmError(null);
    setConfirmSaving(true);
    try {
      await confirmTwoFactor(confirmCode);
      updateUser({ two_factor_enabled: true });
      setSetup(null);
      setConfirmCode('');
    } catch (err) {
      setConfirmError(describeError(err, 'Code invalide.'));
    } finally {
      setConfirmSaving(false);
    }
  };

  const handleDisable = async (e: FormEvent) => {
    e.preventDefault();
    setDisableError(null);
    setDisableSaving(true);
    try {
      await disableTwoFactor(disablePassword);
      updateUser({ two_factor_enabled: false });
      setShowDisableForm(false);
      setDisablePassword('');
    } catch (err) {
      setDisableError(describeError(err, 'Mot de passe incorrect.'));
    } finally {
      setDisableSaving(false);
    }
  };

  const handleRevoke = async (session: SessionInfo) => {
    await revokeSession(session.id);
    loadSessions();
  };

  const handleLocaleChange = async (locale: SupportedLocale) => {
    setLocaleSaving(true);
    setLocaleSaved(false);
    try {
      await updateLocale(locale);
      // updateUser() is the single source of truth for syncing i18n's active
      // language (see AuthContext's syncLocale) — calling i18n.changeLanguage
      // here too raced with it and intermittently left the wrong language/dir
      // applied (observed switching ar -> fr: dir stayed rtl).
      updateUser({ locale });
      setLocaleSaved(true);
    } finally {
      setLocaleSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Sécurité</h1>
      </div>

      <h2>{t('language.title')}</h2>
      <div style={{ maxWidth: 360 }}>
        <label>
          {t('language.label')}
          <select
            value={user?.locale ?? 'fr'}
            disabled={localeSaving}
            onChange={(e) => handleLocaleChange(e.target.value as SupportedLocale)}
          >
            {SUPPORTED_LOCALES.map((locale) => (
              <option key={locale} value={locale}>{LANGUAGE_NAMES[locale]}</option>
            ))}
          </select>
        </label>
        {localeSaved && <p style={{ color: 'var(--success)' }}>{t('language.saved')}</p>}
      </div>

      <h2>Authentification à deux facteurs (2FA)</h2>
      {user?.two_factor_enabled ? (
        <div>
          <p>Le 2FA est <strong style={{ color: 'var(--success)' }}>activé</strong> sur ton compte.</p>
          {!showDisableForm ? (
            <button className="secondary" onClick={() => setShowDisableForm(true)}>Désactiver le 2FA</button>
          ) : (
            <form onSubmit={handleDisable} style={{ maxWidth: 360 }}>
              <label>
                Mot de passe (pour confirmer la désactivation)
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  required
                />
              </label>
              {disableError && <p className="error">{disableError}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={disableSaving}>{disableSaving ? '...' : 'Confirmer la désactivation'}</button>
                <button type="button" className="secondary" onClick={() => setShowDisableForm(false)}>Annuler</button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div>
          <p>Le 2FA est <strong>désactivé</strong>. Active-le pour sécuriser ton compte avec une application d'authentification (Google Authenticator, Authy...).</p>
          {!setup ? (
            <button onClick={handleStartEnable}>Activer le 2FA</button>
          ) : (
            <div style={{ maxWidth: 360 }}>
              <p>1. Scanne ce QR code avec ton application d'authentification :</p>
              <img src={setup.qr_code} alt="QR code 2FA" style={{ background: 'white', padding: 8, borderRadius: 8 }} />
              <p>Ou saisis manuellement cette clé : <code>{setup.secret}</code></p>
              <p>2. Saisis le code à 6 chiffres affiché par l'application pour confirmer :</p>
              <form onSubmit={handleConfirm}>
                <label>
                  Code à 6 chiffres
                  <input
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    required
                  />
                </label>
                {confirmError && <p className="error">{confirmError}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={confirmSaving}>{confirmSaving ? '...' : 'Confirmer et activer'}</button>
                  <button type="button" className="secondary" onClick={() => setSetup(null)}>Annuler</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      <h2>Sessions actives</h2>
      {sessionsLoading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Appareil</th>
              <th>Dernière activité</th>
              <th>Connexion</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.name} {s.is_current && <span className="badge">Session actuelle</span>}</td>
                <td>{s.last_used_at ? new Date(s.last_used_at).toLocaleString() : '—'}</td>
                <td>{new Date(s.created_at).toLocaleString()}</td>
                <td>
                  {!s.is_current && (
                    <button className="secondary" onClick={() => handleRevoke(s)}>Révoquer</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
