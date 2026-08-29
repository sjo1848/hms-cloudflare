import ts from "typescript";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const files = execFileSync("rg", ["--files", "apps/web/src", "-g", "*.tsx", "-g", "!i18n/index.tsx"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
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
