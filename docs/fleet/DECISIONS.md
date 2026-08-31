# DECISIONS — Strategy C

## 2026-08-31 — 零上游源码合入

对齐靠矩阵与协议，不靠 fork Aion/Multica。

## 2026-08-31 — 规格权威

Fleet 行为以 `docs/fleet/PRODUCT_SPEC.md` / `PROTOCOL.md` 为准。

## 2026-08-31 — Strategy C = 纯 Munder 分布式干净重写

**决定：** 本仓走「最干净」路线——用纯 Munder 重写分布式 Fleet（runtime 注册、claim、硬闸、编排），能力对齐 A/B 所对拍的上游清单，但实现零上游源码。  
**不是**「收成纯单机玩具」：本机是默认部署与 P0 验收面；多机是同一 PROTOCOL 的节点扩展。

## 2026-08-31 — 本仓即完整产品（Munder 合入）

将 munder 应用树合入本仓，本仓交付完整 Electron + Hive + Fleet。  
撤销「本仓只做规格、实现推回 munder-difflin」。

## 2026-08-31 — 纠正「只做单机」误读

曾误把用户「单机优先 / Munder 产品形态」理解成「永久不做多机」。  
**作废**该误读。正确约束是：**无双模式**（一套协议，N≥1），不是「禁止多机」。

## 2026-08-31 — A/B 回归 oracle

`oracle/` 继续给姊妹策略仓对拍。
