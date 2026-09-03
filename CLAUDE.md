# EduCore Web — Contexte projet

Frontend Next.js de **EduCore**, ERP de gestion d'établissement secondaire.
L'API Laravel (`../api`) est **déjà complète** (FEATURES.md API §0–§24).
Ce document décrit *comment* brancher le frontend sur cette API, et *quoi*
construire côté UI lorsqu'un écran, menu, bouton ou formulaire manque.

---

## 1. Rôle et mission

- Afficher et manipuler les données **exclusivement** via `GET/POST/PUT/PATCH/DELETE`
  `/api/v1/...` (Bearer Sanctum).
- **Aucune** logique métier, calcul de note, workflow d'inscription, etc. côté web —
  l'API décide ; le web orchestre l'UI.
- Respecter le design system existant (tokens Tailwind,
  composants `presentation/`).

---

## 2. Stack

| Élément | Détail |
|---------|--------|
| Next.js | 15 App Router (`src/app`) |
| React | 19 |
| TypeScript | strict |
| Styling | Tailwind + tokens EduCore |
| Auth | Token Sanctum (Bearer) — pas de cookies SPA |
| API | `../api` — base URL via `NEXT_PUBLIC_API_URL` |

Compte démo admin : `admin@educore.ci` / `password` (voir seeder API).

---

## 3. Architecture cible (à construire pendant l'intégration)

```text
src/
├── app/                              # Routes (déjà présentes pour ~44 écrans)
│   ├── (auth)/login/                 # À CRÉER — page login absente
│   ├── (admin)/...
│   └── (portal)/...
├── presentation/
│   ├── components/
│   │   ├── layout/                   # Sidebar, Header, PortalLayout
│   │   ├── modules/                  # Contenu par écran (*Content.tsx)
│   │   ├── forms/                    # CrudForm, CrudLinks, FormField
│   │   └── shared/
│   └── hooks/                        # useAuth, useApiQuery, etc. (à créer)
├── infrastructure/                   # À CRÉER
│   ├── api/
│   │   ├── client.ts                 # fetch wrapper + enveloppe { success, data, message }
│   │   ├── auth.ts                   # login / logout / me / refresh
│   │   └── resources/                # un fichier par domaine API (students.ts, ...)
│   └── auth/
│       ├── token-storage.ts          # localStorage / cookie httpOnly selon choix
│       └── AuthProvider.tsx
└── shared/
    ├── config/
    │   ├── navigation.ts             # Menus admin + portails
    │   ├── routes.ts                 # PAGE_ROUTES (source de vérité écrans)
    │   └── crud-forms.ts             # Schémas formulaires CRUD
    └── types/
```

**Règle** : ne pas inventer une architecture parallèle. Étendre ces dossiers ;
réutiliser `CrudForm` / `CrudCreateLink` / `CrudEditLink` quand c'est un CRUD
simple ; pour les écrans métier complexes (pipeline recrutement, saisie notes,
tableau de bord), brancher l'API dans le `*Content.tsx` existant.

---

## 4. Correspondance écran ↔ API

Source de vérité écrans : `src/shared/config/routes.ts` + `navigation.ts`.
Source de vérité API : `../api/FEATURES.md` + `php artisan route:list --path=api/v1`.

| Section nav | Écran(s) | Endpoints principaux |
|-------------|----------|----------------------|
| Auth | Login (à créer) | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Administration | Dashboard | `GET /dashboard/admin` |
| | Élèves | `/students`, `/students/{id}/full` |
| | Parents | `/guardians`, `/guardians/{id}/students` |
| | Enseignants | `/teachers`, `/teachers/{id}/assignments` |
| | Classes / Matières / EDT | `/class-groups`, `/subjects`, `/timetable-slots` |
| Scolarité | Présences | `/attendance`, `.../justify`, `.../validate` |
| | Évaluations / Notes | `/assessments`, `/grades`, `.../validate` |
| | Bulletins | `/report-cards` (+ PDF media) |
| | Discipline | `/discipline-records` |
| | Inscriptions | `/enrollments` (workflow statuts) |
| | Bibliothèque | `/library-books`, `/library-copies`, `/library-loans` |
| Finances | Overview / Paiements / Factures / Dépenses | `/dashboard` finance agrégats, `/payments`, `/invoices`, `/expenses` |
| RH | Recrutement / Paie / Congés / Évaluations | `/hr-job-postings`, `/hr-applications`, `/staff-payrolls`, `/staff-leaves`, `/staff-attendance`, `/staff-evaluations` |
| Cantine | Menus / Comptes / Régimes | `/canteen-menus`, `/canteen-accounts`, `.../topups`, `/canteen-special-diets` |
| Transport | Flotte / Chauffeurs / Itinéraires / Abonnements | `/transport-vehicles`, `/transport-drivers`, `/transport-routes`, `/transport-subscriptions` |
| Inventaire | Stocks / Patrimoine | `/inventory-supplies`, `/inventory-assets` |
| Outils | Communication / Documents / Rapports / Audit / Settings | `/announcements`, `/conversations`, `/documents`, `/reports/{type}`, `/audit-logs`, `/institution`, `/settings` |
| Portail | Student / Parent dashboards | `GET /dashboard/student`, `GET /dashboard/parent` |
| | Notes / Frais / Devoirs / Notifs | grades filtrés, invoices/payments, assignments, `/notifications` |

Enveloppe API obligatoire :

```json
{ "success": true, "message": "...", "data": {}, "meta": {} }
```

Le client HTTP doit lever / mapper les erreurs `success: false` + `errors` (422)
vers l'UI formulaire.

---

## 5. Règle critique — UI manquante = à créer

Pendant l'intégration d'un module, **si un élément UI nécessaire n'existe pas,
le créer immédiatement** (ne pas bloquer ni « laisser pour plus tard ») :

| Manque | Action |
|--------|--------|
| **Page / route** | Ajouter `src/app/(admin|portal|auth)/.../page.tsx` + entrée dans `routes.ts` + composant `*Content.tsx` sous `presentation/components/modules/` |
| **Item de menu** | Ajouter dans `navigation.ts` (ADMIN_NAV_SECTIONS, PORTAL_NAV_ITEMS ou PARENT_PORTAL_NAV_ITEMS) |
| **Bouton d'action** | Ajouter dans le `*Content.tsx` (et `CrudCreateLink` / `CrudEditLink` si CRUD) ; mettre à jour `scripts/wire-crud-links.mjs` si besoin |
| **Formulaire** | Ajouter une entrée dans `crud-forms.ts` (ou formulaire dédié) alignée sur les champs API ; pages `/crud/[resource]/nouveau` et `.../modifier` existent déjà |
| **Écran API sans écran web** | Créer l'écran minimal cohérent avec le design system (liste + actions + formulaire) |

### Lacunes déjà identifiées (à traiter dans FEATURES.md)

- [ ] Page **login** / forgot-password (aucune route auth)
- [ ] Lien **Devoirs** absent du menu portail (route `/portal/assignments` existe)
- [ ] Écran admin **Devoirs** (`/assignments`) absent alors que l'API existe
- [ ] Formulaires CRUD manquants : `payroll`, `staff-evaluations`, `audit-logs`, éventuellement `staff-members` / `departments`
- [ ] Mapping champs formulaire (libellés FR UI) ↔ payload API (snake_case) à centraliser

---

## 6. Workflow d'intégration d'un module

Ordre imposé (comme l'API) : **un domaine FEATURES.md à la fois**, cocher après
vérification manuelle / smoke test.

Pour chaque module :

1. Lire l'écran `*Content.tsx` + `crud-forms.ts` + endpoints API concernés.
2. Créer / étendre `infrastructure/api/resources/<domaine>.ts`.
3. Brancher auth + permissions UI (`can('students.create')` depuis `/auth/me`).
4. Remplacer les données statiques du `*Content.tsx` par des appels API
   (loading / empty / error states).
5. Brancher `CrudForm` sur `POST` / `PUT` / `DELETE` (mapper champs UI → API).
6. Si page / menu / bouton / form manque → **créer** (§5).
7. Écrire les **tests Vitest** du module (§9) — obligatoire avant de cocher.
8. Vérifier isolation rôles (admin vs teacher vs parent vs student) sur l'écran.
9. Cocher la case dans `FEATURES.md` web.
10. Répondre brièvement ; attendre « oui » pour le module suivant.

**Ne pas committer** sans demande explicite.

---

## 7. Conventions UI / code

- Client components (`"use client"`) pour tout ce qui fetch / formulaire.
- Préférer les patterns déjà présents (StatusBadge, ui-card, Material Symbols).
- Pas de nouvelle lib de **composants stylés** (MUI/Chakra/shadcn) — uniquement
  les libs headless approuvées en §7bis, qui n'imposent aucun style et se
  posent sur les classes Tailwind `ui-*` existantes.

## 7bis. Outils approuvés (installés, providers câblés)

Toutes headless — zéro CSS imposé, tout se stylise avec les tokens Tailwind
existants.

| Besoin | Lib | État | Où / comment |
|---|---|---|---|
| Toasts | `sonner` | **Câblé globalement** | `<Toaster />` monté dans `AppProviders.tsx`. `infrastructure/api/client.ts` déclenche déjà `toast.error(message)` sur tout échec API (`success:false`, 401 excepté, réponse invalide, téléchargement) et `toast.success(payload.message)` sur toute mutation (POST/PUT/PATCH/DELETE) qui renvoie un `message`. **Ne pas dupliquer** un toast dans un composant pour une simple erreur/succès API — c'est déjà fait ; n'ajouter un toast manuel que pour un événement hors-mutation (ex. copie presse-papiers). |
| Confirmation destructrice | `radix-ui` (`AlertDialog`) + `motion` | **Câblé globalement** | `useConfirm()` (`presentation/components/providers/ConfirmDialogProvider.tsx`) remplace `window.confirm` partout — `await confirmDialog("Supprimer « X » ?")`, `{destructive: true}` pour le bouton rouge. Provider monté dans `AppProviders.tsx`, animé en Motion. Tout nouveau code de suppression/action irréversible doit l'utiliser, **jamais** `confirm(...)` natif (non testable proprement, bloque le thread, pas de style). Dans les tests : `vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({ useConfirm: () => vi.fn().mockResolvedValue(true) }))` (même endroit que le mock `AuthProvider`). |
| Fetch + cache API | `@tanstack/react-query` | Installé, `QueryClientProvider` monté — pas encore utilisé | Les ressources actuelles (`infrastructure/api/resources/*.ts`) sont appelées via `useState`/`useEffect` manuels (pattern existant, cohérent, testé). Pour un **nouvel** écran ou un refactor explicitement demandé : `useQuery({ queryKey: ["students", filters], queryFn: () => listStudents(filters) })` plutôt que refaire un `useEffect` à la main. Ne pas migrer les écrans existants sans qu'on le demande — ils sont déjà testés sur le pattern manuel. |
| Table de données | `@tanstack/react-table` | Installé — pas encore utilisé | Headless : `useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })`, puis map `table.getRowModel().rows` dans les `<table>` existantes stylées `ui-table-*`. À réserver aux tables qui ont vraiment besoin de tri/pagination client complexes — la plupart des listes actuelles filtrent déjà côté state simple, suffisant. |
| Formulaires | `react-hook-form` + `zod` + `@hookform/resolvers` | Installé — pas encore utilisé | `CrudForm` (générique, piloté par `crud-forms.ts`) reste le pattern par défaut pour les CRUD simples. RHF+Zod pour un formulaire métier complexe avec validation conditionnelle qui dépasserait `CrudForm` : `useForm({ resolver: zodResolver(schema) })`, mapper les erreurs 422 API vers `setError(field, { message })`. |
| Menus / dialogs / popovers accessibles | `radix-ui` (package unifié) | Installé, utilisé par `ConfirmDialogProvider` — dispo pour le reste | `import { Dialog, DropdownMenu, Tabs, Tooltip, Popover, Select } from "radix-ui"`. Le menu Export en `<details>` de `StudentsManagementContent.tsx` reste tel quel (fonctionne, accessible) — Radix pour tout **nouveau** menu/popover complexe. |
| Animations | `motion` (ex-Framer Motion) | Utilisé par `ConfirmDialogProvider` — dispo pour le reste | `import { motion, AnimatePresence } from "motion/react"`. Respecter `prefers-reduced-motion` (Motion le fait par défaut). |

Ne pas réinstaller d'équivalent (pas de `react-query` v3, pas de `react-hot-toast`,
pas de `@radix-ui/react-*` individuels — le package unifié `radix-ui` suffit).
- Variables d'env : `NEXT_PUBLIC_API_URL=http://educoreapp.test/api/v1` (Laragon)
  ou `http://localhost:8000/api/v1`.
- Stocker le token de façon cohérente ; l'envoyer en `Authorization: Bearer ...`.
- Après login : `GET /auth/me` → rôles + permissions → redirection
  (`/dashboard` admin, `/portal/student`, `/portal/parent`).
- i18n : UI déjà en français — ne pas réintroduire d'anglais dans les libellés métier.

---

## 8. Design system (rappel)

- Tokens dans `tailwind.config.ts`.
- Écrans admin : sidebar desktop (`AdminSidebar` + `AdminHeader`).
- Portail : layout mobile (`PortalLayout`).
- En cas de **nouvel écran** : s'inspirer d'un module voisin du même type
  (liste table, kanban RH, dashboard cards) plutôt que d'inventer un layout.

Si besoin d'un mockup visuel neuf : skill Google Stitch
(`.claude/skills/google-stitch`) — seulement si demandé.

---

## 9. Tests / qualité (obligatoire par feature)

Comme l'API (`php artisan test`), **chaque section FEATURES.md** doit livrer
des tests automatisés côté web.

| Outil | Usage |
|-------|--------|
| Vitest | Runner (`npm test` / `npm run test:watch`) |
| Testing Library | Composants React (`*.test.tsx`) |
| jsdom | Environnement DOM |

**Emplacement** : colocalisé `foo.ts` → `foo.test.ts` (ou `*.test.tsx`).

**Couverture minimale par module** :
1. Helpers / mappers purs (permissions, form-mapper, formatters).
2. Resource API : mock de `api` / `apiRequest`, assert path + payload.
3. `*Content` : mock de la resource → états **loading**, **succès**, **erreur**
   (et empty si pertinent). Utiliser `data-testid` sur les KPI / listes clés.

Config : `vitest.config.ts` + `src/test/setup.ts`.
Alias `@/` identique à Next.

- `npm test` doit être vert avant de cocher la section dans `FEATURES.md`.
- `npm run lint` après changements structurants.
- Smoke manuel complémentaire : login → liste → create → edit → action métier.
- Pas de Playwright/Cypress obligatoire pour l'instant.

---

## 10. Références

| Fichier | Rôle |
|---------|------|
| `FEATURES.md` (ce dossier) | Checklist d'intégration web |
| `../api/FEATURES.md` | Spécification API terminée |
| `../api/CLAUDE.md` | Architecture backend |
| `src/shared/config/routes.ts` | Liste des écrans |
| `src/shared/config/navigation.ts` | Menus |
| `src/shared/config/crud-forms.ts` | Schémas formulaires |
| `README.md` | Démarrage local |
