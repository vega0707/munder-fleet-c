# CAPABILITY_MATRIX

> 每行必须可验收。上游只读：`scripts/fetch-refs.sh` → `refs/`（gitignore）。  
> **禁止**把上游源码拷进实现目录。

| 能力 | Munder 现状 | Aion | Multica | 本仓自研模块名 | 验收 |
|------|-------------|------|---------|----------------|------|
| 办公楼可视化 | ✅ 办公楼壳 | — | — | `shell-munder` | 规格：表现层固定为 Munder；验收=PRODUCT_SPEC 边界表有「Munder 壳」且无 Aion/Multica UI 替换路径 |
| assignee 看板 | ✅ HiveTask | team_tasks 看板 | issues board | `task-board` | 创建 Task 后 `GET /projects/{id}/tasks` 可见；`assignee`+`status` 符合 PROTOCOL；单元/契约测试覆盖四态 |
| God/Lead 编排 | Michael | Lead Agent | squad leader | `orchestrator` | Task `complete` 后编排者可观察到回传（spike：`result.summary` 非空且 status=done） |
| 文件 inbox 协作 | ✅ 单机 | — | — | `inbox-local` | P0：规格允许保留单机实现；验收=无跨节点 inbox 协议需求写入 PROTOCOL（本行不阻塞 P0） |
| Team MCP/工具协作 | — | ✅ team_* MCP | CLI/API | `team-tools` | 契约：工具调用前检查 decision-gate；有 pending 时返回 `hard_gate`（单测） |
| wake/dispatch | Stop hook | ✅ Scheduler | assign→daemon poll | `scheduler` | 规格：claim 拉取语义；验收=`POST /runtimes/{id}/claims` 成功使 task→doing（spike 单测） |
| 远程 Web+鉴权 | 弱 | ✅ | ✅ | `gateway-auth` | 规格锁定：Electron 免 / Web 必；验收=PROTOCOL `unauthorized` 错误码存在 + PRODUCT_SPEC §鉴权条款；实现可后置但契约测试夹具断言 401 形状 |
| Runtime 注册 | — | runtime 状态事件 | ✅ daemon register | `runtime-registry` | `POST /runtimes` → online；heartbeat 刷新 `lastHeartbeatAt`；spike 内存实现单测通过 |
| Claim 任务 | — | — | ✅ claim + 409 语义 | `claim-service` | 同一 task 二次 claim → 409 `claim_conflict`；并发双 claim 仅一胜；spike 单测 |
| Blocker→人 | 弱 | Lead/Inbox 弱对拍 | Inbox/review | `decision-gate` | 存在 `pending` PendingDecision 时工具路径抛/返回 `hard_gate`；resolve 后放行；`spikes/` + `oracle/` 单测 |
| 执行日志 | 部分 | 部分 | ✅ | `run-log` | P0：PROTOCOL 不强制日志资源；验收=本行标注「P1」且无实现依赖阻塞 claim/registry（见下延后策略） |
| 多渠道 Slack 等 | 有 | 有 | 有 | `channels` | **延后**：验收=PRODUCT_SPEC 非目标含「多渠道」且本行无 P0 spike 依赖 |

## 延后策略

- 标注延后 / P1 的行：验收方式为「规格明文排除 + 无 P0 模块依赖」，禁止空验收。
- P0 必交付模块：`runtime-registry`、`claim-service`（spike）；规格层锁定：`task-board`、`orchestrator`、`decision-gate`、`shell-munder`、`gateway-auth` 条款。

## 对拍说明

| 上游概念 | 本仓映射 |
|----------|----------|
| Multica daemon register + heartbeat | `runtime-registry` |
| Multica `POST .../tasks/claim` | `claim-service` |
| Aion team task board / Lead | `task-board` + `orchestrator` |
| Aion team tools / wake | `team-tools` + `scheduler` |
| Munder 办公楼 + HiveTask assignee | `shell-munder` + `task-board` |
