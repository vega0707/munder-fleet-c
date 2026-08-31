/**
 * P0 spike tests: in-memory RuntimeRegistry + ClaimService
 * Run: node --test spikes/single-node-fleet/fleet.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Fleet } from "./fleet.js";

describe("RuntimeRegistry", () => {
  it("registers a runtime as online with heartbeat timestamp", () => {
    const fleet = new Fleet();
    const rt = fleet.registerRuntime({
      ownerUserId: "user_owner",
      hostLabel: "vega-mbp",
      clis: ["claude"],
    });
    assert.match(rt.id, /^rt_/);
    assert.equal(rt.status, "online");
    assert.ok(rt.lastHeartbeatAt);
    assert.deepEqual(rt.clis, ["claude"]);
    assert.equal(fleet.getRuntime(rt.id).id, rt.id);
  });

  it("heartbeat refreshes lastHeartbeatAt and keeps online", () => {
    const fleet = new Fleet();
    const rt = fleet.registerRuntime({
      ownerUserId: "user_owner",
      hostLabel: "vega-mbp",
      clis: ["codex"],
    });
    const before = rt.lastHeartbeatAt;
    const after = fleet.heartbeat(rt.id);
    assert.equal(after.status, "online");
    assert.ok(after.lastHeartbeatAt >= before);
  });
});

describe("ClaimService", () => {
  it("claims a todo task atomically into doing", () => {
    const fleet = new Fleet();
    const rt = fleet.registerRuntime({
      ownerUserId: "user_owner",
      hostLabel: "local",
      clis: ["claude"],
    });
    const task = fleet.createTask({
      projectId: "proj_demo",
      title: "implement claim",
      assignee: "vega",
    });
    assert.equal(task.status, "todo");
    assert.equal(task.claimedByRuntimeId, null);

    const claimed = fleet.claim(rt.id, task.id);
    assert.equal(claimed.status, "doing");
    assert.equal(claimed.claimedByRuntimeId, rt.id);
  });

  it("second claim on same task returns claim_conflict", () => {
    const fleet = new Fleet();
    const rt1 = fleet.registerRuntime({
      ownerUserId: "user_a",
      hostLabel: "a",
      clis: ["claude"],
    });
    const rt2 = fleet.registerRuntime({
      ownerUserId: "user_b",
      hostLabel: "b",
      clis: ["codex"],
    });
    const task = fleet.createTask({
      projectId: "proj_demo",
      title: "only one",
      assignee: "vega",
    });
    fleet.claim(rt1.id, task.id);
    assert.throws(
      () => fleet.claim(rt2.id, task.id),
      (err) => {
        assert.equal(err.code, "claim_conflict");
        assert.equal(err.status, 409);
        return true;
      },
    );
  });

  it("complete writes result and marks done for orchestrator", () => {
    const fleet = new Fleet();
    const rt = fleet.registerRuntime({
      ownerUserId: "user_owner",
      hostLabel: "local",
      clis: ["claude"],
    });
    const task = fleet.createTask({
      projectId: "proj_demo",
      title: "finish",
      assignee: "vega",
    });
    fleet.claim(rt.id, task.id);
    const done = fleet.complete(task.id, { summary: "shipped" });
    assert.equal(done.status, "done");
    assert.equal(done.result.summary, "shipped");
    const inbox = fleet.orchestratorInbox();
    assert.equal(inbox.length, 1);
    assert.equal(inbox[0].taskId, task.id);
  });
});

describe("local acceptance story (no CLI)", () => {
  it("register → assign → claim → complete", () => {
    const fleet = new Fleet();
    const rt = fleet.registerRuntime({
      ownerUserId: "user_owner",
      hostLabel: "solo",
      clis: ["claude", "codex"],
    });
    const task = fleet.createTask({
      projectId: "proj_local",
      title: "P0 path",
      assignee: "vega",
    });
    fleet.claim(rt.id, task.id);
    fleet.complete(task.id, { summary: "ok" });
    assert.equal(fleet.getTask(task.id).status, "done");
  });
});
