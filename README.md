# munder-fleet-c — Strategy C（设计对齐 · 自研实现）

**一句话：** **不合并、不 vendor** Aion/Multica 代码；产品与协议在文档层对齐它们的能力清单，实现全部自研（从 Munder / munder-difflin 长出来）。

适合：法务最保守、要完全自主 IP、或先用文档把产品规格锁死再写。

| | |
|--|--|
| 策略代号 | **C** |
| 姊妹仓（含 [`munder-fleet-d`](../munder-fleet-d)） | [`munder-fleet-a`](../munder-fleet-a) · [`munder-fleet-b`](../munder-fleet-b) |
| 状态 | 规格已冻结 · spike + oracle 可跑 |
| 产品实现合入 | [`munder-difflin`](https://github.com/vega0707/munder-difflin)（见 `docs/DECISIONS.md`） |

## 入口

1. [`docs/HANDOFF.md`](./docs/HANDOFF.md)
2. [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md) · [`docs/PROTOCOL.md`](./docs/PROTOCOL.md)
3. [`docs/CAPABILITY_MATRIX.md`](./docs/CAPABILITY_MATRIX.md)
4. [`spikes/single-node-fleet`](./spikes/single-node-fleet) — 内存参考实现
5. [`oracle/`](./oracle) — A/B 回归契约
6. **禁止**把上游源码拷进本仓实现目录

## 成功标准

- [x] PRODUCT_SPEC 无 TBD 开放需求
- [x] PROTOCOL 定义 Runtime/Claim/PendingDecision/Task（JSON Schema 级）
- [x] CAPABILITY_MATRIX 每行有自研验收方式
- [x] spike：register + claim + hard_gate + complete
- [x] 合仓决策写入 DECISIONS
- [x] oracle 可机跑（`cd oracle && npm test`）

## 本地命令

```bash
cd spikes/single-node-fleet && npm test && node index.js
cd oracle && npm test
```

## 许可

只读上游；实现自有。产品名 Munder。Multica/Aion 仅出现在「对齐说明」。
