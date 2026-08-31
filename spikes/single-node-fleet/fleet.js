/**
 * Spike: in-memory single-node fleet (no CLI).
 * Modules: runtime-registry, claim-service, task-board, decision-gate,
 *          orchestrator inbox, gateway-auth error shape.
 */

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export class FleetError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} status
   */
  constructor(code, message, status) {
    super(message);
    this.name = "FleetError";
    this.code = code;
    this.status = status;
  }
}

export class Fleet {
  constructor() {
    /** @type {Map<string, object>} */
    this.runtimes = new Map();
    /** @type {Map<string, object>} */
    this.tasks = new Map();
    /** @type {Map<string, object>} */
    this.pendingDecisions = new Map();
    /** @type {{ taskId: string, summary: string, at: string }[]} */
    this._orchestratorInbox = [];
  }

  /**
   * @param {{ ownerUserId: string, hostLabel: string, clis: string[], maxConcurrentClaims?: number }} input
   */
  registerRuntime(input) {
    if (!input?.ownerUserId || !input?.hostLabel || !input?.clis?.length) {
      throw new FleetError("invalid", "ownerUserId, hostLabel, clis required", 400);
    }
    const rt = {
      id: newId("rt"),
      ownerUserId: input.ownerUserId,
      hostLabel: input.hostLabel,
      clis: [...input.clis],
      lastHeartbeatAt: nowIso(),
      status: "online",
      maxConcurrentClaims: input.maxConcurrentClaims ?? 1,
    };
    this.runtimes.set(rt.id, rt);
    return { ...rt, clis: [...rt.clis] };
  }

  /** @param {string} id */
  getRuntime(id) {
    const rt = this.runtimes.get(id);
    if (!rt) throw new FleetError("not_found", `runtime ${id}`, 404);
    return { ...rt, clis: [...rt.clis] };
  }

  /** @param {string} id */
  heartbeat(id) {
    const rt = this.runtimes.get(id);
    if (!rt) throw new FleetError("not_found", `runtime ${id}`, 404);
    rt.lastHeartbeatAt = nowIso();
    rt.status = "online";
    return this.getRuntime(id);
  }

  /**
   * @param {{ projectId: string, title: string, assignee: string }} input
   */
  createTask(input) {
    if (!input?.projectId || !input?.title || !input?.assignee) {
      throw new FleetError("invalid", "projectId, title, assignee required", 400);
    }
    const task = {
      id: newId("task"),
      projectId: input.projectId,
      title: input.title,
      assignee: input.assignee,
      status: "todo",
      claimedByRuntimeId: null,
      result: null,
    };
    this.tasks.set(task.id, task);
    return { ...task };
  }

  /** @param {string} id */
  getTask(id) {
    const task = this.tasks.get(id);
    if (!task) throw new FleetError("not_found", `task ${id}`, 404);
    return {
      ...task,
      result: task.result ? { ...task.result } : null,
    };
  }

  /** @param {string} projectId */
  listTasks(projectId) {
    return [...this.tasks.values()]
      .filter((t) => t.projectId === projectId)
      .map((t) => this.getTask(t.id));
  }

  /**
   * Web auth gate shape (Electron path skips this).
   * @param {string | null | undefined} token
   */
  requireAuth(token) {
    if (!token) {
      throw new FleetError("unauthorized", "auth required for web gateway", 401);
    }
    return true;
  }

  /**
   * @param {{
   *   projectId: string,
   *   taskId: string,
   *   runtimeId: string,
   *   ownerId: string,
   *   kind: string,
   *   prompt: string
   * }} input
   */
  createPendingDecision(input) {
    const task = this.tasks.get(input?.taskId);
    if (!task) throw new FleetError("not_found", `task ${input?.taskId}`, 404);
    if (!this.runtimes.has(input.runtimeId)) {
      throw new FleetError("not_found", `runtime ${input.runtimeId}`, 404);
    }
    const kinds = new Set([
      "tool_permission",
      "clarification",
      "destructive",
      "brainstorm",
    ]);
    if (!kinds.has(input.kind) || !input.prompt || !input.ownerId || !input.projectId) {
      throw new FleetError("invalid", "pending decision fields invalid", 400);
    }
    const pd = {
      id: newId("pd"),
      projectId: input.projectId,
      taskId: input.taskId,
      runtimeId: input.runtimeId,
      ownerId: input.ownerId,
      kind: input.kind,
      prompt: input.prompt,
      status: "pending",
      resolution: null,
    };
    this.pendingDecisions.set(pd.id, pd);
    task.status = "blocked";
    return { ...pd };
  }

  /**
   * @param {string} id
   * @param {{ status: "resolved"|"rejected", resolution?: string, actorId: string }} input
   */
  resolvePendingDecision(id, input) {
    const pd = this.pendingDecisions.get(id);
    if (!pd) throw new FleetError("not_found", `pending-decision ${id}`, 404);
    if (pd.status !== "pending") {
      throw new FleetError("invalid", `pending-decision ${id} not pending`, 400);
    }
    if (input?.actorId !== pd.ownerId) {
      throw new FleetError("unauthorized", "only ownerId may resolve", 401);
    }
    if (input.status !== "resolved" && input.status !== "rejected") {
      throw new FleetError("invalid", "status must be resolved|rejected", 400);
    }
    pd.status = input.status;
    pd.resolution = input.resolution ?? null;
    const task = this.tasks.get(pd.taskId);
    if (task && task.status === "blocked") {
      const stillPending = [...this.pendingDecisions.values()].some(
        (d) => d.taskId === pd.taskId && d.status === "pending",
      );
      if (!stillPending) task.status = "doing";
    }
    return { ...pd };
  }

  /** @param {string} taskId */
  hasPendingGate(taskId) {
    return [...this.pendingDecisions.values()].some(
      (d) => d.taskId === taskId && d.status === "pending",
    );
  }

  /**
   * Hard gate: pending decisions block tool calls.
   * @param {string} taskId
   * @param {{ name: string, args?: object }} tool
   */
  invokeTool(taskId, tool) {
    const task = this.tasks.get(taskId);
    if (!task) throw new FleetError("not_found", `task ${taskId}`, 404);
    if (!tool?.name) throw new FleetError("invalid", "tool.name required", 400);
    if (this.hasPendingGate(taskId)) {
      throw new FleetError(
        "hard_gate",
        `task ${taskId} has unresolved PendingDecision`,
        403,
      );
    }
    return { ok: true, name: tool.name, args: tool.args ?? {} };
  }

  /**
   * Atomic claim: todo → doing; conflict → 409 claim_conflict
   * @param {string} runtimeId
   * @param {string} taskId
   */
  claim(runtimeId, taskId) {
    const rt = this.runtimes.get(runtimeId);
    if (!rt) throw new FleetError("not_found", `runtime ${runtimeId}`, 404);
    const task = this.tasks.get(taskId);
    if (!task) throw new FleetError("not_found", `task ${taskId}`, 404);

    if (task.claimedByRuntimeId != null || task.status !== "todo") {
      throw new FleetError(
        "claim_conflict",
        `task ${taskId} already claimed or not todo`,
        409,
      );
    }

    const active = [...this.tasks.values()].filter(
      (t) => t.claimedByRuntimeId === runtimeId && t.status === "doing",
    ).length;
    if (active >= (rt.maxConcurrentClaims ?? 1)) {
      throw new FleetError(
        "claim_conflict",
        `runtime ${runtimeId} at maxConcurrentClaims`,
        409,
      );
    }

    task.claimedByRuntimeId = runtimeId;
    task.status = "doing";
    return this.getTask(taskId);
  }

  /**
   * @param {string} taskId
   * @param {{ summary: string, artifacts?: string[] }} result
   */
  complete(taskId, result) {
    const task = this.tasks.get(taskId);
    if (!task) throw new FleetError("not_found", `task ${taskId}`, 404);
    if (!result?.summary) {
      throw new FleetError("invalid", "result.summary required", 400);
    }
    if (task.status !== "doing" && task.status !== "blocked") {
      throw new FleetError("invalid", `task ${taskId} not completable`, 400);
    }
    task.status = "done";
    task.result = {
      summary: result.summary,
      ...(result.artifacts ? { artifacts: [...result.artifacts] } : {}),
    };
    this._orchestratorInbox.push({
      taskId,
      summary: result.summary,
      at: nowIso(),
    });
    return this.getTask(taskId);
  }

  orchestratorInbox() {
    return this._orchestratorInbox.map((x) => ({ ...x }));
  }
}
