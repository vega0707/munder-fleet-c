# AGENTS.md — munder-fleet-pure（Strategy C）

1. **定位：** 纯 Munder 实现的 **分布式 Fleet 干净重写**（最干净路线）。本仓是完整产品仓，不是「只写规格」。
2. 不得将 Aion/Multica 源码复制进实现目录（`src/` 等）。
3. 改 Fleet 产品行为先改 `docs/fleet/PRODUCT_SPEC.md` / `PROTOCOL.md`。
4. `docs/fleet/CAPABILITY_MATRIX.md` 每行必须可验收。
5. **无双模式：** 同一套协议覆盖节点数 ≥ 1（本机一台 = 1 节点；多机不加第二套协议）。禁止 `solo|distributed` 分叉。
6. 上游只读：`scripts/fetch-refs.sh` → `refs/`（gitignore）。
