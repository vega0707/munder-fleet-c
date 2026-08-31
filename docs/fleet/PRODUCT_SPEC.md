# PRODUCT_SPEC — Munder Fleet（单机 · 已冻结）

> **本仓即完整单机 Munder。** 表现层 = 本仓 Electron 办公楼；Fleet = 本机 Runtime/Claim/硬闸。

## 愿景

用本机 **Munder** 办公楼/看板驾驭本机真实 coding CLI agent：派活、接活、拍板、回传。开箱即用，只跑在一台电脑上。

## 产品边界（硬约束）

| 约束 | 说明 |
|------|------|
| 单机 | 仅本机；不做多机分布式产品形态 |
| 单一 Fleet | 本机一套 Fleet 语义；无 `solo\|distributed` 双模式 |
| Munder 壳 | 表现层就是本仓办公楼/看板 |
| assignee 看板 | Task 以 `assignee` 为「谁做」；`todo\|doing\|blocked\|done` |
| PendingDecision 硬闸 | 未解不得继续工具调用 |
| 零上游源码 | 不对齐靠复制 Aion/Multica |

## 非目标

- 多机 / 远程节点编排（产品不做）
- 公有云代跑密钥与代码（默认）
- AionUi/Multica UI
- 双协议
- 另起应用仓或把产品推回 munder-difflin

## 验收故事（本机）

启动 → 自动/确保本机 runtime → Michael 派卡 → claim → 待定硬闸 → 人拍板 → 完成回传。

实现：`src/main/fleet/*` + 既有 Hive/办公楼 UI；契约：`spikes/`、`oracle/`。
