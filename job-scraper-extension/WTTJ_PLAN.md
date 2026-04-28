# Plan d'action — scraping Welcome to the Jungle

> En pause : WTTJ a fait une maj du site, les offres ne sont pas visibles côté user. Reprendre quand le site sera stable.

## État actuel de l'extension

La plomberie multi-source est déjà en place :

- `Source = 'linkedin' | 'wttj' | 'indeed' | 'unknown'` dans [src/shared/types.ts](src/shared/types.ts)
- `detectSourceFromUrl` reconnaît déjà `www.welcometothejungle.com` dans [src/content/adapters/detect.ts](src/content/adapters/detect.ts)
- `host_permissions` et `content_scripts` du [public/manifest.json](public/manifest.json) couvrent déjà `welcometothejungle.com`
- Le pattern adapter (`SiteAdapter`) est propre : il suffit d'ajouter un nouveau fichier et de le pousser dans le tableau de [src/content/adapters/index.ts](src/content/adapters/index.ts)
- Backend PAC : `JobInputSchema` accepte n'importe quelle valeur `source: string` (cf. `src/lib/jobs/schema.ts` côté projet PAC) → **aucune modif backend nécessaire**

Ce qui manque :

- Le content-script ([src/content/content-script.ts](src/content/content-script.ts)) importe directement des fonctions LinkedIn (`getLinkedInScrollContainerFromCard`, `getLinkedInListSignature`, `clickLinkedInNextPage`, `countLinkedInCards`). Il faut **abstraire ces fonctions dans le `SiteAdapter`** pour que chaque site ait sa propre logique de scroll/pagination.
- Le popup ([src/popup/popup.ts](src/popup/popup.ts)) hardcode LinkedIn dans `getCanonicalJobUrl`, `onApplyClick`, `onDismissClick`, `onEnrichClick` (regex `/jobs/view/\d+/`). À étendre.

## Plan d'action

### 1. Refactor du `SiteAdapter`

Élargir le type dans [src/content/adapters/types.ts](src/content/adapters/types.ts) pour porter la logique site-spécifique :

```ts
type SiteAdapter = {
  source: Source;
  matches: (ctx: ScanContext) => boolean;
  scanVisibleCards: (ctx: ScanContext) => JobOffer[];

  // nouveau — pour l'auto-scroll/pagination
  getScrollContainer: () => HTMLElement | null;
  getListSignature: () => string;
  countCards: () => number;
  clickNextPage: () => boolean;

  // nouveau — pour la page détail
  matchesDetail?: (url: string) => boolean;
  scrapeDetail?: () => JobDetailData;
  canonicalDetailUrl?: (url: string) => string | null;
};
```

Bouger toutes les fonctions LinkedIn dans `linkedin.ts` (en méthodes de l'adapter) et virer les imports directs depuis le content-script. Le content-script appelle alors `adapter.getScrollContainer()` etc., générique.

### 2. Créer `src/content/adapters/wttj.ts`

Adapter pour la page listing (`/fr/jobs?...`, `/fr/companies/.../jobs`). Implémente : `matches`, `scanVisibleCards`, `getScrollContainer`, `getListSignature`, `countCards`, `clickNextPage`.

### 3. Créer `src/content/adapters/wttj-detail.ts`

Scraper pour la page détail. Implémente `scrapeDetail()` qui retourne un `JobDetailData` (description, employmentType, salary, etc.).

### 4. Brancher les deux dans `adapters/index.ts`

```ts
export const adapters: SiteAdapter[] = [linkedinAdapter, wttjAdapter];
```

### 5. Mettre à jour le popup

Dans [src/popup/popup.ts](src/popup/popup.ts), remplacer la regex hardcodée LinkedIn par un appel générique à `adapter.canonicalDetailUrl(url)` (potentiellement via un nouveau message `GET_CANONICAL_URL` envoyé au content-script, ou en dupliquant la logique de détection côté popup).

### 6. Tester sur une vraie page WTTJ

## Infos à récupérer quand on reprend

WTTJ est un SPA Next.js avec des classnames hashées qui changent souvent. **L'URL ne suffit pas**, il faut le HTML brut tel qu'il est aujourd'hui.

Méthode rapide : sur Chrome, DevTools → clic droit sur l'élément → **Copy → Copy outerHTML**, coller dans la conversation.

À fournir :

1. **Page listing** (ex: `https://www.welcometothejungle.com/fr/jobs?query=...`)
   - outerHTML d'**une carte d'offre** (un `<li>` ou `<article>`, pas toute la page)
   - HTML du **bouton "page suivante"** de la pagination
   - Mécanisme de pagination : bouton "next" classique ou infinite scroll ?

2. **Page détail** (ex: `https://www.welcometothejungle.com/fr/companies/xxx/jobs/yyy`)
   - outerHTML de la zone qui contient titre / entreprise / lieu / type de contrat / salaire / description (un `<main>` ou équivalent)

3. **URL canonique à stocker**
   - Confirmer : on garde `/fr/companies/{company-slug}/jobs/{job-slug}` comme `sourceUrl` ?
   - Vérifier qu'il n'y a pas d'id numérique plus stable qui survivrait à un changement de slug

4. **Décisions produit**
   - Les boutons "Enrichir / J'ai candidaté / Pas intéressé" du popup doivent fonctionner sur les pages détail WTTJ aussi ? (par défaut : oui)
   - Scraping uniquement sur `/fr/...` ou aussi `/en/...` / autres locales ?

## Notes / pièges potentiels

- WTTJ est un SPA → le content-script avec `run_at: document_idle` peut tourner avant que le contenu soit monté. Vérifier qu'on attend bien le rendu (mutation observer ou retry).
- Les classnames CSS modules (`_jobCard_xxxxx`) changent à chaque build → **viser les sélecteurs sémantiques** : `data-testid`, `data-role`, attributs `aria-*`, structure HTML stable, plutôt que les classes.
- L'URL canonique : nettoyer les query params de tracking (`utm_*`, `o=`, etc.) — `normalizeUrl` côté backend le fait déjà, mais autant produire une URL propre dès le scraping.
- Vérifier le comportement quand on est sur une page d'entreprise (`/fr/companies/{slug}`) qui liste les jobs vs. une page de recherche globale (`/fr/jobs?query=...`) — les sélecteurs peuvent différer.
