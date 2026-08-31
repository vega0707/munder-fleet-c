# ARCHITECTURE — Strategy C

规格驱动。运行时建议形态与 B 类似（TS daemon），但 **禁止** 依赖上游源码树。

```
docs (PRODUCT_SPEC / PROTOCOL / MATRIX)
  → oracle/          # A/B 可机跑回归契约
  → spikes/          # 内存参考实现
  → munder-difflin   # 产品实现合入仓（见 DECISIONS）
```

- **本仓**：真相来源（规格 + oracle + spike）；不 vendor Aion/Multica。
- **产品实现**：合入 `munder-difflin`，不另起应用仓。
- **协议**：单一 Fleet wire；节点数 ≥ 1。
