import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src/presentation/components/modules");

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith("Content.tsx")) acc.push(p);
  }
  return acc;
}

function parseOpenTag(src, start) {
  let i = start;
  let quote = null;
  while (i < src.length) {
    const c = src[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ">") {
      const raw = src.slice(start, i + 1);
      const selfClosing = /\/\s*>$/.test(raw);
      return { start, end: i + 1, raw, selfClosing };
    }
    i += 1;
  }
  return null;
}

function findMatchingCloseDiv(src, afterOpen) {
  let i = afterOpen;
  let depth = 1;
  let quote = null;
  while (i < src.length) {
    const c = src[i];
    if (quote) {
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      i += 1;
      continue;
    }
    if (src.startsWith("</div>", i)) {
      depth -= 1;
      if (depth === 0) return { start: i, end: i + 6 };
      i += 6;
      continue;
    }
    if (src.startsWith("<div", i) && !/[A-Za-z0-9]/.test(src[i + 4] ?? "")) {
      const tag = parseOpenTag(src, i);
      if (!tag) break;
      if (tag.selfClosing) {
        i = tag.end;
        continue;
      }
      depth += 1;
      i = tag.end;
      continue;
    }
    i += 1;
  }
  return null;
}

function attr(raw, name) {
  const m = raw.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : "";
}

function extraClass(className, token) {
  return className
    .split(/\s+/)
    .filter((c) => c && c !== token && c !== "ui-table-shell" && c !== "ui-table-chrome")
    .join(" ");
}

function replaceTaggedDivs(src, token, component, extraFromClass) {
  const opens = [];
  let i = 0;
  while (i < src.length) {
    const idx = src.indexOf("<div", i);
    if (idx === -1) break;
    const tag = parseOpenTag(src, idx);
    if (!tag) break;
    if (tag.raw.includes(token) && !tag.selfClosing) {
      opens.push(tag);
    }
    i = tag.end;
  }

  let out = src;
  for (let k = opens.length - 1; k >= 0; k -= 1) {
    const tag = opens[k];
    const close = findMatchingCloseDiv(out, tag.end);
    if (!close) {
      console.warn("no close for", token, "at", tag.start);
      continue;
    }
    const className = attr(tag.raw, "className");
    const testId = attr(tag.raw, "data-testid");
    const extra = extraFromClass(className);
    const props = [];
    if (extra) props.push(`className="${extra}"`);
    if (testId) props.push(`testId="${testId}"`);
    const open = props.length ? `<${component} ${props.join(" ")}>` : `<${component}>`;
    out = out.slice(0, close.start) + `</${component}>` + out.slice(close.end);
    out = out.slice(0, tag.start) + open + out.slice(tag.end);
  }
  return out;
}

const SEARCH_RE =
  /<div className="ui-search-field flex-1 min-w-\[[0-9]+px\] h-9 py-0 bg-white border border-outline-variant\/25">\s*<span className="material-symbols-outlined text-on-surface-variant text-\[[0-9]+px\]">\s*search\s*<\/span>\s*<input\s+aria-label=\{?([^}\n]+?)\}?\s+className="ui-search-input ml-sm h-full"\s+onChange=\{(?:\(e\) => ([^}]+)\(e\.target\.value\)|([^}]+))\}\s+placeholder=\{?([^}\n]+?)\}?\s+type="text"\s+value=\{([^}]+)\}\s*\/>\s*<\/div>/g;

function replaceSearch(src) {
  return src.replace(SEARCH_RE, (_m, aria, setFn, onChangeAlt, placeholder, value) => {
    const onChange = setFn
      ? setFn.trim()
      : onChangeAlt?.includes("=>")
        ? onChangeAlt.trim()
        : `(v) => ${onChangeAlt.trim()}`;
    const ariaProp = aria.trim().startsWith('"') || aria.trim().startsWith("`")
      ? aria.trim()
      : `{${aria.trim()}}`;
    const ph = placeholder.trim().startsWith('"') || placeholder.trim().startsWith("`")
      ? placeholder.trim()
      : `{${placeholder.trim()}}`;
    return `<DataTableSearch
            ariaLabel={${ariaProp.replace(/^\{/, "").replace(/\}$/, "") === aria.trim() && !aria.trim().startsWith('"') ? aria.trim() : ariaProp}}
            onChange={${setFn ? setFn.trim() : onChange}}
            placeholder={${ph.replace(/^\{/, "").replace(/\}$/, "") === placeholder.trim() && !placeholder.trim().startsWith('"') ? placeholder.trim() : ph}}
            value={${value.trim()}}
          />`;
  });
}

function addImports(src, names) {
  if (src.includes('from "@/presentation/components/shared/DataTable"')) {
    return src.replace(
      /import \{([^}]+)\} from "@\/presentation\/components\/shared\/DataTable";/,
      (_m, inner) => {
        const existing = inner.split(",").map((s) => s.trim()).filter(Boolean);
        const merged = [...new Set([...existing, ...names])].sort();
        return `import {\n  ${merged.join(",\n  ")},\n} from "@/presentation/components/shared/DataTable";`;
      }
    );
  }
  const stmt = `import {\n  ${names.join(",\n  ")},\n} from "@/presentation/components/shared/DataTable";\n`;
  const marker = 'from "@/presentation/components/shared/DataTablePagination";';
  if (src.includes(marker)) {
    return src.replace(marker, `${marker}\n${stmt}`);
  }
  const lastImport = [...src.matchAll(/^import .+$/gm)].pop();
  if (!lastImport) return stmt + src;
  const idx = lastImport.index + lastImport[0].length;
  return src.slice(0, idx) + "\n" + stmt + src.slice(idx);
}

const files = walk(ROOT);
let count = 0;
for (const file of files) {
  if (file.includes("students_management") || file.includes("teachers_management") || file.includes("parents_management")) {
    continue;
  }
  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("ui-table-shell") && !src.includes("ui-table-chrome")) continue;
  const orig = src;

  src = replaceTaggedDivs(src, "ui-table-shell", "DataTableShell", (cls) =>
    extraClass(cls, "ui-table-shell")
      .split(/\s+/)
      .filter((c) => c && !["flex-1", "flex", "flex-col"].includes(c))
      .join(" ")
  );
  src = replaceTaggedDivs(src, "ui-table-chrome", "DataTableToolbar", (cls) => {
    const extra = extraClass(cls, "ui-table-chrome")
      .replace("border-b-2", "")
      .replace("border-outline-variant/30", "")
      .replace(/\s+/g, " ")
      .trim();
    return extra;
  });

  src = replaceSearch(src);

  src = src.replaceAll(
    'className="ui-input cursor-pointer h-9 py-0 min-w-[9rem] bg-white border border-outline-variant/25"',
    'className={DATA_TABLE_FILTER_CLASS}'
  );
  src = src.replaceAll(
    'className="inline-flex items-center gap-sm h-9 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"',
    "className={DATA_TABLE_CREATE_CLASS}"
  );

  const used = [];
  if (src.includes("<DataTableShell")) used.push("DataTableShell");
  if (src.includes("<DataTableToolbar")) used.push("DataTableToolbar");
  if (src.includes("<DataTableSearch")) used.push("DataTableSearch");
  if (src.includes("DATA_TABLE_FILTER_CLASS")) used.push("DATA_TABLE_FILTER_CLASS");
  if (src.includes("DATA_TABLE_CREATE_CLASS")) used.push("DATA_TABLE_CREATE_CLASS");

  if (used.length && src !== orig) {
    src = addImports(src, used);
  }

  if (src !== orig) {
    fs.writeFileSync(file, src);
    count += 1;
    console.log(path.relative(process.cwd(), file));
  }
}
console.log("updated", count);
