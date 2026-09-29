import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SHA = /^[a-f0-9]{40}$/;
const HASH = /^[a-f0-9]{64}$/;
const CLASSIFICATIONS = new Set([
  "MAPPED", "REVIEW_REQUIRED", "CONFLICT", "ORPHAN", "DUPLICATE_OPEN_CASE", "UNSUPPORTED_VALUE",
  "TRACEABLE_SEGMENTS", "TRACEABLE_AGGREGATE_ONLY", "ACCOUNT_MISMATCH", "VOIDED", "ORPHAN_OR_CONFLICT",
]);
const INCREMENT_DISPOSITIONS = new Set(["PASS", "PASS_WITH_CONDITIONS_RESOLVED", "INTERNAL_EVIDENCE_PASS"]);
export const REQUIRED_CRITERIA = [
  "cutover.mapping-edge-corpus", "cutover.duplicate-orphan-unknown", "cutover.synthetic-count-checksum",
  "cutover.two-clean-rehearsals", "cutover.failure-restart-idempotency", "cutover.date-range-inventory-holds",
  "cutover.open-maintenance-uniqueness", "cutover.synthetic-tenant-isolation", "cutover.event-provenance-and-zero-fabrication",
  "cutover.synthetic-post-activation-verification", "cutover.real-data-execution", "bootstrap.synthetic-date-intervals",
  "bootstrap.traceable-room-rate-source-guards", "bootstrap.extra-charge-preservation",
  "bootstrap.partial-full-overpaid-classification-and-partial-activation", "bootstrap.voided-mismatch-held",
  "bootstrap.duplicate-idempotent-replay", "bootstrap.aggregate-only-and-missing-history-held",
  "bootstrap.conflict-duplicate-identities-held", "bootstrap.two-hotel-isolation",
  "bootstrap.shadow-restart-and-activation-rollback", "bootstrap.source-account-drift-aba",
  "bootstrap.partial-stay-exact-preservation", "bootstrap.real-data-execution",
];
export const REQUIRED_VALIDATIONS = [
  "f03-clean-rehearsal-1", "f03-clean-rehearsal-2", "f06-synthetic-bootstrap", "foundation-check",
  "types-check", "web-build", "architecture-budgets", "d1-query-plans", "wrangler-api-dry-run",
  "wrangler-web-dry-run", "wrangler-staging-spa-dry-run", "cf-i03", "cf-i04", "cf-i05", "cf-i06",
  "aggregate-manifest-negative-tests",
];

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(message) {
  throw new Error(`F0.12 aggregate evidence rejected: ${message}`);
}

function assertRepoRelative(filePath) {
  if (typeof filePath !== "string" || !filePath || path.isAbsolute(filePath) || filePath.split(/[\\/]/).includes("..")) {
    fail(`invalid evidence path: ${String(filePath)}`);
  }
  return path.join(REPO_ROOT, filePath);
}

function gitShow(revision, filePath) {
  if (!SHA.test(revision)) fail(`source revision must be a full Git SHA: ${revision}`);
  try {
    return execFileSync("git", ["show", `${revision}:${filePath}`], { cwd: REPO_ROOT, encoding: null, stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    fail(`tracked evidence missing at ${revision}:${filePath}`);
  }
}

async function readEvidenceFile(entry) {
  const absolutePath = assertRepoRelative(entry.path);
  let bytes;
  if (entry.source === "git") {
    bytes = gitShow(entry.revision, entry.path);
  } else if (entry.source === "working_tree") {
    const info = await lstat(absolutePath).catch(() => null);
    if (!info?.isFile() || info.isSymbolicLink()) fail(`evidence is not a regular file: ${entry.path}`);
    bytes = await readFile(absolutePath);
  } else {
    fail(`unsupported evidence source for ${entry.path}`);
  }
  const sha256 = digest(bytes);
  if (!HASH.test(entry.expectedSha256 ?? "") || entry.expectedSha256 !== sha256) {
    fail(`evidence hash mismatch: ${entry.path}`);
  }
  return { path: entry.path, source: entry.source, ...(entry.revision ? { revision: entry.revision } : {}), sha256 };
}

function validateIndex(index) {
  if (!index || index.schemaVersion !== 1 || index.taskId !== "HMS-F0-12-AGGREGATE-EVIDENCE-GATE-001") fail("unsupported input manifest");
  if (!SHA.test(index.sourceRevision ?? "")) fail("sourceRevision must be a full Git SHA");
  if (!Array.isArray(index.increments) || index.increments.length !== 11) fail("expected exactly F0.1 through F0.11");
  const expectedIncrements = Array.from({ length: 11 }, (_, i) => `F0.${i + 1}`);
  for (const [i, increment] of index.increments.entries()) {
    if (increment.id !== expectedIncrements[i] || !increment.artifactRevision || !SHA.test(increment.artifactRevision)) fail(`invalid increment identity/order at ${expectedIncrements[i]}`);
    if (!increment.disposition || !Array.isArray(increment.evidencePaths) || increment.evidencePaths.length === 0) fail(`${increment.id} lacks disposition/evidence references`);
    if (!INCREMENT_DISPOSITIONS.has(increment.disposition)) fail(`${increment.id} has an unaccepted disposition`);
    if (increment.id === "F0.1") {
      if (increment.disposition !== "INTERNAL_EVIDENCE_PASS" || increment.reviewStatus !== "INTERNAL_EVIDENCE_ONLY") fail("F0.1 must remain internal evidence, not a standalone Independent Critic PASS");
    } else if (!(increment.reviewStatus === "PASS" || increment.reviewStatus === "PASS_WITH_CONDITIONS_RESOLVED") || !increment.reviewSummary) {
      fail(`${increment.id} lacks a resolved, explicitly recorded reviewer disposition`);
    }
  }
  if (!Array.isArray(index.evidenceFiles) || !Array.isArray(index.criteria) || !Array.isArray(index.syntheticRecords) || !Array.isArray(index.validations)) fail("missing evidence/crosswalk/records/validation arrays");
  const criterionIds = index.criteria.map(row => row.id);
  if (new Set(criterionIds).size !== criterionIds.length || criterionIds.length !== REQUIRED_CRITERIA.length || REQUIRED_CRITERIA.some(id => !criterionIds.includes(id))) fail("cutover/bootstrap acceptance crosswalk is missing, duplicate or has unexpected criteria");
  const validationIds = index.validations.map(row => row.id);
  if (new Set(validationIds).size !== validationIds.length || validationIds.length !== REQUIRED_VALIDATIONS.length || REQUIRED_VALIDATIONS.some(id => !validationIds.includes(id))) fail("required fresh validation receipt set is missing, duplicate or unexpected");
  for (const row of index.criteria) {
    if (!["PROVEN", "UNPROVEN", "NOT_APPLICABLE"].includes(row.status)) fail(`invalid criterion status: ${row.id}`);
    if (!row.id || (row.status === "NOT_APPLICABLE" && !row.rationale)) fail(`criterion needs id/rationale: ${row.id}`);
    if (row.status === "PROVEN" && (!Array.isArray(row.evidencePaths) || row.evidencePaths.length === 0)) fail(`PROVEN criterion lacks evidence: ${row.id}`);
  }
  const syntheticIds = new Set();
  for (const record of index.syntheticRecords) {
    if (record.dataClass !== "SYNTHETIC_TEST_ASSERTION" || record.liveData === true || !CLASSIFICATIONS.has(record.classification)) fail(`invalid/non-synthetic record ${record.id}`);
    if (!record.id || syntheticIds.has(record.id)) fail(`missing or duplicate synthetic record id: ${record.id}`);
    syntheticIds.add(record.id);
    if (record.disposition === "ACTIVATION_CANDIDATE" && record.classification !== "TRACEABLE_SEGMENTS") fail(`non-traceable record cannot be an activation candidate: ${record.id}`);
    if ((record.classification === "REVIEW_REQUIRED" || record.classification === "UNRESOLVED" || record.classification === "HELD" || record.disposition === "HELD") && record.disposition === "ACTIVATION_CANDIDATE") fail(`held/unresolved record cannot be an activation candidate: ${record.id}`);
    if (!Array.isArray(record.evidencePaths) || record.evidencePaths.length === 0) fail(`synthetic record lacks evidence: ${record.id}`);
  }
  for (const validation of index.validations) {
    if (!validation.command || !validation.fixture || !validation.evidencePath || !Number.isInteger(validation.exitCode)) fail(`incomplete validation receipt: ${validation.id}`);
    if (validation.status === "PASS" && validation.exitCode !== 0) fail(`PASS has nonzero exit: ${validation.id}`);
    if (!(["PASS", "FAIL", "UNPROVEN"].includes(validation.status))) fail(`invalid validation state: ${validation.id}`);
  }
  return expectedIncrements;
}

export async function buildAggregateManifest(index, options = {}) {
  validateIndex(index);
  const evidenceReader = options.evidenceReader ?? readEvidenceFile;
  const revisionValidator = options.revisionValidator ?? (revision => {
    if (!SHA.test(revision)) return false;
    try { execFileSync("git", ["cat-file", "-e", `${revision}^{commit}`], { cwd: REPO_ROOT, stdio: "ignore" }); return true; }
    catch { return false; }
  });
  const ancestorValidator = options.ancestorValidator ?? ((revision, ancestor) => {
    try { execFileSync("git", ["merge-base", "--is-ancestor", revision, ancestor], { cwd: REPO_ROOT, stdio: "ignore" }); return true; }
    catch { return false; }
  });
  if (!revisionValidator(index.sourceRevision)) fail("sourceRevision is not present in the repository");
  for (const increment of index.increments) {
    if (!revisionValidator(increment.artifactRevision)) fail(`${increment.id} artifact revision is not present in the repository`);
    if (increment.boundaryRevision && !revisionValidator(increment.boundaryRevision)) fail(`${increment.id} boundary revision is not present in the repository`);
    if (!ancestorValidator(increment.artifactRevision, index.sourceRevision)) fail(`${increment.id} artifact is not an ancestor of sourceRevision`);
    if (increment.boundaryRevision && !ancestorValidator(increment.boundaryRevision, index.sourceRevision)) fail(`${increment.id} boundary is not an ancestor of sourceRevision`);
  }
  const evidence = [];
  const byPath = new Map();
  for (const entry of index.evidenceFiles) {
    const result = await evidenceReader(entry);
    if (byPath.has(result.path)) fail(`duplicate evidence path: ${result.path}`);
    byPath.set(result.path, result);
    evidence.push(result);
  }
  evidence.sort((a, b) => a.path.localeCompare(b.path));
  const evidencePaths = new Set(evidence.map(item => item.path));
  for (const increment of index.increments) {
    for (const ref of increment.evidencePaths) if (!evidencePaths.has(ref)) fail(`${increment.id} refers to un-hashed evidence: ${ref}`);
  }
  for (const row of index.criteria) {
    for (const ref of row.evidencePaths ?? []) if (!evidencePaths.has(ref)) fail(`${row.id} refers to un-hashed evidence: ${ref}`);
  }
  for (const row of index.syntheticRecords) {
    for (const ref of row.evidencePaths) if (!evidencePaths.has(ref)) fail(`${row.id} refers to un-hashed evidence: ${ref}`);
  }
  for (const validation of index.validations) {
    if (!evidencePaths.has(validation.evidencePath)) fail(`${validation.id} refers to un-hashed output: ${validation.evidencePath}`);
  }
  const incrementReady = index.increments.every(item => ["PASS", "PASS_WITH_CONDITIONS_RESOLVED", "INTERNAL_EVIDENCE_PASS"].includes(item.disposition));
  const criteriaReady = index.criteria.every(item => item.status !== "UNPROVEN");
  const validationReady = index.validations.every(item => item.status === "PASS" && item.exitCode === 0);
  const activationCandidates = index.syntheticRecords.filter(item =>
    item.dataClass === "SYNTHETIC_TEST_ASSERTION" &&
    item.classification === "TRACEABLE_SEGMENTS" &&
    item.disposition === "ACTIVATION_CANDIDATE" &&
    item.liveData === false,
  ).map(item => item.id).sort();
  const blockers = [
    ...(!incrementReady ? ["one or more F0.1–F0.11 increments are not closed"] : []),
    ...(!criteriaReady ? index.criteria.filter(item => item.status === "UNPROVEN").map(item => `UNPROVEN:${item.id}`) : []),
    ...(!validationReady ? index.validations.filter(item => item.status !== "PASS" || item.exitCode !== 0).map(item => `VALIDATION:${item.id}:${item.status}:exit-${item.exitCode}`) : []),
  ];
  return {
    schemaVersion: 1,
    taskId: index.taskId,
    sourceRevision: index.sourceRevision,
    inputIndexSha256: options.inputIndexSha256 ?? null,
    dataClass: "SYNTHETIC_EVIDENCE_ONLY",
    liveDataRead: false,
    liveDataMutation: false,
    liveActivationAuthorized: false,
    increments: index.increments.map(({ id, artifactRevision, boundaryRevision = null, disposition, reviewStatus, reviewSummary = null, evidencePaths }) => ({ id, artifactRevision, boundaryRevision, disposition, reviewStatus, reviewSummary, evidencePaths: [...evidencePaths] })),
    cutoverCriteria: index.criteria,
    syntheticRecords: index.syntheticRecords.map(record => ({
      ...record,
      excludedFromActivation: record.classification === "REVIEW_REQUIRED" || record.classification === "UNRESOLVED" || record.classification === "HELD" || record.disposition === "HELD",
    })),
    validationReceipts: index.validations,
    evidenceFiles: evidence,
    syntheticActivationCandidateIds: activationCandidates,
    blockers,
    developmentGateCandidate: blockers.length === 0 ? "PASS_PENDING_INDEPENDENT_CRITIC" : "INCOMPLETE",
    foundation0Complete: false,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf("--input");
  const inputPath = inputIndex >= 0 ? args[inputIndex + 1] : ".orchestration/evidence/HMS-F0-12-AGGREGATE-EVIDENCE-INPUTS.json";
  const outputIndex = args.indexOf("--output");
  const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : null;
  const inputBytes = await readFile(assertRepoRelative(inputPath));
  const input = JSON.parse(inputBytes.toString("utf8"));
  const manifest = await buildAggregateManifest(input, { inputIndexSha256: digest(inputBytes) });
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  if (outputPath) await writeFile(assertRepoRelative(outputPath), serialized, { flag: "wx" });
  else process.stdout.write(serialized);
  if (manifest.developmentGateCandidate === "INCOMPLETE") process.exitCode = 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
