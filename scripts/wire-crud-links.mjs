/**
 * Lie les boutons "Ajouter" et "Modifier" des modules aux pages CRUD.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODULES = path.resolve(__dirname, "../src/presentation/components/modules");

const MODULE_CRUD_MAP = {
  students_management: { resource: "students", createLabel: "AJOUTER UN ÉLÈVE", editIds: ["ELV-2024-001", "ELV-2024-002", "ELV-2024-003"] },
  parents_management: { resource: "parents", createLabel: "AJOUTER UN PARENT", editIds: ["PAR-001", "PAR-002"] },
  teachers_management: { resource: "teachers", createLabel: "AJOUTER UN ENSEIGNANT", editIds: ["ENS-001", "ENS-002"] },
  classes_management: { resource: "classes", createLabel: "NOUVELLE CLASSE", editIds: ["CLS-A", "CLS-B"] },
  subjects_management: { resource: "subjects", createLabel: "AJOUTER UNE MATIÈRE", editIds: ["MATH", "FR"] },
  schedules_management: { resource: "schedules", createLabel: "NOUVEAU CRÉNEAU", editIds: ["CR-1", "CR-2"] },
  assessments_management: { resource: "assessments", createLabel: "NOUVELLE ÉVALUATION", editIds: ["EV-001"] },
  discipline_management: { resource: "discipline", createLabel: "SIGNALER UN INCIDENT", editIds: ["INC-001"] },
  enrollment_management: { resource: "enrollment", createLabel: "NOUVELLE DEMANDE", editIds: ["INS-001"] },
  library_management: { resource: "library", createLabel: "AJOUTER UN OUVRAGE", editIds: ["LIV-001"] },
  payments_management: { resource: "payments", createLabel: "NOUVEAU PAIEMENT", editIds: ["PAY-001"] },
  invoices_management: { resource: "invoices", createLabel: "NOUVELLE FACTURE", editIds: ["FAC-001"] },
  expenses_management: { resource: "expenses", createLabel: "NOUVELLE DÉPENSE", editIds: ["DEP-001"] },
  recruitement_candidatures: { resource: "recruitment", createLabel: "NOUVELLE OFFRE", editIds: ["OFF-001"] },
  gestion_des_cong_s_absences: { resource: "leave", createLabel: "ENREGISTRER UN CONGÉ", editIds: ["CG-001"] },
  gestion_des_menus_cantine: { resource: "canteen-menus", createLabel: "AJOUTER UN MENU", editIds: ["MENU-1"] },
  comptes_rechargements_cantine: { resource: "canteen-accounts", createLabel: "NOUVEAU RECHARGEMENT", editIds: ["CNT-001"] },
  r_gimes_sp_ciaux_allergies: { resource: "special-diets", createLabel: "AJOUTER UN RÉGIME", editIds: ["REG-001"] },
  gestion_de_la_flotte: { resource: "fleet", createLabel: "AJOUTER UN VÉHICULE", editIds: ["VEH-001"] },
  gestion_des_chauffeurs: { resource: "drivers", createLabel: "INSCRIRE UN CHAUFFEUR", editIds: ["DRV-001"] },
  itin_raires_arr_ts: { resource: "transport-routes", createLabel: "NOUVEL ITINÉRAIRE", editIds: ["RT-001"] },
  abonnements_transport: { resource: "transport-subscriptions", createLabel: "NOUVEL ABONNEMENT", editIds: ["ABN-001"] },
  stocks_approvisionnements: { resource: "supplies", createLabel: "AJOUTER UN ARTICLE", editIds: ["STK-001"] },
  inventory_assets: { resource: "assets", createLabel: "AJOUTER UNE IMMOBILISATION", editIds: ["IMM-001"] },
  communication_center: { resource: "communication", createLabel: "NOUVEAU MESSAGE", editIds: [] },
  document_management: { resource: "documents", createLabel: "NOUVEAU DOSSIER", editIds: [] },
};

const IMPORT_LINE = `import { CrudCreateLink, CrudEditLink } from "@/presentation/components/forms/CrudLinks";\n`;

function applyEditLinks(content, cfg) {
  content = content.replace(
    /<button([^>]*title="[^"]*[Ee]dit[^"]*"[^>]*)>\s*<span className="material-symbols-outlined">edit<\/span>\s*<\/button>/g,
    `<CrudEditLink resource="${cfg.resource}" recordId="${cfg.editIds[0] ?? "1"}" />`
  );

  return content.replace(
    /<tr([^>]*)>([\s\S]*?)<\/tr>/g,
    (row, trAttrs, rowBody) => {
      if (!rowBody.includes('aria-label="Modifier')) return row;
      const idMatch = rowBody.match(/<td className="p-md font-mono-data[^"]*">([^<]+)<\/td>/);
      const recordId = idMatch ? idMatch[1].trim() : (cfg.editIds[0] ?? "1");
      const updatedRow = rowBody.replace(
        /<button aria-label="Modifier[^"]*" className="p-xs text-on-surface-variant hover:bg-surface-container-high hover:text-primary rounded transition-colors"><span className="material-symbols-outlined text-\[18px\]">edit<\/span><\/button>/,
        `<CrudEditLink resource="${cfg.resource}" recordId="${recordId}" className="p-xs text-on-surface-variant hover:bg-surface-container-high hover:text-primary rounded transition-colors" />`
      );
      return `<tr${trAttrs}>${updatedRow}</tr>`;
    }
  );
}

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, files);
    else if (e.name.endsWith("Content.tsx")) files.push(full);
  }
  return files;
}

let updated = 0;

for (const [folder, cfg] of Object.entries(MODULE_CRUD_MAP)) {
  const file = path.join(MODULES, folder, fs.readdirSync(path.join(MODULES, folder)).find((f) => f.endsWith("Content.tsx")));
  if (!file || !fs.existsSync(file)) {
    console.log(`⚠ Dossier introuvable: ${folder}`);
    continue;
  }

  let content = fs.readFileSync(file, "utf8");
  if (content.includes("CrudCreateLink")) {
    // Relier uniquement les boutons modifier si pas déjà fait
    if (!content.includes("<CrudEditLink")) {
      content = applyEditLinks(content, cfg);
      fs.writeFileSync(file, content, "utf8");
      console.log(`✓ ${folder} (modifier)`);
      updated++;
    } else {
      console.log(`— ${folder} (déjà lié)`);
    }
    continue;
  }

  const importMatch = content.match(/^import .+;\n/m);
  if (importMatch) {
    const insertAt = content.indexOf(importMatch[0]) + importMatch[0].length;
    content = content.slice(0, insertAt) + IMPORT_LINE + content.slice(insertAt);
  } else {
    content = IMPORT_LINE + content;
  }

  const createPatterns = [
    /<button className="[^"]*bg-primary[^"]*">\s*<span className="material-symbols-outlined[^"]*">add[^<]*<\/span>\s*([^<]+)\s*<\/button>/g,
    /<button className="[^"]*">\s*<span className="material-symbols-outlined[^"]*">add[^<]*<\/span>\s*([^<]+)\s*<\/button>/g,
    /<button className="[^"]*">\s*<span className="material-symbols-outlined[^"]*">person_add[^<]*<\/span>\s*([^<]*)\s*<\/button>/g,
    /<button className="[^"]*">\s*<span className="material-symbols-outlined[^"]*">add_box[^<]*<\/span>\s*([^<]*)\s*<\/button>/g,
  ];

  let replaced = false;
  for (const pattern of createPatterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, () => {
        replaced = true;
        return `<CrudCreateLink resource="${cfg.resource}" label="${cfg.createLabel.trim()}" />`;
      });
      if (replaced) break;
    }
  }

  if (!replaced) {
    content = content.replace(
      /<button([^>]*className="[^"]*bg-primary[^"]*"[^>]*)>\s*([\s\S]*?)<\/button>/,
      `<CrudCreateLink resource="${cfg.resource}" label="${cfg.createLabel.trim()}" />`
    );
  }

  content = applyEditLinks(content, cfg);

  fs.writeFileSync(file, content, "utf8");
  updated++;
  console.log(`✓ ${folder}`);
}

console.log(`\n${updated} module(s) lié(s) aux formulaires CRUD.`);
