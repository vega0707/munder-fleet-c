# HANDOFF — 完整单机 Munder

## 定位

**本仓 = 完整单机 Munder**：办公楼 UI + Hive + 本机 Fleet（register/claim/硬闸）。  
不是「规格仓把实现推到别的仓」。

## 已完成

1. ✅ 合入 munder-difflin 应用树（`src/`、`hive/`、Electron 配置等）
2. ✅ Fleet 规格在 `docs/fleet/`（单机）
3. ✅ `src/main/fleet/` 接入主进程 IPC（`registerFleetIpc`）
4. ✅ `spikes/` + `oracle/` 可机跑契约

## 不要做

- 不要把产品再推回 munder-difflin
- 不要引入多机/双模式
- 不要拷 Aion/Multica 进 `src/`

## 怎么跑

```bash
npm install
npm run dev          # Electron 单机 Munder
cd spikes/single-node-fleet && npm test
cd oracle && npm test
```
