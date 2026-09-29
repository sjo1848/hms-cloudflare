import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { buildAggregateManifest, REQUIRED_CRITERIA, REQUIRED_VALIDATIONS } from "./f0-12-aggregate-evidence-manifest.mjs";

const revision = "a".repeat(40);
const testEvidenceReader = async entry => {
  const sha256 = createHash("sha256").update(entry.path).digest("hex");
  if (sha256 !== entry.expectedSha256) throw new Error(`evidence hash mismatch: ${entry.path}`);
  return { path: entry.path, source: entry.source, sha256 };
};
const testOptions = { evidenceReader: testEvidenceReader, revisionValidator: () => true, ancestorValidator: () => true };
function index(criteriaStatus = "PROVEN") {
  const paths = ["evidence/f0.md", "evidence/room.json"];
  return {
    schemaVersion: 1,
    taskId: "HMS-F0-12-AGGREGATE-EVIDENCE-GATE-001",
    sourceRevision: revision,
    increments: Array.from({ length: 11 }, (_, i) => ({
      id: `F0.${i + 1}`, artifactRevision: revision,
      disposition: i === 0 ? "INTERNAL_EVIDENCE_PASS" : "PASS",
      reviewStatus: i === 0 ? "INTERNAL_EVIDENCE_ONLY" : "PASS",
      reviewSummary: i === 0 ? undefined : "synthetic test review fixture",
      evidencePaths: [paths[0]],
    })),
    evidenceFiles: paths.map(path => ({ path, source: "working_tree", expectedSha256: createHash("sha256").update(path).digest("hex") })),
    criteria: REQUIRED_CRITERIA.map(id => ({
      id,
      status: criteriaStatus,
      rationale: criteriaStatus === "NOT_APPLICABLE" ? "synthetic-only test policy" : undefined,
      evidencePaths: criteriaStatus === "PROVEN" ? [paths[0]] : [],
    })),
    syntheticRecords: [
      { id: "ready-room", dataClass: "SYNTHETIC_TEST_ASSERTION", liveData: false, classification: "MAPPED", readiness: "READY_FOR_ARRIVAL", sellability: "SELLABLE", disposition: "MAPPED", evidencePaths: [paths[1]] },
      { id: "unknown-room", dataClass: "SYNTHETIC_TEST_ASSERTION", liveData: false, classification: "REVIEW_REQUIRED", readiness: "UNRESOLVED", sellability: "UNRESOLVED", disposition: "HELD", evidencePaths: [paths[1]] },
    ],
    validations: REQUIRED_VALIDATIONS.map(id => ({ id, command: "node --test", fixture: "synthetic fixture", status: "PASS", exitCode: 0, evidencePath: paths[0] })),
  };
}

describe("F0.12 aggregate evidence manifest", () => {
  it("is deterministic and never treats unresolved synthetic rows as activation candidates", async () => {
    const first = await buildAggregateManifest(index(), testOptions);
    const second = await buildAggregateManifest(index(), testOptions);
    assert.deepEqual(first, second);
    assert.equal(first.developmentGateCandidate, "PASS_PENDING_INDEPENDENT_CRITIC");
    assert.deepEqual(first.syntheticActivationCandidateIds, []);
    assert.equal(first.syntheticRecords.find(row => row.id === "unknown-room").excludedFromActivation, true);
    assert.equal(first.liveActivationAuthorized, false);
    assert.equal(first.foundation0Complete, false);
  });

  it("fails closed when a required evidence file is missing", async () => {
    await assert.rejects(
      buildAggregateManifest(index(), { ...testOptions, evidenceReader: async () => { throw new Error("missing evidence file"); } }),
      /missing evidence file/i,
    );
  });

  it("fails closed when evidence content differs from its pinned SHA-256", async () => {
    const tampered = index();
    tampered.evidenceFiles[0].expectedSha256 = "0".repeat(64);
    await assert.rejects(buildAggregateManifest(tampered, testOptions), /evidence hash mismatch/);
  });

  it("reports incomplete while any required criterion is UNPROVEN", async () => {
    const manifest = await buildAggregateManifest(index("UNPROVEN"), testOptions);
    assert.equal(manifest.developmentGateCandidate, "INCOMPLETE");
    assert.equal(manifest.blockers.length, REQUIRED_CRITERIA.length);
    assert.ok(manifest.blockers.includes("UNPROVEN:cutover.mapping-edge-corpus"));
  });

  it("rejects a non-synthetic row or a false PASS with a nonzero command exit", async () => {
    const badRow = index();
    badRow.syntheticRecords[0].liveData = true;
    await assert.rejects(buildAggregateManifest(badRow, testOptions), /invalid\/non-synthetic/);

    const badCommand = index();
    badCommand.validations[0].exitCode = 1;
    await assert.rejects(buildAggregateManifest(badCommand, testOptions), /PASS has nonzero exit/);
  });

  it("rejects unreviewed increments and prevents claiming a standalone F0.1 critic pass", async () => {
    const noReview = index();
    noReview.increments[2].reviewStatus = "PENDING";
    await assert.rejects(buildAggregateManifest(noReview, testOptions), /lacks a resolved/);

    const f01Misrepresented = index();
    f01Misrepresented.increments[0].disposition = "PASS";
    await assert.rejects(buildAggregateManifest(f01Misrepresented, testOptions), /F0.1 must remain internal/);
  });

  it("fails closed if a held synthetic room is marked as an activation candidate", async () => {
    const heldCandidate = index();
    heldCandidate.syntheticRecords[1].disposition = "ACTIVATION_CANDIDATE";
    await assert.rejects(buildAggregateManifest(heldCandidate, testOptions), /non-traceable record cannot be an activation candidate/);
  });
});
