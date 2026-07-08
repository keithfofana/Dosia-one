import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { updateLocale } from '../api/profile';
import { SUPPORTED_LOCALES, LANGUAGE_NAMES, type SupportedLocale } from '../i18n';

interface LanguageSwitcherProps {
  className?: string;
  onSaved?: () => void;
}

export function LanguageSwitcher({ className, onSaved }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleChange = async (locale: SupportedLocale) => {
    setSaving(true);
    try {
      await updateLocale(locale);
      // updateUser() is the single source of truth for syncing i18n's active
      // language (see AuthContext's syncLocale) — calling i18n.changeLanguage
      // here too races with it and can leave the wrong language/dir applied.
      updateUser({ locale });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      className={className}
      value={user?.locale ?? 'fr'}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as SupportedLocale)}
      aria-label={t('language.label')}
    >
      {SUPPORTED_LOCALES.map((locale) => (
        <option key={locale} value={locale}>{LANGUAGE_NAMES[locale]}</option>
      ))}
    </select>
  );
}
