/**
 * Spike demo: register → claim → pending hard-gate → resolve → complete.
 * Run: node index.js
 * Test: npm test
 */
import { Fleet } from "./fleet.js";

const fleet = new Fleet();
const rt = fleet.registerRuntime({
  ownerUserId: "user_owner",
  hostLabel: "solo-node",
  clis: ["claude", "codex"],
});
console.log("registered", rt.id, rt.status);

const task = fleet.createTask({
  projectId: "proj_local",
  title: "full acceptance path",
  assignee: "vega",
});
console.log("task", task.id, task.status);

const claimed = fleet.claim(rt.id, task.id);
console.log("claimed", claimed.status, claimed.claimedByRuntimeId);

const pd = fleet.createPendingDecision({
  projectId: "proj_local",
  taskId: task.id,
  runtimeId: rt.id,
  ownerId: "user_owner",
  kind: "clarification",
  prompt: "which approach?",
});
console.log("pending", pd.id, pd.status);

try {
  fleet.invokeTool(task.id, { name: "bash" });
} catch (err) {
  console.log("hard_gate", err.code, err.status);
}

fleet.resolvePendingDecision(pd.id, {
  status: "resolved",
  resolution: "ship A",
  actorId: "user_owner",
});
console.log("resolved", fleet.invokeTool(task.id, { name: "bash" }));

const done = fleet.complete(task.id, { summary: "spike ok" });
console.log("done", done.status, done.result);
console.log("board", fleet.listTasks("proj_local").map((t) => t.status));
console.log("orchestrator inbox", fleet.orchestratorInbox());
