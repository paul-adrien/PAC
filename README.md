# PAC — Plateforme de suivi de candidatures

Projet personnel pour suivre, enrichir et préparer ses candidatures. Trois briques :

1. **App Next.js** — liste des offres, profil, génération IA (CV, lettre, entretien).
2. **Extension Chrome** — scrape les offres LinkedIn (liste + détail) et les envoie directement dans l'app.
3. **Supabase** — stockage (Postgres + RLS) et auth.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript strict**
- **Supabase** (`@supabase/ssr` + `supabase-js`) — Postgres, Auth, RLS
- **Zustand 5** pour l'auth côté client
- **React Hook Form 7** + **Zod 4** pour les formulaires et la validation
- **Tailwind CSS 4**
- **Luxon** pour les dates
- **@anthropic-ai/sdk** pour la génération IA (Claude), fallback **Ollama** local
- **pnpm 10**

## Structure

```
src/
  app/
    auth/{login,register}/
    portal/{jobs,jobs/new,jobs/[id]/generate,profile,settings}/
    api/
      jobs/{import,preview,create,detail,view,apply,dismiss,enrich}/
      generate/         # POST — CV / lettre / prep entretien
      generations/      # GET  — historique
      prompts/          # GET/PUT — prompts custom
      api-keys/         # clés Claude/Ollama chiffrées
      tokens/           # Bearer tokens pour l'extension
      profile/
      companies/dismiss/
    layout.tsx
  lib/
    domain/             # types métier (User, Job)
    store/auth/         # Zustand + service
    supabase/           # clients + migrations/
    jobs/               # schema, normalize, fingerprint, import
    generate/           # constants (prompts) + llm (Claude + Ollama)
    auth/api-token.ts   # resolveUserIdFromToken
    crypto.ts           # AES pour les clés API
    i18n/               # provider + messages (fr/en)
  components/
    portal/             # JobsList, JobsFilters, JobDetailPanel, JobsImportPanel
    ui/                 # primitives
  locales/{fr,en}.json
  middleware.ts         # garde /portal/*
job-scraper-extension/  # extension Chrome (Vite + TS)
```

## Modèle de données

Une seule table centrale : **`jobs`**. Les états d'une candidature (vue, postulée, masquée) sont des colonnes timestamp sur `jobs`, pas des tables à part.

| Table | Rôle |
|---|---|
| `users` | profils auth Supabase |
| `user_profiles` | profil texte libre (injecté dans les prompts IA) |
| `user_api_keys` | clés Claude / Ollama chiffrées (AES-256) |
| `api_tokens` | Bearer tokens pour authentifier l'extension |
| `jobs` | offres scrapées ou créées manuellement — `fingerprint` unique par user, `details` (jsonb) pour l'enrichissement, `viewed_at` / `applied_at` / `dismissed_at` |
| `prompts` | prompts custom par user et par type (`cv_header`, `cover_letter`, `interview_prep`) |
| `generations` | historique des sorties IA |
| `dismissed_companies` | blacklist de boîtes |

RLS activé sur toutes les tables. Les migrations sont dans [src/lib/supabase/migrations/](src/lib/supabase/migrations/) (numérotées `0001_*` à `0016_*`).

## Mise en route

```bash
pnpm install
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Variables d'environnement

À placer dans `.env.local` :

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ENCRYPTION_KEY=              # 32 caractères hex, pour chiffrer les clés API

# Optionnel — fallback local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### Base de données

Appliquer les migrations de [src/lib/supabase/migrations/](src/lib/supabase/migrations/) dans l'ordre (via le SQL Editor Supabase ou la CLI).

## Scripts

| | |
|---|---|
| `pnpm dev` | serveur de dev |
| `pnpm build` | build prod |
| `pnpm start` | serveur prod |
| `pnpm lint` | ESLint |
| `pnpm i18n:sync-defaults` | synchronise les clés i18n par défaut entre locales |

## Génération IA

- 3 types : `cv_header`, `cover_letter`, `interview_prep`
- Provider par défaut : Claude (`claude-sonnet-4-20250514`, 1024 tokens)
- Fallback : Ollama local
- Limite : 50 générations par user et par jour
- Les prompts sont templatés (`{{profile}}`, `{{jobTitle}}`, `{{jobCompany}}`, `{{jobDescription}}`, `{{jobSkills}}`) et éditables dans `/portal/settings`
- L'historique est persisté dans la table `generations` et consultable via `/api/generations`

La clé Claude est chiffrée (AES-256) côté serveur avant stockage dans `user_api_keys`.

## Extension Chrome

Dans [job-scraper-extension/](job-scraper-extension/) :

```bash
cd job-scraper-extension
pnpm install
pnpm build
```

Charger `job-scraper-extension/dist` dans `chrome://extensions` (mode développeur).

**Adapters actuels :** LinkedIn (feed + page détail) dans [job-scraper-extension/src/content/adapters/](job-scraper-extension/src/content/adapters/).

**Fonctions popup :**
- **Scan page** / **Auto-scroll + scan** — parcourt les résultats LinkedIn, déduplique par `sourceUrl`
- **Export JSON** — télécharge les offres scrapées
- **Envoyer vers PAC** — POST direct vers `/api/jobs/import` (même pipeline que l'import UI)
- **Enrichir cette offre** — sur une page détail, POST vers `/api/jobs/enrich` (remplit `jobs.details`)
- **J'ai candidaté** / **Pas intéressé** — togglent `applied_at` / `dismissed_at`

**Auth extension :** générer un token dans `/portal/settings`, le coller dans le champ *Token* du popup avec l'URL de l'API (ex. `http://localhost:3000`). Les endpoints `/api/jobs/import` et `/api/jobs/enrich` acceptent à la fois la session cookie et le Bearer token.

## Auth et middleware

[src/middleware.ts](src/middleware.ts) garde `/portal/*` : redirige vers `/auth/login` si non connecté, et renvoie les utilisateurs déjà loggés depuis `/auth/*` vers `/portal/jobs`.

## Internationalisation

FR (défaut) et EN. Les messages sont dans [src/locales/fr.json](src/locales/fr.json) et [src/locales/en.json](src/locales/en.json). Provider dans [src/lib/i18n/](src/lib/i18n/).
