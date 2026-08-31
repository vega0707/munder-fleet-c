/**
 * Minimal JSON Schema subset validator (draft-ish) for Strategy C oracle.
 * No npm deps — A/B can copy this folder or run: node oracle/validate.js
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Fleet } from "../spikes/single-node-fleet/fleet.js";

const root = dirname(fileURLToPath(import.meta.url));

function loadJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

/** @param {any} schema @param {any} data @param {string} path */
function validate(schema, data, path = "$") {
  const errors = [];
  if (schema.anyOf) {
    const ok = schema.anyOf.some((s) => validate(s, data, path).length === 0);
    if (!ok) errors.push(`${path}: no anyOf matched`);
    return errors;
  }
  if (schema.type) {
    const t = typeOf(data);
    if (schema.type === "integer") {
      if (!Number.isInteger(data)) errors.push(`${path}: expected integer`);
    } else if (t !== schema.type) {
      errors.push(`${path}: expected ${schema.type}, got ${t}`);
    }
  }
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push(`${path}: value not in enum`);
  }
  if (schema.pattern && typeof data === "string") {
    if (!new RegExp(schema.pattern).test(data)) {
      errors.push(`${path}: pattern mismatch`);
    }
  }
  if (schema.minLength != null && typeof data === "string") {
    if (data.length < schema.minLength) errors.push(`${path}: minLength`);
  }
  if (schema.minimum != null && typeof data === "number") {
    if (data < schema.minimum) errors.push(`${path}: minimum`);
  }
  if (schema.type === "object" && data && typeof data === "object") {
    for (const key of schema.required ?? []) {
      if (!(key in data)) errors.push(`${path}.${key}: required`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(data)) {
        if (!schema.properties?.[key]) {
          errors.push(`${path}.${key}: additionalProperties`);
        }
      }
    }
    for (const [key, sub] of Object.entries(schema.properties ?? {})) {
      if (key in data) errors.push(...validate(sub, data[key], `${path}.${key}`));
    }
  }
  if (schema.type === "array" && Array.isArray(data)) {
    if (schema.uniqueItems) {
      const s = new Set(data.map((x) => JSON.stringify(x)));
      if (s.size !== data.length) errors.push(`${path}: uniqueItems`);
    }
    if (schema.items) {
      data.forEach((item, i) => {
        errors.push(...validate(schema.items, item, `${path}[${i}]`));
      });
    }
  }
  return errors;
}

const schemas = {
  error: loadJson("schemas/error.json"),
  runtime: loadJson("schemas/runtime.json"),
  task: loadJson("schemas/task.json"),
  pending: loadJson("schemas/pending-decision.json"),
};
const golden = loadJson("fixtures/golden.json");

describe("oracle schema fixtures", () => {
  it("accepts golden runtime/task/pending/errors", () => {
    for (const [name, schema, data] of [
      ["runtime", schemas.runtime, golden.validRuntime],
      ["task", schemas.task, golden.validTaskTodo],
      ["pending", schemas.pending, golden.validPending],
      ["error", schemas.error, golden.validErrorHardGate],
      ["error", schemas.error, golden.validErrorClaimConflict],
      ["error", schemas.error, golden.validErrorUnauthorized],
    ]) {
      const errs = validate(schema, data);
      assert.equal(errs.length, 0, `${name}: ${errs.join("; ")}`);
    }
  });

  it("rejects task missing assignee", () => {
    const errs = validate(schemas.task, golden.invalidTaskMissingAssignee);
    assert.ok(errs.length > 0);
  });
});

describe("oracle semantic reference (spike Fleet)", () => {
  it("claim_atomic_409", () => {
    const fleet = new Fleet();
    const a = fleet.registerRuntime({
      ownerUserId: "user_a",
      hostLabel: "a",
      clis: ["claude"],
    });
    const b = fleet.registerRuntime({
      ownerUserId: "user_b",
      hostLabel: "b",
      clis: ["codex"],
    });
    const task = fleet.createTask({
      projectId: "proj_demo",
      title: "x",
      assignee: "vega",
    });
    fleet.claim(a.id, task.id);
    assert.throws(() => fleet.claim(b.id, task.id), (e) => e.code === "claim_conflict");
  });

  it("hard_gate_pending", () => {
    const fleet = new Fleet();
    const rt = fleet.registerRuntime({
      ownerUserId: "user_owner",
      hostLabel: "h",
      clis: ["claude"],
    });
    const task = fleet.createTask({
      projectId: "proj_demo",
      title: "x",
      assignee: "vega",
    });
    fleet.claim(rt.id, task.id);
    fleet.createPendingDecision({
      projectId: "proj_demo",
      taskId: task.id,
      runtimeId: rt.id,
      ownerId: "user_owner",
      kind: "clarification",
      prompt: "?",
    });
    assert.throws(
      () => fleet.invokeTool(task.id, { name: "t" }),
      (e) => e.code === "hard_gate" && e.status === 403,
    );
  });

  it("assignee remains after claim", () => {
    const fleet = new Fleet();
    const rt = fleet.registerRuntime({
      ownerUserId: "user_owner",
      hostLabel: "h",
      clis: ["claude"],
    });
    const task = fleet.createTask({
      projectId: "proj_demo",
      title: "x",
      assignee: "vega",
    });
    const claimed = fleet.claim(rt.id, task.id);
    assert.equal(claimed.assignee, "vega");
    assert.equal(claimed.claimedByRuntimeId, rt.id);
  });
});

export { validate, schemas, golden };
