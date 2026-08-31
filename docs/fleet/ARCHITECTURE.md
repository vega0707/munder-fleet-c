# ARCHITECTURE — 单机 Munder

```
本仓（完整产品）
├── src/main + src/renderer   # Electron 办公楼 / Hive（原 munder-difflin）
├── src/main/fleet            # 本机 Fleet：registry / claim / decision-gate
├── docs/fleet                # Fleet 规格与矩阵
├── spikes/ + oracle/         # 契约与 A/B 对拍
└── refs/                     # 只读上游（gitignore）
```

单机进程内一个 `localFleet` 单例。无分布式 daemon 拓扑。
