/**
 * Local single-node Fleet (Strategy C PROTOCOL).
 * Runtime registry + claim + decision-gate — no multi-node / no dual mode.
 */

function nowIso(): string {
  return new Date().toISOString()
}

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
}

export class FleetError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'FleetError'
    this.code = code
    this.status = status
  }
}

export type Runtime = {
  id: string
  ownerUserId: string
  hostLabel: string
  clis: string[]
  lastHeartbeatAt: string
  status: 'online' | 'offline'
  maxConcurrentClaims: number
}

export type Task = {
  id: string
  projectId: string
  title: string
  assignee: string
  status: 'todo' | 'doing' | 'blocked' | 'done'
  claimedByRuntimeId: string | null
  result: { summary: string; artifacts?: string[] } | null
}

export type PendingDecision = {
  id: string
  projectId: string
  taskId: string
  runtimeId: string
  ownerId: string
  kind: 'tool_permission' | 'clarification' | 'destructive' | 'brainstorm'
  prompt: string
  status: 'pending' | 'resolved' | 'rejected'
  resolution: string | null
}

export class Fleet {
  private runtimes = new Map<string, Runtime>()
  private tasks = new Map<string, Task>()
  private pendingDecisions = new Map<string, PendingDecision>()
  private _orchestratorInbox: { taskId: string; summary: string; at: string }[] = []

  registerRuntime(input: {
    ownerUserId: string
    hostLabel: string
    clis: string[]
    maxConcurrentClaims?: number
  }): Runtime {
    if (!input?.ownerUserId || !input?.hostLabel || !input?.clis?.length) {
      throw new FleetError('invalid', 'ownerUserId, hostLabel, clis required', 400)
    }
    const rt: Runtime = {
      id: newId('rt'),
      ownerUserId: input.ownerUserId,
      hostLabel: input.hostLabel,
      clis: [...input.clis],
      lastHeartbeatAt: nowIso(),
      status: 'online',
      maxConcurrentClaims: input.maxConcurrentClaims ?? 1
    }
    this.runtimes.set(rt.id, rt)
    return { ...rt, clis: [...rt.clis] }
  }

  getRuntime(id: string): Runtime {
    const rt = this.runtimes.get(id)
    if (!rt) throw new FleetError('not_found', `runtime ${id}`, 404)
    return { ...rt, clis: [...rt.clis] }
  }

  listRuntimes(): Runtime[] {
    return [...this.runtimes.values()].map((rt) => this.getRuntime(rt.id))
  }

  /** Idempotent local bootstrap: reuse first online runtime or register one. */
  ensureLocalRuntime(input?: {
    ownerUserId?: string
    hostLabel?: string
    clis?: string[]
  }): Runtime {
    const existing = this.listRuntimes().find((r) => r.status === 'online')
    if (existing) return existing
    return this.registerRuntime({
      ownerUserId: input?.ownerUserId ?? 'user_local',
      hostLabel: input?.hostLabel ?? 'local',
      clis: input?.clis?.length ? input.clis : ['claude', 'codex', 'cursor']
    })
  }

  heartbeat(id: string): Runtime {
    const rt = this.runtimes.get(id)
    if (!rt) throw new FleetError('not_found', `runtime ${id}`, 404)
    rt.lastHeartbeatAt = nowIso()
    rt.status = 'online'
    return this.getRuntime(id)
  }

  createTask(input: { projectId: string; title: string; assignee: string }): Task {
    if (!input?.projectId || !input?.title || !input?.assignee) {
      throw new FleetError('invalid', 'projectId, title, assignee required', 400)
    }
    const task: Task = {
      id: newId('task'),
      projectId: input.projectId,
      title: input.title,
      assignee: input.assignee,
      status: 'todo',
      claimedByRuntimeId: null,
      result: null
    }
    this.tasks.set(task.id, task)
    return { ...task }
  }

  getTask(id: string): Task {
    const task = this.tasks.get(id)
    if (!task) throw new FleetError('not_found', `task ${id}`, 404)
    return {
      ...task,
      result: task.result ? { ...task.result } : null
    }
  }

  listTasks(projectId: string): Task[] {
    return [...this.tasks.values()]
      .filter((t) => t.projectId === projectId)
      .map((t) => this.getTask(t.id))
  }

  requireAuth(token: string | null | undefined): true {
    if (!token) {
      throw new FleetError('unauthorized', 'auth required for web gateway', 401)
    }
    return true
  }

  createPendingDecision(input: {
    projectId: string
    taskId: string
    runtimeId: string
    ownerId: string
    kind: PendingDecision['kind']
    prompt: string
  }): PendingDecision {
    const task = this.tasks.get(input?.taskId)
    if (!task) throw new FleetError('not_found', `task ${input?.taskId}`, 404)
    if (!this.runtimes.has(input.runtimeId)) {
      throw new FleetError('not_found', `runtime ${input.runtimeId}`, 404)
    }
    const kinds = new Set(['tool_permission', 'clarification', 'destructive', 'brainstorm'])
    if (!kinds.has(input.kind) || !input.prompt || !input.ownerId || !input.projectId) {
      throw new FleetError('invalid', 'pending decision fields invalid', 400)
    }
    const pd: PendingDecision = {
      id: newId('pd'),
      projectId: input.projectId,
      taskId: input.taskId,
      runtimeId: input.runtimeId,
      ownerId: input.ownerId,
      kind: input.kind,
      prompt: input.prompt,
      status: 'pending',
      resolution: null
    }
    this.pendingDecisions.set(pd.id, pd)
    task.status = 'blocked'
    return { ...pd }
  }

  resolvePendingDecision(
    id: string,
    input: { status: 'resolved' | 'rejected'; resolution?: string; actorId: string }
  ): PendingDecision {
    const pd = this.pendingDecisions.get(id)
    if (!pd) throw new FleetError('not_found', `pending-decision ${id}`, 404)
    if (pd.status !== 'pending') {
      throw new FleetError('invalid', `pending-decision ${id} not pending`, 400)
    }
    if (input?.actorId !== pd.ownerId) {
      throw new FleetError('unauthorized', 'only ownerId may resolve', 401)
    }
    if (input.status !== 'resolved' && input.status !== 'rejected') {
      throw new FleetError('invalid', 'status must be resolved|rejected', 400)
    }
    pd.status = input.status
    pd.resolution = input.resolution ?? null
    const task = this.tasks.get(pd.taskId)
    if (task && task.status === 'blocked') {
      const stillPending = [...this.pendingDecisions.values()].some(
        (d) => d.taskId === pd.taskId && d.status === 'pending'
      )
      if (!stillPending) task.status = 'doing'
    }
    return { ...pd }
  }

  hasPendingGate(taskId: string): boolean {
    return [...this.pendingDecisions.values()].some(
      (d) => d.taskId === taskId && d.status === 'pending'
    )
  }

  invokeTool(taskId: string, tool: { name: string; args?: object }): { ok: true; name: string; args: object } {
    const task = this.tasks.get(taskId)
    if (!task) throw new FleetError('not_found', `task ${taskId}`, 404)
    if (!tool?.name) throw new FleetError('invalid', 'tool.name required', 400)
    if (this.hasPendingGate(taskId)) {
      throw new FleetError('hard_gate', `task ${taskId} has unresolved PendingDecision`, 403)
    }
    return { ok: true, name: tool.name, args: tool.args ?? {} }
  }

  claim(runtimeId: string, taskId: string): Task {
    const rt = this.runtimes.get(runtimeId)
    if (!rt) throw new FleetError('not_found', `runtime ${runtimeId}`, 404)
    const task = this.tasks.get(taskId)
    if (!task) throw new FleetError('not_found', `task ${taskId}`, 404)

    if (task.claimedByRuntimeId != null || task.status !== 'todo') {
      throw new FleetError('claim_conflict', `task ${taskId} already claimed or not todo`, 409)
    }

    const active = [...this.tasks.values()].filter(
      (t) => t.claimedByRuntimeId === runtimeId && t.status === 'doing'
    ).length
    if (active >= (rt.maxConcurrentClaims ?? 1)) {
      throw new FleetError('claim_conflict', `runtime ${runtimeId} at maxConcurrentClaims`, 409)
    }

    task.claimedByRuntimeId = runtimeId
    task.status = 'doing'
    return this.getTask(taskId)
  }

  complete(taskId: string, result: { summary: string; artifacts?: string[] }): Task {
    const task = this.tasks.get(taskId)
    if (!task) throw new FleetError('not_found', `task ${taskId}`, 404)
    if (!result?.summary) {
      throw new FleetError('invalid', 'result.summary required', 400)
    }
    if (task.status !== 'doing' && task.status !== 'blocked') {
      throw new FleetError('invalid', `task ${taskId} not completable`, 400)
    }
    task.status = 'done'
    task.result = {
      summary: result.summary,
      ...(result.artifacts ? { artifacts: [...result.artifacts] } : {})
    }
    this._orchestratorInbox.push({
      taskId,
      summary: result.summary,
      at: nowIso()
    })
    return this.getTask(taskId)
  }

  orchestratorInbox(): { taskId: string; summary: string; at: string }[] {
    return this._orchestratorInbox.map((x) => ({ ...x }))
  }
}

/** Process-local singleton — single-machine Munder, one Fleet. */
export const localFleet = new Fleet()
