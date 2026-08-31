# DECISIONS — Strategy C

## 2026-08-31 — 零上游源码合入

对齐靠矩阵与协议，不靠 fork。

## 2026-08-31 — 本仓以规格为权威

与 A/B 冲突时，先修订本仓规格或写明「A/B 实验豁免」。

## 2026-08-31 — P0 规格冻结

冻结 `PRODUCT_SPEC.md` / `PROTOCOL.md` / `CAPABILITY_MATRIX.md`。  
P0 spike：`spikes/single-node-fleet` 内存 `runtime-registry` + `claim-service`。  
后续改产品行为必须先改规格再改实现。
