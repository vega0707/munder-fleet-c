# Oracle — Strategy C 回归真相源（给 A/B）

本目录是 **可机跑的契约**，不是上游源码拷贝。A/B 实现若偏离此处语义，先改本仓 `docs/DECISIONS.md` / `PROTOCOL.md`，再改实现。

## 跑本仓参考实现

```bash
cd oracle && npm test
# 或从仓根：
node --test oracle/validate.js
```

## A/B 怎么用

1. **形状对拍**：用 `schemas/*.json` 校验你们的 Runtime / Task / PendingDecision / error 对象。  
   - 合法样例与非法样例见 `fixtures/golden.json`。
2. **语义对拍**（必过规则，同 `golden.json` → `semanticRules`）：
   - `claim_atomic_409`：同一 task 二次 claim → `code=claim_conflict`
   - `hard_gate_pending`：存在 `pending` 决策时工具调用 → `code=hard_gate`
   - `assignee_authority`：claim 后 `assignee` 不变，只写 `claimedByRuntimeId`
   - `single_protocol`：禁止 `solo|distributed` 双协议
3. **适配方式（任选）**
   - 把你们的 HTTP/IPC 响应映射成 PROTOCOL 对象后，对本目录 `validate()` 跑夹具；或
   - 在 CI 里 submodule/checkout 本仓，跑 `oracle/validate.js` 作门禁（参考实现绑定 spike Fleet）。

## 权威文档

| 文件 | 用途 |
|------|------|
| `docs/PROTOCOL.md` | wire 权威 |
| `docs/PRODUCT_SPEC.md` | 产品边界 |
| `docs/CAPABILITY_MATRIX.md` | 能力→模块→验收 |
| `spikes/single-node-fleet` | 内存参考实现 |

禁止把 Aion/Multica 源码拷进本仓实现目录。
