# EduCore Web — Intégration API

Checklist d'intégration frontend ↔ API Laravel (`../api`).
L'API est **terminée** ; ici on branche les écrans, et on **crée** tout ce qui
manque (page, menu, bouton, formulaire) — voir `CLAUDE.md` §5–§6.

Légende : `[API]` = endpoints principaux ; `[UI]` = écrans / menus / forms.

Ordre : fonder l'infra auth + client HTTP **avant** tout module métier.
Cocher un bloc seulement quand le module est utilisable de bout en bout
(liste + create/edit + actions métier + droits).

---

## 0. Fondations frontend (obligatoire en premier)

### Infra API & auth
- [x] `NEXT_PUBLIC_API_URL` documenté (`.env.example`)
- [x] Client HTTP (`infrastructure/api/client.ts`) : Bearer, enveloppe
      `{ success, message, data, meta }`, gestion 401/403/422
- [x] Stockage token + `AuthProvider` / hook `useAuth`
- [x] `GET /auth/me` au démarrage (user, rôles, permissions, institution)
- [x] Helper `can(permission)` pour masquer boutons / menus
- [x] Intercepteur 401 → logout + redirection login

### UI auth (actuellement absente — à créer)
- [x] Page `/login` (email + mot de passe → `POST /auth/login`)
- [x] Page forgot / reset password (`POST /auth/forgot-password`,
      `POST /auth/reset-password`)
- [x] Redirection post-login selon rôle (admin → `/dashboard`,
      student → `/portal/student`, parent → `/portal/parent`)
- [x] Bouton déconnexion → `POST /auth/logout` + clear token
- [x] Protéger layouts `(admin)` et `(portal)` (middleware / guard client)

### Gaps UI transverses à combler dès les fondations
- [x] Ajouter **Devoirs** dans `PORTAL_NAV_ITEMS` / `PARENT_PORTAL_NAV_ITEMS`
      (`/portal/assignments` existe déjà)
- [x] Convention de mapping champs formulaire (FR camelCase UI) ↔ API
      (snake_case) centralisée

---

## 1. Dashboard admin `[UI: /dashboard]` `[API: GET /dashboard/admin]`

- [x] Remplacer stats mock par `GET /dashboard/admin`
- [x] États loading / erreur / vide
- [x] Tests Vitest (`AdminDashboardContent`, helpers KPI)

---

## 2. Élèves `[UI: /students]` `[API: /students, /students/{id}/full]`

- [x] Liste + search/filtres branchés API
- [x] CRUD via `crud-forms` key `students` → `POST/PUT/DELETE /students`
- [x] Dossier complet / détail → `GET /students/{id}/full` (`/students/[id]`)
- [x] Upload photo / documents (media) si exposé par l'API
- [x] Tests Vitest (helpers, resource, liste, dossier, adapter CRUD)

---

## 3. Parents `[UI: /parents]` `[API: /guardians]`

- [x] Liste + CRUD `parents` ↔ `/guardians`
- [x] Liaison élèves `student_guardians` / `GET /guardians/{id}/students`
      (`/parents/[id]` : attach / detach)
- [x] Tests Vitest (helpers, resource, liste, fiche, adapter CRUD)

---

## 4. Enseignants `[UI: /teachers]` `[API: /teachers]`

- [x] Liste + CRUD `teachers`
- [x] Affectations matières/classes (`/teachers/{id}/assignments`)
      (`/teachers/[id]` : créer / retirer via `teacher-subjects`)
- [x] Tests Vitest (helpers, resource, liste, fiche, adapter CRUD)

---

## 5. Classes / Matières / Emplois du temps
`[UI: /classes, /subjects, /schedules]`
`[API: /class-groups, /subjects, /timetable-slots, /levels, /series, ...]`

- [x] Classes : CRUD + affectation élèves (`/classes/[id]`)
- [x] Matières : CRUD + coefficients
- [x] Emploi du temps : CRUD créneaux + affichage conflits (message API 422)
- [x] Tests Vitest (helpers, resources, écrans, adapters)

---

## 6. Présences `[UI: /attendance]` `[API: /attendance]`

- [x] Créer formulaire CRUD `attendance` dans `crud-forms.ts` (manquant)
- [x] Liste / saisie du jour branchées API
- [x] Actions Justifier / Valider → `POST .../justify`, `.../validate`
- [x] Tests Vitest (helpers, resource, registre du jour, adapter CRUD)

---

## 7. Évaluations & Notes
`[UI: /assessments, /grades]`
`[API: /assessments, /grades, /grading-settings]`

- [x] CRUD évaluations
- [x] Créer formulaire CRUD `grades` (manquant) + saisie / validation note
- [x] `POST /grades/{id}/validate` (bouton action)
- [x] Paramètres de notation (`GET/PUT /grading-settings`) dans Settings ou sous-écran
- [x] Tests Vitest (helpers, resources, listes, saisie, settings, adapters)

---

## 8. Bulletins `[UI: /report-cards]` `[API: /report-cards]`

- [x] Créer formulaire / actions générer & publier si absents
- [x] Liste + génération PDF + téléchargement (URL signée / media)
- [x] Tests Vitest (helpers, resource, liste + actions, adapter CRUD)

---

## 9. Discipline `[UI: /discipline]` `[API: /discipline-records]`

- [x] Liste + CRUD incidents / sanctions
- [x] Historique par élève (lien dossier élève)
- [x] Tests Vitest (helpers, resource, liste + validate, adapter CRUD)

---

## 10. Inscriptions `[UI: /enrollment]` `[API: /enrollments]`

- [x] Pipeline de statuts (APPLICATION → … → CLASS_ASSIGNED)
- [x] Boutons d'action de transition (review, approve, enroll…)
- [x] Upload pièces (media)
- [x] Tests Vitest (helpers, resource, liste + transitions + upload, adapter)

---

## 11. Bibliothèque `[UI: /library]` `[API: /library-books, /library-copies, /library-loans]`

- [x] CRUD livres / exemplaires
- [x] Emprunt / retour / liste retards (`.../return`, `.../overdue`)
- [x] Tests Vitest (helpers, resource, onglets + retour, adapters)

---

## 12. Finances
`[UI: /finance/overview, /payments, /invoices, /expenses]`
`[API: /payments, /invoices, /expenses, cash registers…]`

- [x] Vue d'ensemble : agrégats API (dashboard / reports finance)
- [x] Paiements : init Paystack + **jamais** confirmer côté client (statut via API)
- [x] Factures : CRUD + reçu PDF
- [x] Dépenses : CRUD
- [x] Tests Vitest (helpers, resources, écrans, adapters)

---

## 13. Communication `[UI: /communication]` `[API: /announcements, /conversations]`

- [x] Annonces ciblées
- [x] Messages privés / groupe
- [x] Brancher formulaire `communication` sur API réelle
- [x] Tests Vitest (helpers, resource, onglets, adapters)

---

## 14. Documents `[UI: /documents]` `[API: /documents, catégories]`

- [x] Catégories + upload / download (URLs signées)
- [x] Respect permissions par catégorie
- [x] Tests Vitest (helpers, resource, écran, adapters)

---

## 15. Rapports `[UI: /reports]` `[API: /reports/{academic,attendance,finance,students}]`

- [x] Sélecteur type + filtres
- [x] Affichage JSON résumé
- [x] Export `?format=pdf|csv|xlsx` (téléchargement fichier)
- [x] Tests Vitest (helpers, resource, écran)

---

## 16. Audit / Sécurité `[UI: /security/audit-logs]` `[API: /audit-logs]`

- [x] Créer formulaire filtres si besoin (resource/action/dates)
- [x] Liste paginée + détail entrée
- [x] Visible seulement si `settings.view` (ou équivalent)
- [x] Tests Vitest (helpers, resource, écran, client meta)

---

## 17. Paramètres `[UI: /settings]` `[API: /institution, /settings, campuses…]`

- [x] Établissement `GET/PUT /institution`
- [x] Settings généraux
- [x] Campuses / buildings / rooms si exposés dans l'UI

---

## 18. RH — Recrutement `[UI: /hr/recruitment]`
`[API: /hr-job-postings, /hr-applications]`

- [x] Offres CRUD (form `recruitment`)
- [x] Pipeline candidatures (advance / reject)
- [x] Créer boutons manquants sur les cartes kanban

---

## 19. RH — Paie / Congés / Évaluations
`[UI: /hr/payroll, /hr/leave, /hr/evaluations]`
`[API: /staff-payrolls, /staff-leaves, /staff-attendance, /staff-evaluations]`

- [x] Créer formulaires CRUD manquants : `payroll`, `staff-evaluations`
      (leave existe déjà)
- [x] Paie : créer fiche + `POST .../process`
- [x] Congés : approve / reject
- [x] Présences personnel
- [x] Évaluations personnel CRUD
- [x] Écran / menu **Personnel / Départements** (`/staff-members`, `/departments`)
      si absent → **créer** page + item menu RH

---

## 20. Cantine
`[UI: /canteen/menus|accounts|special-diets]`
`[API: /canteen-menus, /canteen-accounts, .../topups, /canteen-special-diets]`

- [x] Menus CRUD
- [x] Comptes + rechargement (`POST .../topups`)
- [x] Régimes spéciaux CRUD

---

## 21. Transport
`[UI: /transport/fleet|drivers|routes|subscriptions]`
`[API: /transport-vehicles, /transport-drivers, /transport-routes, /transport-subscriptions]`

- [x] Flotte / chauffeurs CRUD
- [x] Itinéraires + arrêts (`stops[]`)
- [x] Abonnements élèves

---

## 22. Inventaire
`[UI: /inventory/supplies|assets]`
`[API: /inventory-supplies, /inventory-assets]`

- [x] Stocks + alertes low-stock + restock
- [x] Patrimoine + assign + historique

---

## 23. Portail élève / parent
`[UI: /portal/*]`
`[API: /dashboard/student|parent, grades, assignments, invoices, notifications]`

- [x] Dashboard élève / parent
- [x] Emploi du temps
- [x] Notes / résultats
- [x] Devoirs (soumission `POST /assignments/{id}/submit`) — **ajouter lien menu**
- [x] Frais & paiements (Paystack redirect)
- [x] Notifications (`/notifications`, mark read)
- [x] Profil (`/auth/me` + éventuel update)

---

## 24. Devoirs admin (écran manquant)
`[API: /assignments, /assignment-submissions]`

- [x] **Créer** page `/assignments` + `*Content.tsx` + entrée `routes.ts`
- [x] **Créer** item menu Scolarité « Devoirs »
- [x] **Créer** formulaire CRUD `assignments` dans `crud-forms.ts`
- [x] Liste devoirs enseignant + notation soumissions

---

## Transverse (chaque module)

- Remplacer mocks / données hardcodées
- Loading + empty + error states
- Masquer actions selon permissions API
- Formulaires : validation client légère + affichage erreurs 422 API
- Ne jamais confirmer un paiement Paystack depuis le front
- Si page / menu / bouton / form manque → créer (CLAUDE.md §5)
- **Tests Vitest** a minima (comme les Feature tests API) :
  - helpers / mappers du module
  - resource API mockée (`infrastructure/api/resources/...`)
  - composant `*Content` : loading + succès + erreur (RTL)
  - `npm test` vert avant de cocher la section
- `npm run lint` OK sur les fichiers touchés
- Cocher la section puis attendre « oui » pour la suivante

---

## Progression

| # | Module | Statut |
|---|--------|--------|
| 0 | Fondations + Auth UI | ☑ |
| 1 | Dashboard admin | ☑ |
| 2 | Élèves | ☑ |
| 3 | Parents | ☑ |
| 4 | Enseignants | ☑ |
| 5 | Classes / Matières / EDT | ☑ |
| 6 | Présences | ☑ |
| 7 | Évaluations & Notes | ☑ |
| 8 | Bulletins | ☑ |
| 9 | Discipline | ☑ |
| 10 | Inscriptions | ☑ |
| 11 | Bibliothèque | ☑ |
| 12 | Finances | ☑ |
| 13 | Communication | ☑ |
| 14 | Documents | ☑ |
| 15 | Rapports | ☑ |
| 16 | Audit / Sécurité | ☑ |
| 17 | Paramètres | ☑ |
| 18 | RH — Recrutement | ☑ |
| 19 | RH — Paie / Congés / Évaluations | ☑ |
| 20 | Cantine | ☑ |
| 21 | Transport | ☑ |
| 22 | Inventaire | ☑ |
| 23 | Portail élève / parent | ☑ |
| 24 | Devoirs admin | ☑ |

### Couverture API post-checklist
Écrans / clients ajoutés pour les surfaces admin absentes de §0–§24 :
structure académique (`/academic/structure`), catalogue frais (`/finance/fees`),
caisse (`/finance/cash`), réinscriptions (onglet Inscriptions), refresh token,
dashboard enseignant. Exclus volontairement côté front : `GET /health`,
`POST /webhooks/paystack`, téléchargement signé brut (via `download-url`).
