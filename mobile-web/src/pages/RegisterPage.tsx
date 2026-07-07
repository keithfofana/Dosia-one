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
      const errors = err.response.data?.errors as Record<string, string[]> | undefined;
      const firstMessage = errors ? Object.values(errors)[0]?.[0] : undefined;
      return firstMessage ?? "Impossible de créer le compte, vérifie les informations saisies.";
    }
    return `Erreur serveur (${err.response.status}).`;
  }
  return 'Erreur inattendue.';
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('FCFA');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email && !phone) {
      setError('Renseigne un email ou un numéro de téléphone.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await register({
        company_name: companyName,
        currency_symbol: currencySymbol || undefined,
        name,
        email: email || undefined,
        phone: phone || undefined,
        password,
        password_confirmation: passwordConfirmation,
      });
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
        <h1>Créer une entreprise</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Nom de l'entreprise
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </label>
          <label>
            Devise
            <input value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} />
          </label>
          <label>
            Nom du gérant
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
            />
          </label>
          <label>
            Téléphone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </label>
          <label>
            Mot de passe
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </label>
          <label>
            Confirmer le mot de passe
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              minLength={8}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? '...' : 'Créer mon compte'}</button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/login">Déjà un compte ? Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
