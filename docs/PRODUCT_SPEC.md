# PRODUCT_SPEC — Munder Fleet（Strategy C 权威规格 · 已冻结）

> **状态：** P0 冻结。改行为先改本文 + `PROTOCOL.md`，再改实现。  
> **模式：** 唯一协议、唯一产品形态；**无** `solo|distributed` 双模式。

## 愿景

一个人或一支队伍，用 **Munder** 办公楼/看板驾驭本机（及后续多机）上的真实 coding CLI agent：派活、接活、拍板、回传。本地开箱即用；多机不换协议，只换节点数。

## 产品边界（硬约束）

| 约束 | 说明 |
|------|------|
| 单一 Fleet | 全局只有一套 Fleet 语义；节点数 ≥ 1，协议不变 |
| 本地单节点优先 | P0 验收以「仅一台电脑」为准；多机为同一协议的扩展故事 |
| Munder 壳 | 表现层为 Munder 办公楼/看板；不替换为 AionUi/Multica UI |
| assignee 看板 | Task 以 `assignee` 为「谁做」权威；状态机 `todo\|doing\|blocked\|done` |
| PendingDecision 硬闸 | 权限/澄清/破坏性操作未解，runtime **不得**继续工具调用 |
| 零上游源码 | 不对齐靠复制 Aion/Multica 代码；对齐靠矩阵与协议 |

## 非目标

- 公有云代跑密钥与代码（默认）
- 用 AionUi/Multica UI 替换 Munder 表现层
- `solo|distributed` 双协议或双产品模式
- 产品内置穿透（一期文档自备即可）
- 多渠道 Slack 等（见 CAPABILITY_MATRIX 延后行）

## 角色

| 角色 | 职责 |
|------|------|
| 主控人类 | 建项目、看全局看板、解自己的 PendingDecision（本地即全部） |
| Michael（编排者） | 拆活、写 assignee、收完成回传 |
| 角色（如 vega/开发） | 绑定 runtime/CLI；claim；开发中问题问主人 |
| Runtime | 某机器上可用的 CLI 执行器（本机可自动注册） |

## 功能需求（P0 必须可验收）

1. **Task 看板**  
   - 字段与状态见 `PROTOCOL.md` § Task  
   - 全员只读可见进行中任务  
   - 接活按角色 + claim 策略（手动 claim；自动 claim 受并发上限约束）

2. **PendingDecision 硬闸**  
   - kind：`tool_permission | clarification | destructive | brainstorm`  
   - `ownerId` 未将决策置为 `resolved`/`rejected` 前，绑定该 task 的 runtime **禁止**继续工具  
   - 验收：硬闸单测见模块 `decision-gate`

3. **Runtime 注册与 heartbeat**  
   - 本机启动可自动注册一个 runtime  
   - heartbeat 量级 15s；超时标 `offline`  
   - 验收：模块 `runtime-registry`

4. **Claim**  
   - `POST .../claims { taskId }` 原子占用  
   - 冲突返回 409；已 claim 的 task 不可被第二 runtime 占用  
   - 验收：模块 `claim-service` 并发 409

5. **完成回传**  
   - task → `done` 且带 `result`；Michael/编排者可收到完成消息  
   - 验收：模块 `orchestrator`

6. **鉴权（规格锁定，实现可后置）**  
   - 本机 Electron：免鉴权  
   - Web：必鉴权（密码/令牌 + 可选 OAuth 白名单）  
   - 验收：模块 `gateway-auth`（可延后到有 Web 面时；矩阵行须可测）

## 验收故事（本地 · P0 必过）

给定仅一台电脑：

1. 启动 → 自动注册 runtime（`online`）  
2. Michael 派卡到 vega（Task `assignee=vega`，`status=todo`）  
3. vega 侧 runtime claim → `claimedByRuntimeId` 写入，`status=doing`  
4. 遇 ambiguity → 创建 PendingDecision（`status=pending`）；工具调用被硬闸挡住  
5. 人在待定列表拍板 → `resolved`  
6. 继续执行 → 完成 → Task `done` + `result`；Michael 收到回传  

对应 spike：`spikes/single-node-fleet`（内存 Registry + Claim；可不接真实 CLI）。

## 验收故事（多机 · 同协议扩展）

开发机与测试机各注册 runtime；测试角色只解自己的 PendingDecision；开发只读可见测试进行中任务。P0 不要求实现，但协议不得为此分叉。

## 冻结声明

- 本文自标记「已冻结」起为 Strategy C 产品真相来源。  
- 与姊妹仓 A/B 冲突：先改 `DECISIONS.md`，再改本规格，禁止静默漂移。  
- 实现目录禁止拷入 Aion/Multica 源码。
