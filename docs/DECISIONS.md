# DECISIONS — Strategy C

## 2026-08-31 — 零上游源码合入

对齐靠矩阵与协议，不靠 fork。

## 2026-08-31 — 本仓以规格为权威

与 A/B 冲突时，先修订本仓规格或写明「A/B 实验豁免」。

## 2026-08-31 — P0 规格冻结

冻结 `PRODUCT_SPEC.md` / `PROTOCOL.md` / `CAPABILITY_MATRIX.md`。  
P0 spike：`spikes/single-node-fleet` 内存 `runtime-registry` + `claim-service`。  
后续改产品行为必须先改规格再改实现。

## 2026-08-31 — 产品实现合入 munder-difflin；本仓不另起应用仓

**决定：** 可运行产品代码合入 [`munder-difflin`](https://github.com/vega0707/munder-difflin)（已有 Munder 壳 / 看板）。  
**本仓（munder-fleet-c）定位不变：** 规格真相源 + `oracle/` 回归契约 + `spikes/` 参考实现。  
**不**新建独立 `munder-fleet` 应用仓，避免双产品首页与规格漂移。

理由：PRODUCT_SPEC 固定「Munder 壳」；合入既有 Munder 仓最短路径满足 `shell-munder` + `task-board`，同时本仓继续给 A/B 当 oracle。

## 2026-08-31 — A/B 回归 oracle

`oracle/` 提供 JSON Schema 夹具 + 语义规则（claim 409、hard_gate、assignee 权威、单一协议）。  
A/B CI 应对拍本目录；偏离先改 DECISIONS/PROTOCOL。
