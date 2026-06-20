# 量化策略管理 (Quant Strategy Management)

本目录实现「量化策略管理」前端页面, 与后端 `/api/quant/*` 配套使用.

## 目录结构

```
src/pages/quant/
├── README.md
├── account-manage/
│   └── index.tsx        # 聚宽账户管理 (新增/编辑/删除/测试登录)
└── strategy-manage/
    ├── index.tsx        # 策略主页面 (列表/CRUD/启动/停止/详情)
    ├── service.ts       # 后端 API 客户端
    └── data.d.ts        # TypeScript 类型定义
```

## 路由

* `/quant/account-manage` — 聚宽账户管理
* `/quant/strategy-manage` — 策略主页面 (默认入口)

均无需 `canAdmin` 权限, 当前所有登录用户可见. 如需限制, 在
`config/routes.ts` 的对应节点添加 `access: 'canAdmin'`.

## 关键设计

* **数据加载**: 列表使用 `ProTable` + `useQuery` (`@tanstack/react-query`);
  详情抽屉使用 `useQuery` 缓存各 tab 数据, 切换 tab 不重新拉取.
* **写操作**: `useMutation` + `queryClient.invalidateQueries` 触发列表刷新.
* **状态机**: 策略状态枚举 `DRAFT / RUNNING / STOPPED / ERROR / COMPLETED`,
  通过 `ProTable.valueEnum` 自动渲染 Tag 颜色.
* **代码编辑器**: 现阶段用 `ProFormTextArea` 渲染 Python 源码;
  后续可替换为 Monaco / CodeMirror.
* **凭据安全**: 聚宽账户密码由后端 AES 加密, 前端只在新账户创建时输入;
  编辑时为空 = 不修改.
* **i18n**: 菜单项在 `src/locales/{zh-CN,en-US}/menu.ts` 中维护.

## 本地开发

* 后端默认在 `http://localhost:8888`, 跨域已配置 (`CorsConfig`).
* 前端通过 `npm start` 启动, 代理到后端.
* 启动后, 在「聚宽账户」页面新增账户, 然后到「策略管理」创建并启动策略.
* 实际运行依赖后端 `quant.aes.key` 与 Python 环境的 `jqdatasdk`; 缺失时
  后端返回明确错误, 不会写入无效数据.
