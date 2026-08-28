import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/features/reception/ReceptionPage.tsx";
const source = readFileSync(path, "utf8");
const billingStart = source.indexOf("\nfunction BillingPanel()");
const exportStart = source.indexOf("\n\nexport function ReceptionPage()");
if (billingStart < 0 || exportStart < 0 || exportStart <= billingStart) throw new Error("Reception split markers not found");

let reception = source.slice(0, billingStart).trimEnd();
reception = reception.replace('import { ApiError, api } from "../../shared/api";', 'import { api } from "../../shared/api";');
const importAnchor = 'import type { Booking, ExtraCharge, Guest, Invoice, Payment, Room } from "../../domain/types";';
if (!reception.includes(importAnchor)) throw new Error("Reception import anchor not found");
reception = reception.replace(importAnchor, `${importAnchor}\nimport { BillingWorkspace } from "../billing/BillingWorkspace";`);
reception += `\n\nexport function ReceptionPage() {\n  return <><Bookings /><BillingWorkspace /></>;\n}\n`;
writeFileSync(path, reception);
console.log("Reception/billing boundary split applied");
