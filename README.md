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
OLLAMA_MODEL=mistral-nemo   # recommandé : mistral-nemo (12B, ~7 GB, 16+ GB RAM) ou qwen2.5:7b-instruct (plus léger)
```

> Llama3 8B par défaut est trop faible pour suivre les consignes de format des prompts — préférer `mistral-nemo` ou `qwen2.5:7b-instruct`. Installer avec `ollama pull mistral-nemo`.

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

- 3 types : `cv_header` (paragraphe de présentation pour CV), `cover_letter` (lettre de motivation), `interview_prep`
- Providers : Claude API (`claude-sonnet-4-20250514`, 1024 tokens) ou Ollama local (`mistral-nemo` par défaut), sélectionnable dans l'UI de génération
- Limite : 50 générations par user et par jour
- Prompts templatés et éditables par user dans la page de génération (stockés dans la table `prompts`) :
  - Variables profil : `{{profile}}`, `{{profileSummary}}`
  - Variables offre brute : `{{jobTitle}}`, `{{jobCompany}}`, `{{jobLocation}}`, `{{jobDescription}}`, `{{jobSkills}}`
  - Variables offre extraite (pour `cv_header`) : `{{offerRole}}`, `{{offerMission}}`, `{{offerCompanyFocus}}`, `{{offerSeniority}}`, `{{offerTopSkills}}`
- Aperçu en direct du prompt final avec toutes les variables substituées, visible sous le textarea
- L'historique est persisté dans la table `generations` et consultable via `/api/generations`
- Erreurs API normalisées via [src/lib/errors/api-errors.ts](src/lib/errors/api-errors.ts) (messages user-friendly en français)

### Pipeline en 2 appels pour `cv_header`

Les petits modèles locaux (mistral-nemo, qwen2.5, llama3) se noient dans les offres LinkedIn verbeuses. Pour contourner, `cv_header` utilise un pipeline à 2 appels :

1. **Extraction** — [`OFFER_EXTRACTION_PROMPT`](src/lib/generate/constants.ts) demande au LLM d'analyser l'offre et de renvoyer un JSON avec `role`, `topSkills`, `mainMission`, `companyFocus`, `seniority`. Parsé avec tolérance aux backticks markdown ([`parseOfferExtract`](src/app/api/generate/route.ts)).
2. **Adaptation** — le prompt `cv_header` reçoit uniquement le résumé de profil + les points clés extraits (pas la description brute), et adapte le résumé à l'offre. Prompt beaucoup plus court donc le modèle garde le focus.

Les deux étapes utilisent le même provider. L'extraction est affichée dans l'UI sous le résultat pour debug.

### Convention `RÉSUMÉ_PROFIL` (recommandé)

Dans `/portal/profile`, ajoute une section intitulée `RÉSUMÉ_PROFIL` contenant un paragraphe exemple de ton résumé de profil (ton, vocabulaire, structure que tu utilises habituellement) :

```
RÉSUMÉ_PROFIL
Développeur full-stack TypeScript avec 3 ans d'expérience sur des produits en
production. Intervient de bout en bout sur la stack, avec une attention
particulière à l'expérience utilisateur côté front, ainsi qu'à la fiabilité, la
clarté et la maintenabilité côté back. Maîtrise React, Node.js, TypeScript et
les API. Apprécie les environnements où il est possible d'être force de
proposition sur toute la stack...
```

Le serveur extrait cette section via [`extractProfileSummary`](src/lib/generate/profile.ts) (parse ligne par ligne jusqu'à la prochaine section en MAJUSCULES) et l'injecte comme `{{profileSummary}}`. Le prompt `cv_header` utilise ce texte comme **modèle de référence** : il reprend la personne grammaticale, la longueur (±15 %) et le vocabulaire pour l'adapter à l'offre visée. Si la section est absente, le profil complet est passé en fallback.

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
