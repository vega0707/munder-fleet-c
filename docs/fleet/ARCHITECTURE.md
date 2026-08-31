# ARCHITECTURE — Strategy C

```
纯 Munder 产品（本仓）
├── src/main + src/renderer     # 办公楼 / Hive（合入的 Munder）
├── src/main/fleet              # Fleet：registry / claim / decision-gate
│                                 # 单机 = 1 runtime；多机 = 同协议多 runtime
├── docs/fleet                  # 规格真相源
├── spikes/ + oracle/           # 契约与 A/B 对拍
└── refs/                       # 只读上游（gitignore）
```

**干净重写：** 分布式语义在自研 Fleet 模块里一次做对；UI 仍是 Munder。  
**无双模式：** 不存在第二套 wire。
