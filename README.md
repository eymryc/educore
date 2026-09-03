# EduCore Web — Next.js

Application front-end de gestion scolaire (ERP), en **Next.js 15**.

## Documentation projet

| Fichier | Contenu |
|---------|---------|
| [`CLAUDE.md`](./CLAUDE.md) | Architecture, conventions, mapping écrans ↔ API, règle UI manquante |
| [`FEATURES.md`](./FEATURES.md) | Checklist d'intégration API (à cocher module par module) |
| [`../api/FEATURES.md`](../api/FEATURES.md) | Spécification API (terminée) |

## Démarrage

```bash
cd web
npm install
npm run dev
```

Tests (Vitest, comme les Feature tests API) :

```bash
npm test
npm run test:watch
```

Ouvrir [http://localhost:3000](http://localhost:3000) — redirection automatique vers `/dashboard`.

Créer un `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://educoreapp.test/api/v1
```

(Compte démo API : `admin@educore.ci` / `password`.)

## Architecture

```
src/
├── app/                          # Routes Next.js (App Router)
│   ├── (admin)/                  # Espace administration (sidebar desktop)
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── hr/recruitment/
│   │   └── ...
│   └── (portal)/                 # Portail élève / parent (mobile)
│       └── portal/
│           ├── student/
│           ├── parent/
│           └── ...
├── presentation/                 # Composants UI
│   └── components/
│       ├── layout/               # AdminSidebar, AdminHeader, PortalLayout…
│       ├── modules/              # Contenu par écran
│       └── shared/                # Composants réutilisables (StatusBadge…)
└── shared/
    └── config/                   # Navigation, routes, thème, crud-forms
```

Les données affichées sont encore largement **statiques**. L'intégration API
suit `FEATURES.md` (fondations auth + client HTTP d'abord). Si une page, un
item de menu, un bouton ou un formulaire manque pour un endpoint, **il faut
le créer** (voir `CLAUDE.md` §5).

## Design system

Tokens et guidelines implémentés via `tailwind.config.ts` et les composants `presentation/`.

## Routes principales

| Route | Module |
|-------|--------|
| `/dashboard` | Tableau de bord admin |
| `/students` | Gestion élèves |
| `/portal/student` | Dashboard élève |
| `/portal/parent` | Dashboard parent |
| `/hr/recruitment` | Recrutement |
| `/transport/fleet` | Flotte transport |
| `/canteen/menus` | Menus cantine |

Voir `src/shared/config/routes.ts` pour la liste complète (~44 écrans).
