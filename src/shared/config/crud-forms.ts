import type { CrudResourceConfig } from "@/shared/types/crud-form.types";

const statutActif = [
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" },
  { value: "suspendu", label: "Suspendu" },
];

const niveaux = [
  { value: "6eme", label: "6ème" },
  { value: "5eme", label: "5ème" },
  { value: "4eme", label: "4ème" },
  { value: "3eme", label: "3ème" },
  { value: "2nde", label: "2nde" },
  { value: "1ere", label: "1ère" },
  { value: "tle", label: "Terminale" },
];

export const CRUD_RESOURCES: CrudResourceConfig[] = [
  {
    key: "students",
    label: "Élèves",
    labelSingular: "élève",
    listPath: "/students",
    sections: [
      {
        title: "Identité",
        fields: [
          { name: "last_name", label: "Nom", type: "text", required: true, placeholder: "Koné" },
          { name: "first_name", label: "Prénom(s)", type: "text", required: true, placeholder: "Aminata" },
          { name: "birth_date", label: "Date de naissance", type: "date", required: true },
          {
            name: "gender",
            label: "Sexe",
            type: "select",
            required: true,
            options: [
              { value: "F", label: "Féminin" },
              { value: "M", label: "Masculin" },
            ],
          },
          {
            name: "matricule",
            label: "Matricule",
            type: "text",
            placeholder: "Auto si vide",
            hint: "Laissé vide : généré automatiquement par l'API.",
          },
        ],
      },
      {
        title: "Scolarité",
        fields: [
          {
            name: "level_id",
            label: "Niveau",
            type: "select",
            options: [],
            hint: "Chargé depuis l'API (niveaux).",
          },
          {
            name: "class_group_id",
            label: "Classe",
            type: "select",
            options: [],
            hint: "Chargé depuis l'API (classes).",
          },
          {
            name: "status",
            label: "Statut",
            type: "select",
            required: true,
            options: [
              { value: "active", label: "Actif" },
              { value: "inactive", label: "Inactif" },
              { value: "suspended", label: "Suspendu" },
            ],
          },
          { name: "enrolled_at", label: "Date d'inscription", type: "date" },
        ],
      },
      {
        title: "Contact",
        fields: [
          { name: "email", label: "E-mail", type: "email", placeholder: "eleve@ecole.ci" },
          { name: "phone", label: "Téléphone", type: "tel", placeholder: "+225 07 00 00 00 00" },
          {
            name: "address",
            label: "Adresse",
            type: "textarea",
            colSpan: 2,
            placeholder: "Quartier, commune, ville",
          },
        ],
      },
    ],
  },
  {
    key: "parents",
    label: "Parents / tuteurs",
    labelSingular: "parent",
    listPath: "/parents",
    sections: [
      {
        title: "Informations personnelles",
        fields: [
          { name: "last_name", label: "Nom", type: "text", required: true },
          { name: "first_name", label: "Prénom(s)", type: "text", required: true },
          { name: "email", label: "E-mail", type: "email", required: true },
          { name: "phone", label: "Téléphone", type: "tel", required: true },
          { name: "profession", label: "Profession", type: "text" },
          { name: "address", label: "Adresse", type: "textarea", colSpan: 2 },
          {
            name: "create_portal_account",
            label: "Créer un compte portail parent",
            type: "checkbox",
            hint: "Uniquement à la création. Mot de passe généré côté API.",
          },
        ],
      },
    ],
  },
  {
    key: "teachers",
    label: "Enseignants",
    labelSingular: "enseignant",
    listPath: "/teachers",
    sections: [
      {
        title: "Identité",
        fields: [
          { name: "last_name", label: "Nom", type: "text", required: true },
          { name: "first_name", label: "Prénom(s)", type: "text", required: true },
          { name: "email", label: "E-mail professionnel", type: "email", required: true },
          { name: "phone", label: "Téléphone", type: "tel", required: true },
          {
            name: "employee_number",
            label: "N° employé",
            type: "text",
            placeholder: "Auto si vide",
            hint: "Laissé vide : généré automatiquement par l'API.",
          },
        ],
      },
      {
        title: "Affectation",
        fields: [
          {
            name: "main_subject_id",
            label: "Matière principale",
            type: "select",
            options: [],
            hint: "Chargé depuis l'API (matières).",
          },
          {
            name: "grade_title",
            label: "Grade / fonction",
            type: "text",
            placeholder: "Professeur certifié",
          },
          { name: "hired_at", label: "Date d'embauche", type: "date" },
          {
            name: "status",
            label: "Statut",
            type: "select",
            required: true,
            options: [
              { value: "active", label: "Actif" },
              { value: "inactive", label: "Inactif" },
              { value: "suspended", label: "Suspendu" },
              { value: "on_leave", label: "En congé" },
            ],
          },
          {
            name: "create_portal_account",
            label: "Créer un compte enseignant (portail)",
            type: "checkbox",
            hint: "Uniquement à la création. Requis pour les affectations classe/matière.",
          },
        ],
      },
    ],
  },
  {
    key: "classes",
    label: "Classes",
    labelSingular: "classe",
    listPath: "/classes",
    sections: [
      {
        title: "Classe",
        fields: [
          { name: "name", label: "Nom de la classe", type: "text", required: true, placeholder: "2nde A" },
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "level_id",
            label: "Niveau",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "series_id",
            label: "Série",
            type: "select",
            options: [],
          },
          {
            name: "max_capacity",
            label: "Effectif maximum",
            type: "number",
            placeholder: "45",
          },
          {
            name: "head_teacher_id",
            label: "Professeur principal",
            type: "select",
            options: [],
            hint: "Utilisateur enseignant (user_id).",
          },
          {
            name: "room_id",
            label: "Salle principale",
            type: "select",
            options: [],
          },
        ],
      },
    ],
  },
  {
    key: "subjects",
    label: "Matières",
    labelSingular: "matière",
    listPath: "/subjects",
    sections: [
      {
        title: "Matière",
        fields: [
          { name: "name", label: "Nom", type: "text", required: true, placeholder: "Mathématiques" },
          { name: "code", label: "Code", type: "text", required: true, placeholder: "MATH" },
          { name: "coefficient", label: "Coefficient", type: "number", placeholder: "4" },
          {
            name: "level_id",
            label: "Niveau",
            type: "select",
            options: [],
          },
        ],
      },
    ],
  },
  {
    key: "schedules",
    label: "Emplois du temps",
    labelSingular: "créneau",
    listPath: "/schedules",
    sections: [
      {
        title: "Créneau horaire",
        fields: [
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "class_group_id",
            label: "Classe",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "subject_id",
            label: "Matière",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "day_of_week",
            label: "Jour",
            type: "select",
            required: true,
            options: [
              { value: "monday", label: "Lundi" },
              { value: "tuesday", label: "Mardi" },
              { value: "wednesday", label: "Mercredi" },
              { value: "thursday", label: "Jeudi" },
              { value: "friday", label: "Vendredi" },
              { value: "saturday", label: "Samedi" },
            ],
          },
          { name: "start_time", label: "Heure de début", type: "time", required: true },
          { name: "end_time", label: "Heure de fin", type: "time", required: true },
          {
            name: "teacher_id",
            label: "Enseignant",
            type: "select",
            options: [],
          },
          {
            name: "room_id",
            label: "Salle",
            type: "select",
            options: [],
          },
        ],
      },
    ],
  },
  {
    key: "attendance",
    label: "Présences",
    labelSingular: "présence",
    listPath: "/attendance",
    sections: [
      {
        title: "Appel",
        fields: [
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "class_group_id",
            label: "Classe",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "student_id",
            label: "Élève",
            type: "select",
            required: true,
            options: [],
          },
          { name: "date", label: "Date", type: "date", required: true },
          {
            name: "status",
            label: "Statut",
            type: "select",
            required: true,
            options: [
              { value: "PRESENT", label: "Présent" },
              { value: "ABSENT", label: "Absent" },
              { value: "LATE", label: "Retard" },
              { value: "JUSTIFIED", label: "Justifié" },
            ],
          },
          { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "assessments",
    label: "Évaluations",
    labelSingular: "évaluation",
    listPath: "/assessments",
    sections: [
      {
        title: "Évaluation",
        fields: [
          { name: "title", label: "Titre", type: "text", required: true, placeholder: "Devoir n°2 — Algèbre", colSpan: 2 },
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "academic_period_id",
            label: "Période",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "class_group_id",
            label: "Classe",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "subject_id",
            label: "Matière",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "type",
            label: "Type",
            type: "select",
            required: true,
            options: [
              { value: "devoir", label: "Devoir" },
              { value: "composition", label: "Composition" },
              { value: "interrogation", label: "Interrogation" },
              { value: "tp", label: "Travaux pratiques" },
            ],
          },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "coefficient", label: "Coefficient", type: "number", required: true, placeholder: "1" },
          { name: "max_score", label: "Barème", type: "number", required: true, placeholder: "20" },
        ],
      },
    ],
  },
  {
    key: "assignments",
    label: "Devoirs",
    labelSingular: "devoir",
    listPath: "/assignments",
    sections: [
      {
        title: "Devoir",
        fields: [
          {
            name: "title",
            label: "Titre",
            type: "text",
            required: true,
            placeholder: "DM n°2 — Fonctions",
            colSpan: 2,
          },
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
            hint: "Non modifiable après création.",
          },
          {
            name: "class_group_id",
            label: "Classe",
            type: "select",
            required: true,
            options: [],
            hint: "Non modifiable après création.",
          },
          {
            name: "subject_id",
            label: "Matière",
            type: "select",
            required: true,
            options: [],
            hint: "Non modifiable après création.",
          },
          {
            name: "due_at",
            label: "Échéance",
            type: "datetime-local",
            required: true,
          },
          {
            name: "max_score",
            label: "Barème",
            type: "number",
            placeholder: "20",
          },
          {
            name: "status",
            label: "Statut",
            type: "select",
            options: [
              { value: "DRAFT", label: "Brouillon" },
              { value: "PUBLISHED", label: "Publié" },
              { value: "CLOSED", label: "Clos" },
            ],
          },
          {
            name: "description",
            label: "Description",
            type: "textarea",
            colSpan: 2,
          },
          {
            name: "instructions",
            label: "Consignes",
            type: "textarea",
            colSpan: 2,
          },
        ],
      },
    ],
  },
  {
    key: "grades",
    label: "Notes",
    labelSingular: "note",
    listPath: "/grades",
    sections: [
      {
        title: "Note",
        fields: [
          {
            name: "assessment_id",
            label: "Évaluation",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          {
            name: "student_id",
            label: "Élève",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          { name: "score", label: "Note", type: "number", required: true },
          { name: "comment", label: "Commentaire", type: "textarea", colSpan: 2 },
          {
            name: "reason",
            label: "Motif (si note déjà validée)",
            type: "text",
            colSpan: 2,
            placeholder: "Correction après validation…",
          },
        ],
      },
    ],
  },
  {
    key: "report-cards",
    label: "Bulletins",
    labelSingular: "bulletin",
    listPath: "/report-cards",
    sections: [
      {
        title: "Bulletin",
        fields: [
          {
            name: "student_id",
            label: "Élève",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          {
            name: "academic_period_id",
            label: "Période",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "appreciation",
            label: "Appréciation",
            type: "textarea",
            colSpan: 2,
            placeholder: "Appréciation du conseil de classe…",
          },
        ],
      },
    ],
  },
  {
    key: "discipline",
    label: "Discipline",
    labelSingular: "incident",
    listPath: "/discipline",
    sections: [
      {
        title: "Incident disciplinaire",
        fields: [
          {
            name: "student_id",
            label: "Élève",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "class_group_id",
            label: "Classe",
            type: "select",
            options: [],
          },
          {
            name: "type",
            label: "Type",
            type: "select",
            required: true,
            options: [
              { value: "INCIDENT", label: "Incident" },
              { value: "WARNING", label: "Avertissement" },
              { value: "SANCTION", label: "Sanction" },
              { value: "EXCLUSION", label: "Exclusion" },
              { value: "DISCIPLINARY_COUNCIL", label: "Conseil de discipline" },
            ],
          },
          { name: "title", label: "Titre", type: "text", required: true, colSpan: 2 },
          { name: "occurred_at", label: "Date", type: "date", required: true },
          { name: "location", label: "Lieu", type: "text" },
          { name: "description", label: "Description", type: "textarea", colSpan: 2 },
          { name: "sanction_type", label: "Type de sanction", type: "text", placeholder: "DETENTION, …" },
          { name: "exclusion_start", label: "Début exclusion", type: "date" },
          { name: "exclusion_end", label: "Fin exclusion", type: "date" },
          { name: "council_date", label: "Date du conseil", type: "date" },
          {
            name: "council_decision",
            label: "Décision du conseil",
            type: "textarea",
            colSpan: 2,
          },
        ],
      },
    ],
  },
  {
    key: "enrollment",
    label: "Inscriptions",
    labelSingular: "demande d'inscription",
    listPath: "/enrollment",
    sections: [
      {
        title: "Candidature",
        fields: [
          { name: "last_name", label: "Nom", type: "text", required: true },
          { name: "first_name", label: "Prénom(s)", type: "text", required: true },
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "level_id",
            label: "Niveau demandé",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "class_group_id",
            label: "Classe souhaitée",
            type: "select",
            options: [],
          },
          { name: "birth_date", label: "Date de naissance", type: "date" },
          {
            name: "gender",
            label: "Genre",
            type: "select",
            options: [
              { value: "M", label: "Masculin" },
              { value: "F", label: "Féminin" },
            ],
          },
          { name: "parent_contact", label: "Contact parent", type: "text", required: true },
          { name: "application_date", label: "Date de la demande", type: "date", required: true },
          { name: "observations", label: "Observations", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "library",
    label: "Bibliothèque",
    labelSingular: "ouvrage",
    listPath: "/library",
    sections: [
      {
        title: "Ouvrage",
        fields: [
          { name: "title", label: "Titre", type: "text", required: true, colSpan: 2 },
          { name: "author", label: "Auteur", type: "text" },
          { name: "isbn", label: "ISBN", type: "text" },
          { name: "publisher", label: "Éditeur", type: "text" },
          { name: "publication_year", label: "Année", type: "number" },
          { name: "category", label: "Catégorie", type: "text", placeholder: "Manuel, Roman…" },
          {
            name: "is_active",
            label: "Actif",
            type: "checkbox",
          },
          { name: "description", label: "Description", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "library-copies",
    label: "Exemplaires",
    labelSingular: "exemplaire",
    listPath: "/library",
    sections: [
      {
        title: "Exemplaire",
        fields: [
          {
            name: "library_book_id",
            label: "Ouvrage",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          { name: "copy_code", label: "Code exemplaire", type: "text", required: true },
          {
            name: "status",
            label: "Statut",
            type: "select",
            options: [
              { value: "AVAILABLE", label: "Disponible" },
              { value: "LOANED", label: "Emprunté" },
              { value: "LOST", label: "Perdu" },
              { value: "DAMAGED", label: "Endommagé" },
              { value: "RETIRED", label: "Retiré" },
            ],
          },
          { name: "acquired_at", label: "Date d'acquisition", type: "date" },
          { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "library-loans",
    label: "Emprunts",
    labelSingular: "emprunt",
    listPath: "/library",
    sections: [
      {
        title: "Emprunt",
        fields: [
          {
            name: "library_copy_id",
            label: "Exemplaire",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          {
            name: "student_id",
            label: "Élève",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          { name: "due_date", label: "Date de retour prévue", type: "date", required: true },
          { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "payments",
    label: "Paiements",
    labelSingular: "paiement",
    listPath: "/payments",
    sections: [
      {
        title: "Initier un paiement Paystack",
        fields: [
          {
            name: "invoice_id",
            label: "Facture",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          {
            name: "amount",
            label: "Montant (FCFA, optionnel)",
            type: "number",
            placeholder: "Solde restant par défaut",
          },
          {
            name: "email",
            label: "E-mail Paystack (optionnel)",
            type: "email",
            placeholder: "Sinon e-mail du compte / élève",
          },
        ],
      },
    ],
  },
  {
    key: "invoices",
    label: "Factures",
    labelSingular: "facture",
    listPath: "/invoices",
    sections: [
      {
        title: "Facture",
        fields: [
          {
            name: "student_id",
            label: "Élève",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
          },
          { name: "issue_date", label: "Date d'émission", type: "date", required: true },
          { name: "due_date", label: "Date d'échéance", type: "date", required: true },
          { name: "discount_amount", label: "Remise (FCFA)", type: "number" },
          { name: "penalty_amount", label: "Pénalité (FCFA)", type: "number" },
          { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
        ],
      },
      {
        title: "Ligne de facturation",
        fields: [
          {
            name: "item_description",
            label: "Description",
            type: "text",
            required: true,
            colSpan: 2,
            placeholder: "Scolarité T1, cantine…",
          },
          { name: "item_quantity", label: "Quantité", type: "number", placeholder: "1" },
          { name: "item_unit_amount", label: "Montant unitaire (FCFA)", type: "number", required: true },
        ],
      },
    ],
  },
  {
    key: "expenses",
    label: "Dépenses",
    labelSingular: "dépense",
    listPath: "/expenses",
    sections: [
      {
        title: "Dépense",
        fields: [
          {
            name: "category",
            label: "Catégorie",
            type: "text",
            required: true,
            placeholder: "Fournitures, maintenance…",
          },
          {
            name: "description",
            label: "Description",
            type: "text",
            required: true,
            colSpan: 2,
          },
          { name: "amount", label: "Montant (FCFA)", type: "number", required: true },
          { name: "expense_date", label: "Date", type: "date", required: true },
          {
            name: "cash_register_id",
            label: "Caisse (optionnel)",
            type: "select",
            options: [],
          },
          { name: "reference", label: "Référence", type: "text" },
        ],
      },
    ],
  },
  {
    key: "recruitment",
    label: "Recrutement",
    labelSingular: "offre d'emploi",
    listPath: "/hr/recruitment",
    sections: [
      {
        title: "Offre",
        fields: [
          { name: "title", label: "Intitulé du poste", type: "text", required: true, colSpan: 2 },
          {
            name: "department_id",
            label: "Département",
            type: "select",
            options: [],
          },
          {
            name: "status",
            label: "Statut",
            type: "select",
            options: [
              { value: "ouvert", label: "Ouvert" },
              { value: "cloture", label: "Clôturé" },
            ],
          },
          {
            name: "description",
            label: "Description",
            type: "textarea",
            colSpan: 2,
            required: true,
          },
          {
            name: "application_deadline",
            label: "Date limite de candidature",
            type: "date",
            required: true,
          },
        ],
      },
    ],
  },
  {
    key: "hr-applications",
    label: "Candidatures RH",
    labelSingular: "candidature",
    listPath: "/hr/recruitment",
    sections: [
      {
        title: "Candidat",
        fields: [
          {
            name: "hr_job_posting_id",
            label: "Offre",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          { name: "first_name", label: "Prénom", type: "text", required: true },
          { name: "last_name", label: "Nom", type: "text", required: true },
          { name: "email", label: "E-mail", type: "email", required: true },
          { name: "phone", label: "Téléphone", type: "tel" },
          {
            name: "applied_position",
            label: "Poste visé",
            type: "text",
            required: true,
            colSpan: 2,
          },
          { name: "applied_at", label: "Date de candidature", type: "date" },
          { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "leave",
    label: "Congés et absences",
    labelSingular: "congé",
    listPath: "/hr/leave",
    sections: [
      {
        title: "Demande de congé",
        fields: [
          {
            name: "staff_member_id",
            label: "Employé",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          {
            name: "leave_type",
            label: "Type",
            type: "select",
            required: true,
            options: [
              { value: "annuel", label: "Congé annuel" },
              { value: "maladie", label: "Maladie" },
              { value: "maternite", label: "Maternité" },
              { value: "exceptionnel", label: "Exceptionnel" },
            ],
          },
          { name: "start_date", label: "Date de début", type: "date", required: true },
          { name: "end_date", label: "Date de fin", type: "date", required: true },
          { name: "reason", label: "Motif", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "payroll",
    label: "Paie",
    labelSingular: "fiche de paie",
    listPath: "/hr/payroll",
    sections: [
      {
        title: "Fiche de paie",
        fields: [
          {
            name: "staff_member_id",
            label: "Employé",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          {
            name: "period_month",
            label: "Mois",
            type: "number",
            required: true,
            placeholder: "1–12",
          },
          { name: "period_year", label: "Année", type: "number", required: true },
          { name: "base_salary", label: "Salaire de base", type: "number", required: true },
          { name: "allowances", label: "Indemnités", type: "number" },
          { name: "deductions", label: "Déductions", type: "number" },
          { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "staff-evaluations",
    label: "Évaluations du personnel",
    labelSingular: "évaluation",
    listPath: "/hr/evaluations",
    sections: [
      {
        title: "Évaluation",
        fields: [
          {
            name: "staff_member_id",
            label: "Employé",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          { name: "evaluation_date", label: "Date", type: "date", required: true },
          {
            name: "period_label",
            label: "Période",
            type: "text",
            required: true,
            placeholder: "T1 2026",
          },
          {
            name: "overall_score",
            label: "Note globale (/20)",
            type: "number",
            required: true,
          },
          {
            name: "status",
            label: "Statut",
            type: "select",
            options: [
              { value: "draft", label: "Brouillon" },
              { value: "finalized", label: "Finalisée" },
            ],
          },
          { name: "strengths", label: "Points forts", type: "textarea", colSpan: 2 },
          {
            name: "improvements",
            label: "Axes d'amélioration",
            type: "textarea",
            colSpan: 2,
          },
          { name: "comments", label: "Commentaires", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "staff-members",
    label: "Personnel",
    labelSingular: "membre du personnel",
    listPath: "/hr/staff",
    sections: [
      {
        title: "Fiche personnel",
        fields: [
          { name: "first_name", label: "Prénom", type: "text", required: true },
          { name: "last_name", label: "Nom", type: "text", required: true },
          { name: "email", label: "E-mail", type: "email", required: true },
          { name: "phone", label: "Téléphone", type: "tel", required: true },
          { name: "job_title", label: "Poste", type: "text", required: true, colSpan: 2 },
          {
            name: "department_id",
            label: "Département",
            type: "select",
            options: [],
          },
          {
            name: "status",
            label: "Statut",
            type: "select",
            options: [
              { value: "active", label: "Actif" },
              { value: "inactive", label: "Inactif" },
              { value: "suspended", label: "Suspendu" },
              { value: "on_leave", label: "En congé" },
            ],
          },
          { name: "employee_number", label: "Matricule", type: "text" },
          { name: "hired_at", label: "Date d'embauche", type: "date" },
          {
            name: "create_portal_account",
            label: "Créer un compte portail",
            type: "checkbox",
          },
        ],
      },
    ],
  },
  {
    key: "departments",
    label: "Départements",
    labelSingular: "département",
    listPath: "/hr/staff",
    sections: [
      {
        title: "Département",
        fields: [
          { name: "name", label: "Nom", type: "text", required: true, colSpan: 2 },
          { name: "code", label: "Code", type: "text" },
          { name: "description", label: "Description", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "staff-attendance",
    label: "Présences personnel",
    labelSingular: "présence",
    listPath: "/hr/leave",
    sections: [
      {
        title: "Présence",
        fields: [
          {
            name: "staff_member_id",
            label: "Employé",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          { name: "attendance_date", label: "Date", type: "date", required: true },
          {
            name: "status",
            label: "Statut",
            type: "select",
            required: true,
            options: [
              { value: "present", label: "Présent" },
              { value: "absent", label: "Absent" },
              { value: "late", label: "Retard" },
              { value: "justified", label: "Justifié" },
            ],
          },
          { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "canteen-menus",
    label: "Menus cantine",
    labelSingular: "menu",
    listPath: "/canteen/menus",
    sections: [
      {
        title: "Menu du jour",
        fields: [
          {
            name: "day_of_week",
            label: "Jour",
            type: "select",
            required: true,
            options: [
              { value: "lundi", label: "Lundi" },
              { value: "mardi", label: "Mardi" },
              { value: "mercredi", label: "Mercredi" },
              { value: "jeudi", label: "Jeudi" },
              { value: "vendredi", label: "Vendredi" },
            ],
          },
          { name: "starter", label: "Entrée", type: "text", required: true },
          { name: "main_course", label: "Plat principal", type: "text", required: true },
          { name: "dessert", label: "Dessert", type: "text" },
          { name: "price", label: "Prix (FCFA)", type: "number", required: true },
          { name: "is_active", label: "Actif", type: "checkbox" },
        ],
      },
    ],
  },
  {
    key: "canteen-accounts",
    label: "Comptes cantine",
    labelSingular: "compte cantine",
    listPath: "/canteen/accounts",
    sections: [
      {
        title: "Compte élève",
        fields: [
          {
            name: "student_id",
            label: "Élève",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          {
            name: "status",
            label: "Statut",
            type: "select",
            options: [
              { value: "ACTIVE", label: "Actif" },
              { value: "SUSPENDED", label: "Suspendu" },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "special-diets",
    label: "Régimes spéciaux",
    labelSingular: "régime alimentaire",
    listPath: "/canteen/special-diets",
    sections: [
      {
        title: "Régime / allergie",
        fields: [
          {
            name: "student_id",
            label: "Élève",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          {
            name: "diet_type",
            label: "Type",
            type: "select",
            required: true,
            options: [
              { value: "allergie", label: "Allergie" },
              { value: "intolerance", label: "Intolérance" },
              { value: "religieux", label: "Régime religieux" },
              { value: "medical", label: "Régime médical" },
            ],
          },
          {
            name: "allergens",
            label: "Allergènes / restrictions",
            type: "text",
            required: true,
            colSpan: 2,
          },
          { name: "notes", label: "Notes complémentaires", type: "textarea", colSpan: 2 },
          { name: "is_active", label: "Actif", type: "checkbox" },
        ],
      },
    ],
  },
  {
    key: "fleet",
    label: "Flotte véhicules",
    labelSingular: "véhicule",
    listPath: "/transport/fleet",
    sections: [
      {
        title: "Véhicule",
        fields: [
          { name: "plate_number", label: "Immatriculation", type: "text", required: true },
          { name: "label", label: "Libellé", type: "text", required: true },
          { name: "capacity", label: "Capacité (places)", type: "number" },
          {
            name: "status",
            label: "Statut",
            type: "select",
            options: [
              { value: "ACTIVE", label: "Actif" },
              { value: "MAINTENANCE", label: "Maintenance" },
              { value: "RETIRED", label: "Retiré" },
            ],
          },
          { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "drivers",
    label: "Chauffeurs",
    labelSingular: "chauffeur",
    listPath: "/transport/drivers",
    sections: [
      {
        title: "Chauffeur",
        fields: [
          { name: "first_name", label: "Prénom", type: "text", required: true },
          { name: "last_name", label: "Nom", type: "text", required: true },
          { name: "phone", label: "Téléphone", type: "tel" },
          { name: "email", label: "E-mail", type: "email" },
          { name: "license_number", label: "N° permis", type: "text" },
          {
            name: "status",
            label: "Statut",
            type: "select",
            options: [
              { value: "ACTIVE", label: "Actif" },
              { value: "INACTIVE", label: "Inactif" },
            ],
          },
          { name: "hired_at", label: "Date d'embauche", type: "date" },
        ],
      },
    ],
  },
  {
    key: "transport-routes",
    label: "Itinéraires",
    labelSingular: "itinéraire",
    listPath: "/transport/routes",
    sections: [
      {
        title: "Itinéraire",
        fields: [
          { name: "name", label: "Nom de la ligne", type: "text", required: true, colSpan: 2 },
          { name: "code", label: "Code", type: "text" },
          {
            name: "transport_vehicle_id",
            label: "Véhicule",
            type: "select",
            options: [],
          },
          {
            name: "transport_driver_id",
            label: "Chauffeur",
            type: "select",
            options: [],
          },
          {
            name: "description",
            label: "Description",
            type: "textarea",
            colSpan: 2,
          },
          { name: "is_active", label: "Actif", type: "checkbox" },
          {
            name: "stops_text",
            label: "Arrêts",
            type: "textarea",
            colSpan: 2,
            required: true,
            placeholder: "Un arrêt par ligne : Nom | Adresse | Ordre | HH:MM",
            hint: "Exemple : Cocody | Rue des écoles | 1 | 06:30",
          },
        ],
      },
    ],
  },
  {
    key: "transport-subscriptions",
    label: "Abonnements transport",
    labelSingular: "abonnement",
    listPath: "/transport/subscriptions",
    sections: [
      {
        title: "Abonnement",
        fields: [
          {
            name: "student_id",
            label: "Élève",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "transport_route_id",
            label: "Itinéraire",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "transport_route_stop_id",
            label: "Arrêt",
            type: "select",
            options: [],
          },
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
          },
          { name: "start_date", label: "Début", type: "date", required: true },
          { name: "end_date", label: "Fin", type: "date" },
          { name: "monthly_fee", label: "Tarif mensuel (FCFA)", type: "number" },
          {
            name: "status",
            label: "Statut",
            type: "select",
            options: [
              { value: "ACTIVE", label: "Actif" },
              { value: "SUSPENDED", label: "Suspendu" },
              { value: "CANCELLED", label: "Annulé" },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "supplies",
    label: "Stocks",
    labelSingular: "article",
    listPath: "/inventory/supplies",
    sections: [
      {
        title: "Article en stock",
        fields: [
          { name: "designation", label: "Désignation", type: "text", required: true },
          { name: "category", label: "Catégorie", type: "text", required: true },
          { name: "quantity", label: "Quantité en stock", type: "number" },
          { name: "alert_threshold", label: "Seuil d'alerte", type: "number" },
          {
            name: "unit",
            label: "Unité",
            type: "text",
            placeholder: "Pièce, carton, litre…",
          },
          { name: "supplier", label: "Fournisseur", type: "text" },
          { name: "is_active", label: "Actif", type: "checkbox" },
        ],
      },
    ],
  },
  {
    key: "assets",
    label: "Patrimoine",
    labelSingular: "immobilisation",
    listPath: "/inventory/assets",
    sections: [
      {
        title: "Immobilisation",
        fields: [
          { name: "designation", label: "Désignation", type: "text", required: true },
          { name: "category", label: "Catégorie", type: "text", required: true },
          { name: "serial_number", label: "N° de série / inventaire", type: "text" },
          { name: "acquisition_date", label: "Date d'acquisition", type: "date" },
          { name: "value", label: "Valeur (FCFA)", type: "number" },
          {
            name: "location",
            label: "Localisation",
            type: "text",
            placeholder: "Bâtiment, salle…",
          },
          {
            name: "status",
            label: "Statut",
            type: "select",
            options: [
              { value: "en_service", label: "En service" },
              { value: "maintenance", label: "En maintenance" },
              { value: "reforme", label: "Réformé" },
            ],
          },
          {
            name: "assigned_staff_member_id",
            label: "Personnel assigné",
            type: "select",
            options: [],
          },
          {
            name: "assigned_room_id",
            label: "Salle",
            type: "select",
            options: [],
          },
        ],
      },
    ],
  },
  {
    key: "communication",
    label: "Annonces",
    labelSingular: "annonce",
    listPath: "/communication",
    sections: [
      {
        title: "Annonce",
        fields: [
          { name: "title", label: "Titre", type: "text", required: true, colSpan: 2 },
          { name: "body", label: "Contenu", type: "textarea", colSpan: 2, required: true },
          {
            name: "target_type",
            label: "Cible",
            type: "select",
            required: true,
            options: [
              { value: "INSTITUTION", label: "Tout l'établissement" },
              { value: "PARENTS", label: "Parents" },
              { value: "TEACHERS", label: "Enseignants" },
              { value: "CLASS_GROUP", label: "Classe" },
              { value: "LEVEL", label: "Niveau" },
              { value: "STUDENT", label: "Élève" },
            ],
          },
          {
            name: "target_id",
            label: "Classe / niveau / élève",
            type: "select",
            options: [],
            hint: "Obligatoire pour Classe, Niveau ou Élève",
          },
          { name: "is_pinned", label: "Épinglée", type: "checkbox" },
          {
            name: "publish",
            label: "Publier immédiatement",
            type: "checkbox",
            hint: "Sinon brouillon — publier depuis la liste",
          },
        ],
      },
    ],
  },
  {
    key: "conversations",
    label: "Conversations",
    labelSingular: "conversation",
    listPath: "/communication",
    sections: [
      {
        title: "Nouvelle conversation",
        fields: [
          {
            name: "type",
            label: "Type",
            type: "select",
            required: true,
            options: [
              { value: "PRIVATE", label: "Privée (1 destinataire)" },
              { value: "GROUP", label: "Groupe" },
            ],
          },
          {
            name: "recipient_user_id",
            label: "Destinataire (privée)",
            type: "select",
            options: [],
            hint: "Utilisateur portail (enseignant, parent ou élève)",
          },
          {
            name: "subject",
            label: "Sujet (groupe)",
            type: "text",
            placeholder: "Conseil de classe…",
          },
          {
            name: "participant_user_ids",
            label: "Participants groupe (IDs users, séparés par des virgules)",
            type: "text",
            colSpan: 2,
            placeholder: "10, 15, 22",
            hint: "Au moins 2 IDs utilisateur de l'établissement",
          },
        ],
      },
    ],
  },
  {
    key: "document-categories",
    label: "Catégories de documents",
    labelSingular: "catégorie",
    listPath: "/documents",
    sections: [
      {
        title: "Catégorie",
        fields: [
          { name: "name", label: "Nom", type: "text", required: true },
          { name: "code", label: "Code", type: "text", placeholder: "RH, SCOL…" },
          { name: "description", label: "Description", type: "textarea", colSpan: 2 },
          {
            name: "access_roles",
            label: "Rôles autorisés (virgules)",
            type: "text",
            colSpan: 2,
            placeholder: "ADMIN, DIRECTOR, HR_MANAGER",
            hint: "Vide = tout utilisateur avec documents.view",
          },
          { name: "is_sensitive", label: "Sensible", type: "checkbox" },
          { name: "is_active", label: "Active", type: "checkbox" },
        ],
      },
    ],
  },
  {
    key: "documents",
    label: "Documents",
    labelSingular: "document",
    listPath: "/documents",
    sections: [
      {
        title: "Métadonnées",
        fields: [
          {
            name: "document_category_id",
            label: "Catégorie",
            type: "select",
            required: true,
            options: [],
          },
          { name: "title", label: "Titre", type: "text", required: true, colSpan: 2 },
          { name: "description", label: "Description", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "campuses",
    label: "Campus",
    labelSingular: "campus",
    listPath: "/settings",
    sections: [
      {
        title: "Campus",
        fields: [
          { name: "name", label: "Nom", type: "text", required: true, colSpan: 2 },
          { name: "address", label: "Adresse", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "buildings",
    label: "Bâtiments",
    labelSingular: "bâtiment",
    listPath: "/settings",
    sections: [
      {
        title: "Bâtiment",
        fields: [
          {
            name: "campus_id",
            label: "Campus",
            type: "select",
            required: true,
            options: [],
          },
          { name: "name", label: "Nom", type: "text", required: true },
          { name: "code", label: "Code", type: "text" },
          { name: "floors", label: "Étages", type: "number" },
        ],
      },
    ],
  },
  {
    key: "academic-years",
    label: "Années scolaires",
    labelSingular: "année scolaire",
    listPath: "/academic/structure",
    sections: [
      {
        title: "Année",
        fields: [
          { name: "name", label: "Libellé", type: "text", required: true, placeholder: "2025-2026" },
          { name: "start_date", label: "Début", type: "date", required: true },
          { name: "end_date", label: "Fin", type: "date", required: true },
        ],
      },
    ],
  },
  {
    key: "academic-periods",
    label: "Périodes",
    labelSingular: "période",
    listPath: "/academic/structure",
    sections: [
      {
        title: "Période",
        fields: [
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
          },
          { name: "name", label: "Nom", type: "text", required: true, placeholder: "Trimestre 1" },
          {
            name: "type",
            label: "Type",
            type: "select",
            options: [
              { value: "trimester", label: "Trimestre" },
              { value: "semester", label: "Semestre" },
            ],
          },
          { name: "start_date", label: "Début", type: "date", required: true },
          { name: "end_date", label: "Fin", type: "date", required: true },
          { name: "sort_order", label: "Ordre", type: "number" },
        ],
      },
    ],
  },
  {
    key: "academic-holidays",
    label: "Vacances",
    labelSingular: "période de vacances",
    listPath: "/academic/structure",
    sections: [
      {
        title: "Vacances",
        fields: [
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
          },
          { name: "name", label: "Nom", type: "text", required: true },
          { name: "start_date", label: "Début", type: "date", required: true },
          { name: "end_date", label: "Fin", type: "date", required: true },
        ],
      },
    ],
  },
  {
    key: "levels",
    label: "Niveaux",
    labelSingular: "niveau",
    listPath: "/academic/structure",
    sections: [
      {
        title: "Niveau",
        fields: [
          { name: "name", label: "Nom", type: "text", required: true, placeholder: "6ème" },
          { name: "code", label: "Code", type: "text", placeholder: "6E" },
          { name: "sort_order", label: "Ordre", type: "number" },
        ],
      },
    ],
  },
  {
    key: "series",
    label: "Séries",
    labelSingular: "série",
    listPath: "/academic/structure",
    sections: [
      {
        title: "Série",
        fields: [
          {
            name: "level_id",
            label: "Niveau",
            type: "select",
            required: true,
            options: [],
          },
          { name: "name", label: "Nom", type: "text", required: true, placeholder: "A" },
          { name: "code", label: "Code", type: "text" },
        ],
      },
    ],
  },
  {
    key: "class-subjects",
    label: "Matières × classes",
    labelSingular: "affectation matière",
    listPath: "/academic/structure",
    sections: [
      {
        title: "Affectation",
        fields: [
          {
            name: "class_group_id",
            label: "Classe",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "subject_id",
            label: "Matière",
            type: "select",
            required: true,
            options: [],
          },
          { name: "coefficient", label: "Coefficient", type: "number" },
        ],
      },
    ],
  },
  {
    key: "fee-categories",
    label: "Catégories de frais",
    labelSingular: "catégorie de frais",
    listPath: "/finance/fees",
    sections: [
      {
        title: "Catégorie",
        fields: [
          { name: "name", label: "Nom", type: "text", required: true },
          { name: "code", label: "Code", type: "text" },
          { name: "description", label: "Description", type: "textarea", colSpan: 2 },
          { name: "is_active", label: "Active", type: "checkbox" },
        ],
      },
    ],
  },
  {
    key: "fee-structures",
    label: "Structures tarifaires",
    labelSingular: "structure tarifaire",
    listPath: "/finance/fees",
    sections: [
      {
        title: "Structure",
        fields: [
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "level_id",
            label: "Niveau",
            type: "select",
            options: [],
          },
          { name: "name", label: "Nom", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea", colSpan: 2 },
          { name: "is_active", label: "Active", type: "checkbox" },
        ],
      },
    ],
  },
  {
    key: "fee-items",
    label: "Lignes tarifaires",
    labelSingular: "ligne tarifaire",
    listPath: "/finance/fees",
    sections: [
      {
        title: "Ligne",
        fields: [
          {
            name: "fee_structure_id",
            label: "Structure",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "fee_category_id",
            label: "Catégorie",
            type: "select",
            required: true,
            options: [],
          },
          { name: "label", label: "Libellé", type: "text", required: true },
          { name: "amount", label: "Montant (FCFA)", type: "number", required: true },
          { name: "is_mandatory", label: "Obligatoire", type: "checkbox" },
          { name: "sort_order", label: "Ordre", type: "number" },
        ],
      },
    ],
  },
  {
    key: "cash-registers",
    label: "Caisses",
    labelSingular: "caisse",
    listPath: "/finance/cash",
    sections: [
      {
        title: "Caisse",
        fields: [
          { name: "name", label: "Nom", type: "text", required: true },
          { name: "code", label: "Code", type: "text" },
          { name: "opening_balance", label: "Solde d'ouverture", type: "number" },
          { name: "is_active", label: "Active", type: "checkbox" },
        ],
      },
    ],
  },
  {
    key: "cash-transactions",
    label: "Mouvements de caisse",
    labelSingular: "mouvement",
    listPath: "/finance/cash",
    sections: [
      {
        title: "Mouvement",
        fields: [
          {
            name: "cash_register_id",
            label: "Caisse",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "type",
            label: "Type",
            type: "select",
            required: true,
            options: [
              { value: "INCOME", label: "Recette" },
              { value: "EXPENSE", label: "Dépense" },
              { value: "TRANSFER", label: "Transfert" },
              { value: "ADJUSTMENT", label: "Ajustement" },
            ],
          },
          {
            name: "direction",
            label: "Direction",
            type: "select",
            required: true,
            options: [
              { value: "IN", label: "Entrée" },
              { value: "OUT", label: "Sortie" },
            ],
          },
          { name: "amount", label: "Montant (FCFA)", type: "number", required: true },
          { name: "description", label: "Description", type: "text", required: true, colSpan: 2 },
          { name: "transaction_date", label: "Date", type: "date", required: true },
        ],
      },
    ],
  },
  {
    key: "re-enrollments",
    label: "Réinscriptions",
    labelSingular: "réinscription",
    listPath: "/enrollment",
    sections: [
      {
        title: "Réinscription",
        fields: [
          {
            name: "student_id",
            label: "Élève",
            type: "select",
            required: true,
            options: [],
            colSpan: 2,
          },
          {
            name: "academic_year_id",
            label: "Année scolaire",
            type: "select",
            required: true,
            options: [],
          },
          {
            name: "previous_class_group_id",
            label: "Classe précédente",
            type: "select",
            options: [],
          },
          {
            name: "new_class_group_id",
            label: "Nouvelle classe",
            type: "select",
            options: [],
          },
          { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
        ],
      },
    ],
  },
  {
    key: "rooms",
    label: "Salles",
    labelSingular: "salle",
    listPath: "/settings",
    sections: [
      {
        title: "Salle",
        fields: [
          {
            name: "building_id",
            label: "Bâtiment",
            type: "select",
            required: true,
            options: [],
          },
          { name: "name", label: "Nom", type: "text", required: true },
          { name: "code", label: "Code", type: "text" },
          { name: "capacity", label: "Capacité", type: "number" },
          {
            name: "type",
            label: "Type",
            type: "text",
            placeholder: "classroom, lab…",
          },
        ],
      },
    ],
  },
];

export const CRUD_RESOURCE_MAP = Object.fromEntries(
  CRUD_RESOURCES.map((r) => [r.key, r])
) as Record<string, CrudResourceConfig>;

export function getCrudResource(key: string): CrudResourceConfig | undefined {
  return CRUD_RESOURCE_MAP[key];
}

export function getAllCrudResourceKeys(): string[] {
  return CRUD_RESOURCES.map((r) => r.key);
}
