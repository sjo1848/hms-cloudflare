import ts from "typescript";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function collectTsxFiles(root) {
  const files = [];
  const visit = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && path.endsWith(".tsx") && !path.endsWith(join("i18n", "index.tsx"))) files.push(path);
    }
  };
  visit(root);
  return files.sort();
}

const files = collectTsxFiles("apps/web/src");
const allowedJsxText = new Set(["HMS", "Elite", "HMS Elite", "Email", "ADR", "RevPAR", "· ADR", "· RevPAR", "HOTEL_DEMO_DB", "HOTEL_SECOND_DB", "×", "☰", "→", "·"]);
const allowedAttributes = new Set(["STANDARD", "18000", "101", "name@hotel.com", "guest@example.com", "+54 9…"]);
const failures = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = node => {
    if (ts.isJsxText(node)) {
      const text = node.getText(ast).replace(/\s+/g, " ").trim();
      if (/[A-Za-zÁÉÍÓÚáéíóúÑñ¿¡]{2}/.test(text) && !allowedJsxText.has(text)) failures.push(`${file}:${ast.getLineAndCharacterOfPosition(node.pos).line + 1}: hardcoded JSX text ${JSON.stringify(text)}`);
    }
    if (ts.isJsxAttribute(node) && ["placeholder", "aria-label", "title"].includes(node.name.getText(ast)) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const text = node.initializer.text;
      if (/[A-Za-zÁÉÍÓÚáéíóúÑñ]{2}/.test(text) && !allowedAttributes.has(text)) failures.push(`${file}:${ast.getLineAndCharacterOfPosition(node.pos).line + 1}: hardcoded visible attribute ${JSON.stringify(text)}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  if (/\$\{?\s*\([^\n]*_cents\s*\/\s*100|\.toFixed\(2\)\s*\}%/.test(source)) failures.push(`${file}: direct presentation formatting outside i18n formatters`);
}

if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(JSON.stringify({ i18nCoverage: "PASS", files: files.length, explicitTechnicalExceptions: [...allowedJsxText, ...allowedAttributes] }));
