import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { confirmTwoFactor, disableTwoFactor, enableTwoFactor } from '../api/twoFactor';
import { listSessions, revokeSession } from '../api/sessions';
import { updateLocale } from '../api/profile';
import { SUPPORTED_LOCALES, type SupportedLocale } from '../i18n';
import { extractErrorMessage } from '../utils/errors';
import type { SessionInfo, TwoFactorSetup } from '../types/models';

const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
  sw: 'Kiswahili',
};

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
      setConfirmError(extractErrorMessage(err, t('security.invalidCode')));
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
      setDisableError(extractErrorMessage(err, t('security.incorrectPassword')));
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
        <h1>{t('security.title')}</h1>
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

      <h2>{t('security.twoFactorTitle')}</h2>
      {user?.two_factor_enabled ? (
        <div>
          <p>{t('security.enabledPrefix')} <strong style={{ color: 'var(--success)' }}>{t('security.enabledWord')}</strong> {t('security.enabledSuffix')}</p>
          {!showDisableForm ? (
            <button className="secondary" onClick={() => setShowDisableForm(true)}>{t('security.disable2fa')}</button>
          ) : (
            <form onSubmit={handleDisable} style={{ maxWidth: 360 }}>
              <label>
                {t('security.passwordConfirmDisable')}
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  required
                />
              </label>
              {disableError && <p className="error">{disableError}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={disableSaving}>{disableSaving ? '...' : t('security.confirmDisableSubmit')}</button>
                <button type="button" className="secondary" onClick={() => setShowDisableForm(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div>
          <p>{t('security.disabledPrefix')} <strong>{t('security.disabledWord')}</strong>. {t('security.disabledSuffix')}</p>
          {!setup ? (
            <button onClick={handleStartEnable}>{t('security.enable2fa')}</button>
          ) : (
            <div style={{ maxWidth: 360 }}>
              <p>{t('security.scanQr')}</p>
              <img src={setup.qr_code} alt={t('security.qrAlt')} style={{ background: 'white', padding: 8, borderRadius: 8 }} />
              <p>{t('security.orEnterKey')} <code>{setup.secret}</code></p>
              <p>{t('security.enterCodeToConfirm')}</p>
              <form onSubmit={handleConfirm}>
                <label>
                  {t('security.sixDigitCode')}
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
                  <button type="submit" disabled={confirmSaving}>{confirmSaving ? '...' : t('security.confirmAndEnable')}</button>
                  <button type="button" className="secondary" onClick={() => setSetup(null)}>{t('common.cancel')}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      <h2>{t('security.activeSessions')}</h2>
      {sessionsLoading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('security.device')}</th>
              <th>{t('security.lastActivity')}</th>
              <th>{t('security.loginDate')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.name} {s.is_current && <span className="badge">{t('security.currentSession')}</span>}</td>
                <td>{s.last_used_at ? new Date(s.last_used_at).toLocaleString() : '—'}</td>
                <td>{new Date(s.created_at).toLocaleString()}</td>
                <td>
                  {!s.is_current && (
                    <button className="secondary" onClick={() => handleRevoke(s)}>{t('security.revoke')}</button>
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
