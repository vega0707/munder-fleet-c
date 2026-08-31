# DECISIONS — Munder / Strategy C

## 2026-08-31 — 零上游源码合入

对齐靠矩阵与协议，不靠 fork Aion/Multica。

## 2026-08-31 — 规格权威

Fleet 行为以 `docs/fleet/PRODUCT_SPEC.md` / `PROTOCOL.md` 为准。

## 2026-08-31 — 本仓即完整单机 Munder（纠正）

**决定：** 将 munder-difflin **合入本仓**；本仓交付完整单机产品（Electron + Hive + 本地 Fleet）。  
**撤销：** 「产品实现合入 munder-difflin、本仓只做规格」——与「Munder 改成单机项目 / 本仓就是完整 Munder」冲突，作废。

## 2026-08-31 — 只做单机

不做多机分布式产品；PROTOCOL 仅描述本机节点（节点数 = 1）。

## 2026-08-31 — A/B 仍可用 oracle

`oracle/` 继续给姊妹策略仓对拍；不改变本仓作为完整产品的定位。
