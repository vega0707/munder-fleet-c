# HANDOFF — Strategy C（干净重写）

## 定位

**纯 Munder 实现的分布式 Fleet 重写**（策略里说的「最干净」那条）：

- 不拷 Aion/Multica 源码
- 一套 PROTOCOL，节点数 ≥ 1
- 本仓是完整产品（办公楼 UI + Hive + Fleet），不是规格旁路仓

## 已完成

1. ✅ Fleet 规格 / PROTOCOL / 矩阵（`docs/fleet/`）
2. ✅ spike + oracle（claim、硬闸）
3. ✅ 合入 Munder 应用树；`src/main/fleet` IPC
4. ✅ 明确：非「纯单机收口」，而是干净分布式重写（本机 = 1 节点）

## 不要做

- 不要 git submodule 上游当实现依赖
- 不要 `solo|distributed` 双模式
- 不要空口对齐——矩阵每行要有验收
- 不要把产品再拆回「规格仓 + 另一个应用仓」

## 跑起来

```bash
npm install && npm run dev
cd spikes/single-node-fleet && npm test
cd oracle && npm test
```
