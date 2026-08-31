# AGENTS.md — Munder（单机完整产品）

1. **本仓就是完整单机 Munder**（Electron 办公楼 + Hive + 本地 Fleet）。不是「只写规格再推到别的仓」。
2. 不得将 Aion/Multica 源码复制进实现目录（`src/` 等）。
3. 改 Fleet 产品行为先改 `docs/fleet/PRODUCT_SPEC.md` / `PROTOCOL.md`。
4. `docs/fleet/CAPABILITY_MATRIX.md` 每行必须可验收。
5. **无双模式**：只做本机单节点；不做 `solo|distributed` 分叉协议。
6. 上游只读：`scripts/fetch-refs.sh` → `refs/`（gitignore）。
