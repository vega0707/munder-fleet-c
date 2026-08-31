# PROTOCOL — 本机 Fleet wire（JSON Schema 级）

> 单机；节点数 = 1。无分布式双模式。字段权威同下（与历史草案兼容，删去多机叙事）。


## 原则

- 本机单一协议；仅本地 runtime
- `Task.assignee` 为权威「谁做」
- `PendingDecision.ownerId` 为权威「谁拍板」
- 冲突 claim → HTTP 409（或等价 `code: "claim_conflict"`）
- 不复制 Multica/Aion 私有帧


## 公共定义

```json
{
  "$id": "https://munder.local/fleet/defs.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$defs": {
    "id": {
      "type": "string",
      "minLength": 1,
      "pattern": "^[a-z]+_[A-Za-z0-9_-]+$"
    },
    "iso8601": {
      "type": "string",
      "format": "date-time"
    },
    "error": {
      "type": "object",
      "additionalProperties": false,
      "required": ["code", "message"],
      "properties": {
        "code": {
          "type": "string",
          "enum": [
            "claim_conflict",
            "not_found",
            "invalid",
            "hard_gate",
            "unauthorized"
          ]
        },
        "message": { "type": "string" }
      }
    }
  }
}
```

---

## Runtime

### Schema

```json
{
  "$id": "https://munder.local/fleet/runtime.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id",
    "ownerUserId",
    "hostLabel",
    "clis",
    "lastHeartbeatAt",
    "status"
  ],
  "properties": {
    "id": { "type": "string", "pattern": "^rt_" },
    "ownerUserId": { "type": "string", "pattern": "^user_" },
    "hostLabel": { "type": "string", "minLength": 1 },
    "clis": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 },
      "uniqueItems": true
    },
    "lastHeartbeatAt": { "type": "string", "format": "date-time" },
    "status": { "type": "string", "enum": ["online", "offline"] },
    "maxConcurrentClaims": {
      "type": "integer",
      "minimum": 1,
      "default": 1
    }
  }
}
```

### 操作

| 方法 | 路径 | 请求 | 成功 | 失败 |
|------|------|------|------|------|
| `POST` | `/runtimes` | RegisterRuntime | `201` Runtime | `400` invalid |
| `POST` | `/runtimes/{id}/heartbeat` | `{}` 或空 body | `200` Runtime（刷新 `lastHeartbeatAt`，`status=online`） | `404` |
| `GET` | `/runtimes/{id}` | — | `200` Runtime | `404` |

### RegisterRuntime 请求

```json
{
  "$id": "https://munder.local/fleet/register-runtime.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["ownerUserId", "hostLabel", "clis"],
  "properties": {
    "ownerUserId": { "type": "string", "pattern": "^user_" },
    "hostLabel": { "type": "string", "minLength": 1 },
    "clis": {
      "type": "array",
      "minItems": 1,
      "items": { "type": "string", "minLength": 1 }
    },
    "maxConcurrentClaims": { "type": "integer", "minimum": 1 }
  }
}
```

Heartbeat 建议间隔：**15s** 量级。实现可将超过 `3 × 间隔` 未心跳的 runtime 标为 `offline`。

---

## Task（兼容 Munder HiveTask 语义）

### Schema

```json
{
  "$id": "https://munder.local/fleet/task.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id",
    "projectId",
    "title",
    "assignee",
    "status",
    "claimedByRuntimeId",
    "result"
  ],
  "properties": {
    "id": { "type": "string", "pattern": "^task_" },
    "projectId": { "type": "string", "pattern": "^proj_" },
    "title": { "type": "string", "minLength": 1 },
    "assignee": { "type": "string", "minLength": 1 },
    "status": {
      "type": "string",
      "enum": ["todo", "doing", "blocked", "done"]
    },
    "claimedByRuntimeId": {
      "anyOf": [
        { "type": "null" },
        { "type": "string", "pattern": "^rt_" }
      ]
    },
    "result": {
      "anyOf": [
        { "type": "null" },
        {
          "type": "object",
          "required": ["summary"],
          "properties": {
            "summary": { "type": "string" },
            "artifacts": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        }
      ]
    }
  }
}
```

### 操作

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/projects/{projectId}/tasks` | 创建；默认 `status=todo`，`claimedByRuntimeId=null`，`result=null` |
| `GET` | `/projects/{projectId}/tasks` | 列表（含进行中只读可见） |
| `POST` | `/tasks/{id}/complete` | body `{ "result": { "summary": "..." } }` → `status=done` |

状态迁移（P0）：

- `todo` → `doing`：仅经由成功 Claim  
- `doing` → `blocked`：存在未解 PendingDecision 时可标 blocked（实现可选自动）  
- `doing|blocked` → `done`：complete  
- 禁止跳过 claim 直接 `doing`

---

## Claim

### 请求

```json
{
  "$id": "https://munder.local/fleet/claim-request.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["taskId"],
  "properties": {
    "taskId": { "type": "string", "pattern": "^task_" }
  }
}
```

### 操作

| 方法 | 路径 | 成功 | 失败 |
|------|------|------|------|
| `POST` | `/runtimes/{id}/claims` | `200` Task（`claimedByRuntimeId` 已设，`status=doing`） | `404` runtime/task；`409` claim_conflict；`400` 若 task 非 `todo` 或已有 claim |

**原子性：** 同一 `taskId` 在任意时刻最多被一个 runtime claim。二次 claim → `409` + `error.code = "claim_conflict"`。

**并发上限：** 若 runtime 当前 `doing` 数 ≥ `maxConcurrentClaims`，拒绝新 claim（`409` 或 `400`，推荐 `code: "claim_conflict"` 并在 message 标明上限）。

---

## PendingDecision

### Schema

```json
{
  "$id": "https://munder.local/fleet/pending-decision.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id",
    "projectId",
    "taskId",
    "runtimeId",
    "ownerId",
    "kind",
    "prompt",
    "status"
  ],
  "properties": {
    "id": { "type": "string", "pattern": "^pd_" },
    "projectId": { "type": "string", "pattern": "^proj_" },
    "taskId": { "type": "string", "pattern": "^task_" },
    "runtimeId": { "type": "string", "pattern": "^rt_" },
    "ownerId": { "type": "string", "pattern": "^user_" },
    "kind": {
      "type": "string",
      "enum": [
        "tool_permission",
        "clarification",
        "destructive",
        "brainstorm"
      ]
    },
    "prompt": { "type": "string", "minLength": 1 },
    "status": {
      "type": "string",
      "enum": ["pending", "resolved", "rejected"]
    },
    "resolution": {
      "anyOf": [
        { "type": "null" },
        { "type": "string" }
      ]
    }
  }
}
```

### 硬闸规则

- 对给定 `taskId`，若存在任意 `status=pending` 的 PendingDecision，则该 task 绑定 runtime **不得**发起新的工具调用（返回 `403` + `code: "hard_gate"`）。
- 仅 `ownerId`（或同权主控）可将决策置为 `resolved` / `rejected`。

### 操作

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/tasks/{taskId}/pending-decisions` | 创建，默认 `pending` |
| `POST` | `/pending-decisions/{id}/resolve` | body `{ "status": "resolved\|rejected", "resolution"?: string }` |
| `GET` | `/projects/{projectId}/pending-decisions` | 待定列表 |

---

## 非目标报文

不在本协议复制 Multica daemon 私有帧或 Aion Team MCP 帧。上游能力以 `CAPABILITY_MATRIX.md` 映射到自研模块；wire 仅保证上表资源可对拍。
