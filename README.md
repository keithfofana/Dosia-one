# Dosia One — Base du projet

Stack : **Laravel 13 (PHP) + PostgreSQL + AWS**, frontend mobile/web en React (Capacitor).

## Contenu de cette base

```
dosia-one/
├── backend/
│   ├── composer.json              # dépendances (Sanctum, permissions, PDF, Excel, AWS SDK)
│   ├── .env.example                # config PostgreSQL + AWS + WhatsApp + IA
│   ├── database/migrations/        # 44 migrations couvrant les 15 modules
│   └── routes/api.php              # squelette de toutes les routes API par module
└── mobile-web/                     # dossier réservé au frontend React (prototype existant à y importer)
```

## Ce qui est posé
- **Schéma de base de données complet** (44 tables) : entreprises multi-tenant, utilisateurs/rôles/permissions, CRM, produits/stock/fournisseurs, ventes (devis/factures/BL/paiements/retours), achats, comptabilité (plan comptable/journal/TVA), trésorerie (banque/caisse), RH (employés/salaires/présence/congés/contrats/évaluations), production, documents, notifications intelligentes.
- **Routes API** organisées par module, prêtes à être reliées à des contrôleurs.
- **Config d'environnement** pour PostgreSQL, AWS (S3, SES, SNS), WhatsApp Business API, et l'assistant IA (Anthropic).

## Étapes à suivre dans Claude Code

1. **Installer Laravel réellement** (composer.json fourni comme référence — recrée le projet avec `laravel new` puis fusionne, ou installe les dépendances directement) :
   ```bash
   composer create-project laravel/laravel backend-tmp
   # puis copier database/migrations, routes/api.php, composer.json dans le vrai projet
   composer install
   ```

2. **Configurer PostgreSQL** : copier `.env.example` en `.env`, renseigner les identifiants, générer la clé :
   ```bash
   cp .env.example .env
   php artisan key:generate
   php artisan migrate
   ```

3. **Générer les modèles Eloquent** pour chaque table (relations à définir : belongsTo, hasMany selon le schéma).

4. **Implémenter les contrôleurs** module par module — commencer par Ventes/Stock/CRM qui reprennent la logique déjà validée dans le prototype React.

5. **Importer le frontend React existant** dans `mobile-web/`, remplacer `window.storage` par des appels à l'API Laravel (Sanctum pour l'auth).

6. **Capacitor** : une fois le frontend connecté au backend réel, packager en APK.

## Ordre de développement recommandé
Reprend la feuille de route du cahier des charges (phases 1 à 6) : Ventes/Stock/CRM → Achats/Trésorerie détaillée → Comptabilité légale → RH/Production → Infra native → IA/Sécurité avancée.

## Stockage de fichiers (module Documents)

Le code (`DocumentController`) n'appelle jamais le SDK AWS directement — il passe
systématiquement par l'abstraction `Storage` de Laravel (`Storage::disk()`,
`UploadedFile::store()`, `Storage::download()`, `Storage::delete()`). Le disque
utilisé est déterminé uniquement par la variable d'environnement
`FILESYSTEM_DISK` (voir `config/filesystems.php`).

- **Développement (actuel)** : `FILESYSTEM_DISK=local`. Les fichiers sont
  stockés dans `backend/storage/app/private/documents/`, un dossier privé non
  accessible directement par une URL — le téléchargement passe par la route
  authentifiée `GET /api/documents/{id}/download`. Aucune clé AWS n'est requise
  dans ce mode.
- **Production sur S3** : renseigner `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  `AWS_DEFAULT_REGION` et `AWS_BUCKET` dans `.env`, puis passer
  `FILESYSTEM_DISK=s3`. **Aucune modification de code n'est nécessaire** : le
  contrôleur continuera à fonctionner à l'identique, Laravel redirigeant tous
  les appels `Storage::` vers le bucket S3 configuré.

## Préparation infra de production (sans déploiement réel)

Cette section documente ce qui a été mis en place pour que le projet soit
« prêt à brancher » sur un vrai domaine/serveur plus tard, **sans avoir à
réécrire de code**. Rien n'a été déployé ni acheté (pas de domaine, pas de
certificat, pas d'hébergement) — voir la checklist finale de cette section
pour ce qui reste à faire le jour du vrai déploiement.

### 1. APK release signé

Les builds `debug` (utilisés jusqu'ici pour les tests sur téléphone/BlueStacks)
et `release` sont maintenant bien distincts :

- Le build **debug** garde `android:usesCleartextTraffic="true"` (fusionné
  uniquement depuis `android/app/src/debug/AndroidManifest.xml`), pour
  continuer à tester en HTTP contre l'IP du PC de dev.
- Le build **release** n'a plus cet attribut du tout → Android bloque alors
  tout trafic HTTP en clair par défaut (à partir d'Android 9 / API 28). Un
  APK release ne pourra donc parler qu'à une API en **HTTPS**.
- Un build `release` non signé ne s'installe sur aucun appareil Android. Le
  fichier `android/app/build.gradle` lit désormais un fichier
  `android/keystore.properties` (jamais committé, voir `.gitignore`) pour
  signer automatiquement le build release.

**Générer ta propre clé de signature** (à faire une seule fois, avec un mot de
passe que tu choisis et gardes précieusement — sans lui, impossible de
publier une mise à jour signée avec la même identité) :

```bash
cd mobile-web/android
keytool -genkeypair -v \
  -keystore dosia-one-release.keystore \
  -alias dosia-one \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Dosia One, OU=Prod, O=Dosia, L=Abidjan, ST=Abidjan, C=CI"
# keytool demande interactivement le mot de passe du keystore et de la clé.
```

Puis créer `mobile-web/android/keystore.properties` (copier
`keystore.properties.example` et renseigner les vraies valeurs) :

```properties
storeFile=dosia-one-release.keystore
storePassword=<ton mot de passe keystore>
keyAlias=dosia-one
keyPassword=<ton mot de passe de clé>
```

**Générer l'APK release signé** :

```bash
cd mobile-web
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
# APK signé : android/app/build/outputs/apk/release/app-release.apk
```

Sans `keystore.properties`, `assembleRelease` produit un APK non signé
(inutilisable) — c'est voulu, pour ne jamais publier un build non signé par
erreur.

### 2. Configuration HTTPS-ready

- **Frontend** : l'URL de l'API n'est jamais en dur dans le code — elle vient
  uniquement de `VITE_API_URL` (`mobile-web/.env`, lu dans
  `src/api/client.ts`). Basculer vers la production revient à changer cette
  seule variable (`https://mondomaine.com/api`) puis à relancer
  `npm run build && npx cap sync android`.
- **Backend** : `AppServiceProvider::boot()` force le schéma des URLs
  générées par Laravel en `https` dès que `APP_ENV=production`. Le middleware
  global `App\Http\Middleware\ForceHttps` redirige toute requête HTTP vers sa
  version HTTPS (redirection 308, qui préserve la méthode HTTP — important
  pour les `POST`/`PUT` de l'API), **uniquement si `APP_ENV=production`** :
  aucun effet en local/dev, pas besoin de HTTPS sur le réseau Wi-Fi local.

### 3. Configuration d'environnement production

`backend/.env.production.example` est le pendant production de `.env.example` :
`APP_ENV=production`, `APP_DEBUG=false`, `LOG_LEVEL=error`,
`SESSION_SECURE_COOKIE=true` (cookies envoyés uniquement en HTTPS).

**Checklist à lancer avant tout vrai déploiement** (une fois `.env` configuré
à partir de `.env.production.example`, avec un vrai domaine/DB/clés) :

```bash
cp .env.production.example .env
php artisan key:generate            # APP_KEY unique, propre à cet environnement
php artisan migrate --force         # --force requis car APP_ENV=production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link            # si des fichiers publics sont servis depuis storage/
```

Si le code est modifié après coup, ne pas oublier `php artisan config:clear`
etc. avant de re-cacher, sinon les anciennes valeurs restent actives.

### 4. Sécurité serveur de base

- **Rate limiting** : `/auth/login`, `/auth/register` et `/auth/2fa/verify`
  (routes publiques, donc les plus exposées au bruteforce) sont limitées à
  `throttle:6,1` (6 tentatives/minute/IP) dans `routes/api.php`.
- **APP_KEY** : généré par `php artisan key:generate`, unique par
  environnement. `.env` et `.env.production` sont dans `.gitignore` — seuls
  les fichiers `.example` (sans clé réelle) sont versionnés.
  ⚠️ **Ce projet n'est pour l'instant pas un dépôt Git** (`git init` n'a pas
  encore été fait) : à faire avant tout partage/sauvegarde du code, pour que
  cette protection soit effective.
- **Mots de passe / secrets** : voir la section « Sécurité avancée » déjà en
  place — bcrypt sur les mots de passe et le PIN, secret TOTP et données
  sensibles (téléphones clients/fournisseurs, IBAN) chiffrés au repos.

### Ce qu'il restera à faire le jour du vrai déploiement

Rien de ce qui suit n'a été fait ici (volontairement — c'est uniquement de la
préparation) :

- Acheter un **nom de domaine**.
- Prendre un **hébergement** (VPS, PaaS, etc.) capable de faire tourner
  PHP 8.3 + PostgreSQL, ou une base managée séparée.
- Obtenir un **certificat SSL** — [Let's Encrypt](https://letsencrypt.org/)
  est gratuit et se renouvelle automatiquement (`certbot`).
- Pointer le domaine vers le serveur (DNS), configurer le vhost/nginx pour
  écouter en HTTPS et rediriger le HTTP restant (défense en profondeur, en
  plus du `ForceHttps` déjà en place côté Laravel).
- Renseigner les vraies clés AWS dans `.env` si `FILESYSTEM_DISK=s3` est
  souhaité (sinon `local` fonctionne tel quel).
- Générer la vraie clé de signature Android (voir section 1) et la conserver
  en lieu sûr (perdre le keystore = ne plus jamais pouvoir republier
  l'app sous la même identité).
- `git init` + premier commit (voir avertissement ci-dessus).
