/**
 * Spike demo: register → create task → claim → complete (no CLI).
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
  title: "P0 path",
  assignee: "vega",
});
console.log("task", task.id, task.status);

const claimed = fleet.claim(rt.id, task.id);
console.log("claimed", claimed.status, claimed.claimedByRuntimeId);

const done = fleet.complete(task.id, { summary: "spike ok" });
console.log("done", done.status, done.result);
console.log("orchestrator inbox", fleet.orchestratorInbox());
