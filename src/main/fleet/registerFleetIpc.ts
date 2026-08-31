import { ipcMain } from 'electron'
import { FleetError, localFleet } from './Fleet'
import { hostname } from 'node:os'

function errPayload(err: unknown): { ok: false; error: { code: string; message: string; status: number } } {
  if (err instanceof FleetError) {
    return { ok: false, error: { code: err.code, message: err.message, status: err.status } }
  }
  const message = err instanceof Error ? err.message : String(err)
  return { ok: false, error: { code: 'invalid', message, status: 400 } }
}

/** Single-machine Fleet IPC — local only, no distributed mode. */
export function registerFleetIpc(): void {
  ipcMain.handle('fleet:ensureLocalRuntime', (_evt, payload: unknown) => {
    try {
      const p = (payload ?? {}) as { ownerUserId?: string; clis?: string[] }
      const rt = localFleet.ensureLocalRuntime({
        ownerUserId: p.ownerUserId,
        hostLabel: hostname() || 'local',
        clis: p.clis
      })
      return { ok: true, runtime: rt }
    } catch (err) {
      return errPayload(err)
    }
  })

  ipcMain.handle('fleet:heartbeat', (_evt, runtimeId: unknown) => {
    try {
      return { ok: true, runtime: localFleet.heartbeat(String(runtimeId)) }
    } catch (err) {
      return errPayload(err)
    }
  })

  ipcMain.handle('fleet:createTask', (_evt, payload: unknown) => {
    try {
      const p = payload as { projectId: string; title: string; assignee: string }
      return { ok: true, task: localFleet.createTask(p) }
    } catch (err) {
      return errPayload(err)
    }
  })

  ipcMain.handle('fleet:listTasks', (_evt, projectId: unknown) => {
    try {
      return { ok: true, tasks: localFleet.listTasks(String(projectId)) }
    } catch (err) {
      return errPayload(err)
    }
  })

  ipcMain.handle('fleet:claim', (_evt, payload: unknown) => {
    try {
      const p = payload as { runtimeId: string; taskId: string }
      return { ok: true, task: localFleet.claim(p.runtimeId, p.taskId) }
    } catch (err) {
      return errPayload(err)
    }
  })

  ipcMain.handle('fleet:createPendingDecision', (_evt, payload: unknown) => {
    try {
      return { ok: true, pending: localFleet.createPendingDecision(payload as never) }
    } catch (err) {
      return errPayload(err)
    }
  })

  ipcMain.handle('fleet:resolvePendingDecision', (_evt, payload: unknown) => {
    try {
      const p = payload as {
        id: string
        status: 'resolved' | 'rejected'
        resolution?: string
        actorId: string
      }
      return {
        ok: true,
        pending: localFleet.resolvePendingDecision(p.id, {
          status: p.status,
          resolution: p.resolution,
          actorId: p.actorId
        })
      }
    } catch (err) {
      return errPayload(err)
    }
  })

  ipcMain.handle('fleet:invokeTool', (_evt, payload: unknown) => {
    try {
      const p = payload as { taskId: string; name: string; args?: object }
      return { ok: true, call: localFleet.invokeTool(p.taskId, { name: p.name, args: p.args }) }
    } catch (err) {
      return errPayload(err)
    }
  })

  ipcMain.handle('fleet:complete', (_evt, payload: unknown) => {
    try {
      const p = payload as { taskId: string; summary: string; artifacts?: string[] }
      return {
        ok: true,
        task: localFleet.complete(p.taskId, { summary: p.summary, artifacts: p.artifacts })
      }
    } catch (err) {
      return errPayload(err)
    }
  })

  ipcMain.handle('fleet:orchestratorInbox', () => {
    return { ok: true, inbox: localFleet.orchestratorInbox() }
  })
}
