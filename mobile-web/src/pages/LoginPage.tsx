import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_LOCALES, LANGUAGE_NAMES, markManualLocaleSelection, type SupportedLocale } from '../i18n';

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();

  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function describeError(err: unknown): string {
    if (isAxiosError(err)) {
      if (!err.response) {
        return t('login.serverUnreachable', { message: err.message });
      }
      if (err.response.status === 422) {
        return t('login.invalidCredentials');
      }
      return t('login.serverError', { status: err.response.status });
    }
    return t('login.unexpectedError');
  }

  const handleLanguageChange = (locale: SupportedLocale) => {
    markManualLocaleSelection();
    i18n.changeLanguage(locale);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(loginValue, password);
      if (result.requiresTwoFactor && result.challenge) {
        setChallenge(result.challenge);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyTwoFactor(challenge!, code);
      navigate('/');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-lang-row">
          <select
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLocale)}
            aria-label={t('language.label')}
          >
            {SUPPORTED_LOCALES.map((locale) => (
              <option key={locale} value={locale}>{LANGUAGE_NAMES[locale]}</option>
            ))}
          </select>
        </div>
        <h1>Dosia One</h1>
        {!challenge ? (
          <form onSubmit={handleLogin}>
            <label>
              {t('login.loginOrPhone')}
              <input
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                required
              />
            </label>
            <label>
              {t('common.password')}
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>{loading ? '...' : t('login.submit')}</button>
            <p style={{ marginTop: 16, textAlign: 'center' }}>
              <Link to="/register">{t('login.noAccount')}</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <p>{t('login.twoFactorPrompt')}</p>
            <label>
              {t('security.sixDigitCode')}
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>{loading ? '...' : t('login.verify')}</button>
          </form>
        )}
      </div>
    </div>
  );
}
