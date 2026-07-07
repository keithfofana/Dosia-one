import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';

function describeError(err: unknown): string {
  if (isAxiosError(err)) {
    if (!err.response) {
      return `Impossible de joindre le serveur (${err.message}). Vérifie que le téléphone/émulateur est sur le même réseau que l'API et que le pare-feu autorise le port.`;
    }
    if (err.response.status === 422) {
      return 'Identifiants incorrects.';
    }
    return `Erreur serveur (${err.response.status}).`;
  }
  return 'Erreur inattendue.';
}

export function LoginPage() {
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();

  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        <h1>Dosia One</h1>
        {!challenge ? (
          <form onSubmit={handleLogin}>
            <label>
              Email ou téléphone
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
              Mot de passe
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>{loading ? '...' : 'Se connecter'}</button>
            <p style={{ marginTop: 16, textAlign: 'center' }}>
              <Link to="/register">Pas encore de compte ? Créer une entreprise</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <p>Ouvre ton application d'authentification (Google Authenticator, Authy...) et saisis le code à 6 chiffres affiché.</p>
            <label>
              Code à 6 chiffres
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
            <button type="submit" disabled={loading}>{loading ? '...' : 'Vérifier'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
