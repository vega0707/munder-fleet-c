# PRODUCT_SPEC — Munder Fleet（Strategy C · 干净重写）

> **定位：** 用纯 Munder 重写「分布式 Fleet」能力——不 fork Aion/Multica，协议与产品一次做对。  
> **本仓 = 完整产品**（Electron 办公楼 + Hive + Fleet）。  
> **无双模式：** 节点数 ≥ 1，同一 PROTOCOL；本机开箱即用，多机不换协议。

## 愿景

一个人或一支队伍，用 **Munder** 办公楼/看板驾驭本机及多机上的真实 coding CLI agent：派活、接活、拍板、回传。本地开箱；多机只加节点，不换语义。

## 产品边界（硬约束）

| 约束 | 说明 |
|------|------|
| 纯 Munder 重写 | 实现自研；能力对拍矩阵，不拷上游源码 |
| 单一 Fleet 协议 | 节点数 ≥ 1；无 `solo\|distributed` 双产品/双协议 |
| 本机优先验收 | P0/日常以「一台电脑」为准；多机为同协议扩展 |
| Munder 壳 | 表现层 = 本仓办公楼/看板 |
| assignee 看板 | Task 以 `assignee` 为「谁做」；`todo\|doing\|blocked\|done` |
| PendingDecision 硬闸 | 未解不得继续工具调用 |

## 非目标

- fork/vendor Aion 或 Multica 源码
- 公有云代跑密钥与代码（默认）
- AionUi/Multica UI 替换本仓壳
- `solo|distributed` 双模式
- 「本仓只做规格、实现推到别的仓」

## 验收故事（本机 · 必过）

启动 → 本机 runtime → 派卡 → claim → 待定硬闸 → 人拍板 → 完成回传。

## 验收故事（多机 · 同协议）

两台机器各注册 runtime；角色只解自己的 PendingDecision；只读可见对方进行中任务。协议字段与本机相同。

实现：`src/main/fleet/*` + 既有 Hive/办公楼；契约：`spikes/`、`oracle/`。
