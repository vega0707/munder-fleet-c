# HANDOFF — munder-fleet-c

## 定位

本仓是 **规格 + 自研 spike + A/B oracle**，不是 fork 整合车间。A/B 负责「抄/合」；C 负责「就算零上游代码，产品定义也完整」。

## 已完成

1. ✅ 冻结 `PRODUCT_SPEC.md`（单一 Fleet、本地单节点、Munder 壳、assignee 看板、待定硬闸）
2. ✅ 写 `PROTOCOL.md`（JSON Schema 级）
3. ✅ 填 `CAPABILITY_MATRIX.md`（每行可验收）
4. ✅ `spikes/single-node-fleet`：Registry + Claim + decision-gate + task-board（完整本地验收故事）
5. ✅ 合仓决策：产品实现 → `munder-difflin`；本仓保持规格/oracle（见 `DECISIONS.md`）
6. ✅ `oracle/`：给 A/B 的回归契约（`npm test`）

## 不要做

- 不要 git submodule 进 AionCore/Multica 当实现依赖
- 不要双模式
- 不要空口「对齐」——矩阵每行必须有验收
- 不要在本仓另起完整应用取代 munder-difflin

## 与 A/B 协同

- 跑 `oracle/` 作验收门禁（见 `oracle/README.md`）
- A/B 若偏离 C 规格，先改 DECISIONS，再改规格
