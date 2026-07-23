# AGENTS.md

> 给在本项目里工作的所有 AI 编码代理（Claude Code / Cursor / Junie / 其他 IDE agent）的一份统一指南。
> 只要你是 AI，且正在这个仓库里改代码，就请先读这份文档。
>
> 仓库位置：`prompt-design-api/prompt-design-ui/` —— 是父仓库 `prompt-design-api/` 下的 **前端子项目**，后端代码在 `../src/`。

---

## 1. 项目速览

- **仓库根名（父）**：`prompt-design-api`（artifactId / Spring 应用名都是 `ProjectInfomationManage`）
- **本目录定位**：Ant Design Pro v6 前端单页应用，对接上面的 Spring Boot 后端
- **监听端口（dev）**：`8000`（umi dev server）；Docker 运行时 nginx 也是 `8000`
- **后端默认地址（dev）**：`http://127.0.0.1:8888`（见 `config/proxy.ts`，所有 `/api/*` 通过 umi proxy 转发）
- **构建工具**：Umi Max v4（`@umijs/max`）+ utoo pack（`utoopack`，替代 webpack 的实验性打包器）
- **包管理**：npm + `package-lock.json`（**不是 yarn / pnpm**，`.npmrc` 已开 `legacy-peer-deps=true`）
- **Node**：`>=22.0.0`（CI / Docker / 本机统一）
- **TypeScript**：严格模式（`tsconfig.json` `strict: true`）

### 技术栈快照

| 领域 | 选型 |
| --- | --- |
| 框架 | React 19.2 + Umi Max 4.6 |
| UI 组件 | antd v6.4 + ProComponents v3 + `@ant-design/x`（chatbot） |
| 图表 | `@ant-design/plots` v2 + d3 v7 |
| 状态管理 | Umi `useModel('filename')` + `@tanstack/react-query` v5 + 全局 `initialState` |
| 样式 | Tailwind CSS v4 → antd-style v4 → CSS Modules → Less（仅 legacy） |
| 代码规范 | Biome v2（**唯一** linter / formatter，**没有** ESLint / Prettier） |
| 类型检查 | TypeScript v6（`tsc --noEmit`，`npm run tsc`） |
| 测试 | Vitest v4 + happy-dom + `@testing-library/react` |
| 国际化 | umi 内置 `locale`，8 种语言（见 `src/locales/`） |
| 请求 | `request` from `@umijs/max`（axios + 拦截器），配置在 `src/requestErrorConfig.ts` |
| OpenAPI | `@umijs/max-plugin-openapi`（基于 `config/oneapi.json` 生成 `src/services/ant-design-pro/`） |
| 构建 | utoo pack（`utoopack`）+ 静态导出（`exportStatic`） |
| 部署 | nginx:alpine（`nginx-spa.conf`）+ Jenkinsfile + 可选 Cloudflare Worker |
| 配套 | `cloudflare-worker/`（Hono 子项目，独立 `package.json`） |

---

## 2. 目录结构（只标重要的）

```
.
├── package.json                  # 依赖、脚本（start / dev / build / lint / test / openapi / simple）
├── package-lock.json             # 唯一锁文件
├── .npmrc                        # legacy-peer-deps=true
├── tsconfig.json                 # 严格 TS + 路径别名（@ / @@ / @@test / @root）
├── biome.json                    # 唯一 lint / format 配置
├── vitest.config.ts              # 测试 runner 配置
├── tailwind.config.js            # Tailwind v4 入口
├── postcss.config.js             # PostCSS
├── nginx-spa.conf                # 容器内 nginx SPA fallback + /healthz
├── Dockerfile                    # 多阶段：node:22 build → nginx:alpine serve
├── Jenkinsfile                   # CI 流水线（构建镜像 + sync dist + 重启容器）
├── config/
│   ├── config.ts                 # defineConfig：路由、antd、proxy、locale、openAPI、utoopack
│   ├── defaultSettings.ts        # ProLayout 默认值（navTheme / title / logo）
│   ├── routes.ts                 # 声明式路由（≈ 18 条），name 对应 locales 里 menu.xxx
│   ├── proxy.ts                  # dev / test / pre 三套 /api 反代目标
│   ├── oneapi.json               # OpenAPI schema，供 max-plugin-openapi 生成 services
│   ├── routes.simple.ts          # 简化版路由（被 npm run simple 用）
│   └── md-raw-loader.cjs         # 把 .md 当 .js 处理（utoopack 规则）
├── mock/                         # 全局 mock（Express 风格）
│   ├── user.ts                   # 登录 / 当前用户
│   ├── listTableList.ts          # 表格 mock
│   ├── notices.ts                # 通知 mock
│   ├── route.ts                  # 路由级 mock
│   └── utils.ts + fakeList.ts    # 工具 / 数据
├── public/                       # 直接拷贝到 dist 的静态资源
├── src/
│   ├── app.tsx                   # 运行时：getInitialState / layout / request / getInitialState
│   ├── access.ts                 # 权限定义：canAdmin = roleCode === 'ADMIN'
│   ├── access.test.ts            # 权限单元测试
│   ├── app.test.tsx              # getInitialState 测试
│   ├── requestErrorConfig.ts     # 全局请求拦截器（token / BizError 处理）
│   ├── requestErrorConfig.test.ts
│   ├── global.tsx                # 全局副作用（目前基本空）
│   ├── global.less / global.style.ts / tailwind.css   # 全局样式入口
│   ├── loading.tsx               # 首屏 loading
│   ├── manifest.json             # PWA / 资源清单（umi manifest 插件用）
│   ├── service-worker.js         # PWA service worker
│   ├── typings.d.ts              # 全局类型补充
│   ├── pages/                    # 一级路由对应的页面目录
│   │   ├── Admin.tsx             # /admin/sub-page
│   │   ├── chatbot/              # /chatbot —— 业务核心页
│   │   ├── system/{role,product}-manage/   # 系统管理
│   │   ├── lottery/period-manage/          # 彩票期数管理
│   │   ├── lottery-analyze/                # 彩票分析
│   │   ├── account/{center,settings,user-manage}/
│   │   ├── user/{login,register,register-result}/
│   │   ├── dashboard/{analysis,monitor,workplace}/
│   │   ├── form/{basic,step,advanced}-form/
│   │   ├── list/{basic-list,card-list,search,table-list}/
│   │   ├── profile/{basic,advanced}/
│   │   ├── result/{success,fail}/
│   │   └── exception/{403,404,500}/
│   ├── components/               # 业务组件（AvatarDropdown / Footer / OfflineBanner ...）
│   ├── services/ant-design-pro/  # 自动生成 —— **不要手改**，见 §4.1
│   ├── locales/                  # 8 国语言（zh-CN 默认）
│   └── utils/                    # 通用工具（format.ts 等）
├── tests/
│   ├── setupTests.ts             # Vitest 全局 setup
│   └── __mocks__/                # 模块 mock
├── scripts/                      # 一些辅助脚本（simple.js / i18n-remove.js 等）
├── cloudflare-worker/            # 独立子项目（Hono + Wrangler）
│   ├── package.json              # 独立依赖，独立 node_modules
│   ├── wrangler.toml
│   ├── tsconfig.json
│   └── src/
└── .claude/
    ├── settings.local.json       # 本机权限白名单 —— **不要主动覆盖**
    └── skills/                   # antd / pro-upgrade 两个项目内置技能
```

---

## 3. 构建 / 运行 / 测试

```bash
# 装依赖（必须用 npm，且需要 legacy-peer-deps，已写 .npmrc）
npm ci                            # 或 npm install

# 启动 dev（带 mock）
npm start                         # UMI_ENV=dev（默认），含 mock

# 启动 dev（不带 mock，对接真后端）
npm run dev                       # MOCK=none

# 启动其他环境
npm run start:no-mock             # = npm run dev
npm run start:test                # UMI_ENV=test
npm run start:pre                 # UMI_ENV=pre

# 构建（产物在 dist/，带 hash）
npm run build

# 本地预览构建产物（8000）
npm run preview                   # max preview --port 8000

# Lint（Biome + tsc，**两个都必过**才能提交）
npm run lint                      # = biome:lint && tsc
npm run biome                     # auto-fix
npm run biome:lint                # 仅检查
npm run tsc                       # 仅类型检查

# 测试
npm run test                      # vitest run（一次性）
npm run test:watch                # 监听模式
npm run test:coverage             # v8 覆盖率

# 重新生成 OpenAPI services（基于 config/oneapi.json）
npm run openapi                   # → src/services/ant-design-pro/

# antd CLI（看组件 API / lint / demo / 迁移）
npx antd info <Component>         # 写 antd 代码前必查
npx antd lint ./src               # 必过
npx antd demo <Component> <demo>
npx antd migrate <from> <to>

# ⚠️ 不可逆操作：先 commit / branch 再执行
npm run simple                    # 瘦身（删 demo 页 / 简化路由 / 删多余依赖）

# 调试 ProTable 等的请求录制
npm run record -- --scene=login
```

---

## 4. 关键约定（核心红线）

### 4.1 `src/services/ant-design-pro/` —— 自动生成，**不要手改**

- 由 `npm run openapi` + `config/oneapi.json` 生成。
- 改完后端接口 → 同步改 `oneapi.json` → `npm run openapi` 重新生成。
- 页面里要写自己的 service 时，**新建** `src/pages/<page>/service.ts`，不要去生成目录里塞文件。

### 4.2 Biome 是唯一 linter / formatter

- **没有** ESLint、Prettier、stylelint。`biome.json` 排除 `src/services`、`mock/`、`dist/`、`node_modules`、`.umi*`、`.worktrees`。
- 引号风格：单引号（`quoteStyle: 'single'`）；缩进：空格。
- 改了 `.ts` / `.tsx` 后务必 `npm run biome:lint` + `npm run tsc`。

### 4.3 权限模型

- `src/access.ts` 当前只导出 `canAdmin = currentUser?.roleCode === 'ADMIN'`。
- 后端字段映射在 `src/app.tsx#getInitialState`：把 `roleCode` 映射为 `access: 'admin' | 'user'`。
- 路由上 `access: 'canAdmin'` → 仅 ADMIN 可见；不要在页面内自行判断，**全部走 route config**。

### 4.4 请求 / Token

- 全局请求配置在 `src/requestErrorConfig.ts`，token 存在 `localStorage.getItem('token')`。
- 请求拦截器自动加 `Authorization: Bearer <token>`。
- 后端响应约定 `{ code, message, data, errors? }` —— `code !== 200` 视为业务错误（`BizError`），按 `ErrorShowType` 分流到 `message` / `notification` / 重定向。
- 后端默认账号（dev profile，父项目 `data.sql`）：`admin/admin123`（ADMIN）、`testuser/test123456`（USER）。

### 4.5 Mock 机制

- 全局 mock：`mock/*.ts`，Express 风格 handler。
- 页面级 mock：`src/pages/**/_mock.ts`（`config/config.ts` 里 `mock.include` 配的就是它）。
- 想关 mock：用 `npm run dev`（= `MOCK=none`）。
- 后端没启时 dev 想调真实接口：先 `cd .. && SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run`。

### 4.6 i18n

- 默认 zh-CN；`baseNavigator: true` 会按浏览器语言切换。
- 菜单 title 来自路由 `name` → `locales/zh-CN/menu.ts` 里 `menu.<name>`。
- 页面里用 `useIntl().formatMessage({ id, defaultMessage })`。
- 加菜单项 → 同步所有 8 个 locale 的 `menu.ts`。

### 4.7 样式优先级（不要混着用）

```
Tailwind CSS v4  >  antd-style / createStyles  >  CSS Modules  >  Less（仅 legacy）
```

- 优先 token 调主题（`config/defaultSettings.ts` + antd `configProvider.theme`），不要硬编码色值。
- 字体：默认 `AlibabaSans`（见 `config/config.ts` 里 `fontFamily` token）。

### 4.8 路由

- 声明式在 `config/routes.ts`，name 必填（用于 i18n）。
- `access: 'canAdmin'` 控制菜单可见性，但**后端仍要做权限校验**，前端只是 UX。
- 新增页面：`src/pages/<path>/index.tsx`，路由 component 用相对路径 `./<path>`。

---

## 5. Cloudflare Worker（独立子项目）

- 路径：`cloudflare-worker/`，**不是** npm workspace（自己一套 `package.json`）。
- 框架：Hono + Wrangler。
- 改完要单独 `cd cloudflare-worker && npm install && npx wrangler deploy`。
- 跟主前端共享代码要慎重 —— 没有自动同步机制，**不要**改主项目后默认它能用。

---

## 6. 改动指南（每类任务的红线）

### 6.1 新增 / 改页面

1. 在 `config/routes.ts` 加路由（含 `name` / `icon` / `access`）。
2. `src/pages/<path>/index.tsx` 写主体；复杂页拆 `components/` 子目录。
3. `src/locales/<所有 8 个 locale>/menu.ts` 补 `menu.<name>` 文案。
4. 有数据需求：写 `src/pages/<path>/service.ts`（**不要**塞 `src/services/ant-design-pro/`）。
5. 写了 `_mock.ts` → commit；写了 `data.d.ts` → 跟 `service.ts` 一起 commit。

### 6.2 改后端接口 / 新接口

1. 父项目 `prompt-design-api/src/` 加 Controller / Service / Mapper。
2. **不要**自己写 service 函数 —— 改 `config/oneapi.json`（或后端 `/v3/api-docs` 导出），跑 `npm run openapi` 重新生成。
3. 页面里 `import { xxx } from '@/services/ant-design-pro/api'`。

### 6.3 改全局样式 / 主题

- token：在 `config/defaultSettings.ts`（ProLayout）+ `config/config.ts` 里 `antd.configProvider.theme.token`。
- Tailwind：直接改 `tailwind.config.js` + `src/tailwind.css`。
- 不要新建全局 Less（除非 patch antd 内部）。

### 6.4 改 mock

- 仅影响 dev；真后端联调前要确认 mock 已开或已关。
- 后端 mock 与前端 mock 不要同时开同样的 endpoint（容易混）。

### 6.5 改 Docker / Jenkinsfile

- `Dockerfile`：`node:22-alpine` → `nginx:1.27-alpine`，最终 image 暴露 `8000`。
- 多阶段 COPY 路径用相对路径（**不要**硬编码绝对路径）。
- `Jenkinsfile`：保持 `set -eux` + 显式 `trap rm -f ...`，容器临时目录不残留。
- 国内构建：`Dockerfile` 里 npm 仓库已切到 `registry.npmmirror.com`，**不要**改回官方。

### 6.6 升级 antd / ProComponents / Umi Max

- 跑 `npx antd lint ./src` 看 deprecation。
- 用 `npx antd migrate <from> <to>` 看迁移清单。
- 复杂升级用项目内置技能 `/pro-upgrade`（会对比官方最新模板合入框架层）。

---

## 7. 代码风格（必须遵守）

- 引号：单引号（Biome 自动 enforce）。
- 缩进：2 空格（**禁止 Tab**）。
- 单文件 ≤ 1500 行（参考父项目上限；超过要拆 component / hook）。
- 注释 / Javadoc 默认中文；类、public 方法必须写 Javadoc，**字段级可省略**。
- TypeScript：`strict: true`，不要 `any`（必须用时加 `// eslint-disable` 风格的注释解释）。
- React 组件：`function` 声明优于箭头函数（方便 hoist 测试）。
- 命名：组件 `PascalCase`；hook `useXxx`；常量 `UPPER_SNAKE`；service 函数 `verbNoun`（`queryUser` / `createProduct`）。
- 工具函数放 `src/utils/`；业务组件放 `src/components/`；页面专属组件放 `src/pages/<page>/components/`。
- 不要把 ProTable / ProForm 的 `request` 写在外层组件函数里（每次渲染重建函数，触发 loading 闪烁）。

---

## 8. 测试

- Runner：Vitest（**不是** Jest，虽然 antd pro 模板里很多 jest 用例；本项目已切到 vitest）。
- 环境：`happy-dom`（`vitest.config.ts`），不是 jsdom。
- 文件：`src/**/*.test.{ts,tsx}`，`passWithNoTests: true`。
- **例外**：`src/pages/user/login/login.test.tsx` 已在 `exclude` 里（依赖 Umi Jest runner，不能 vitest 直接跑）。
- 覆盖率：v8，配置在 `vitest.config.ts`。
- 写新测试：跟被测文件同目录，命名 `xxx.test.ts(x)`；happy-dom 不支持的 API 用 `tests/__mocks__/` 桩掉。
- 不要把真后端 / 真实接口耦合进单元测试；要写就用 msw 或 `tests/__mocks__/`。

---

## 9. 提交 / 协作

- 分支：默认 `master`；功能分支 `feature/xxx` 或 `fix/xxx`。
- 提交信息走约定式（commitlint 强制），如 `feat: 新增 chatbot 流式输出` / `fix(lottery): 修正期数翻页空指针`。
- 一次提交只做一件事。
- 涉及跨子项目改动（如同时改父项目 Nacos + UI 的 `.env`）：PR 描述里**显式**写出需要同步改的下游。
- 改了 `package.json`：跑 `npm install` + `npm run biome:lint` + `npm run tsc` + `npm run build`。
- 改了 `biome.json` / `tsconfig.json` / `tailwind.config.js`：跑全套验证。

---

## 10. AI 代理动手前的硬性 checklist

> 写代码前先对一遍：

- [ ] 读过父项目 `prompt-design-api/AGENTS.md`（后端约定）。
- [ ] 涉及 antd 组件：先 `npx antd info <Component>` 查 API。
- [ ] 涉及新接口：先确认走 `oneapi.json` + `npm run openapi`，**不要**手写 service。
- [ ] 涉及鉴权：默认 `access: 'canAdmin'`，不要在页面里 `if (role === 'admin')`。
- [ ] 涉及样式：先查 token，没有再 Tailwind，最后才 Less。
- [ ] 涉及 i18n：8 个 locale 全改，**不要**只改 `zh-CN`。
- [ ] 涉及 Dockerfile / Jenkinsfile：国内镜像不要换回官方。
- [ ] 涉及 mock：明确告诉用户「dev 启动时是 mock 数据」。
- [ ] 涉及 cloudflare-worker：单独 `cd cloudflare-worker && npm install`，主仓的 npm i **不会**装它的依赖。
- [ ] 涉及 `.umi*`：那是构建产物，**不要**手动改，dev 起怪问题时 `rm -rf src/.umi` 重启。
- [ ] 改完跑 `npm run lint` + `npm run tsc` + `npm run test`。
- [ ] 不要提交：`dist/` / `.umi*` / `node_modules/` / `coverage/` / `.turbopack/` / 任何带真实 token 的 `.env*`。

---

## 11. 关于本仓库的内置代理知识

- `.claude/settings.local.json` 已存在：尊重其本地权限设置，**不要**主动覆盖。
- `.claude/skills/` 下有 `antd` 和 `pro-upgrade` 两个项目内置技能，直接 `/antd`、`/pro-upgrade` 调用。
- `.turbopack/` 是 utoopack 缓存目录，**不要**手动清（除非构建行为异常时 `rm -rf src/.umi .turbopack`）。
- `.umi` / `.umi-production` / `.umi-test` / `.umi-test-production` 都是 umi 自动产物，**不要**提交。
- `.husky/`：commit-msg 跑 commitlint，pre-commit 跑 lint-staged（Biome auto-fix）。
- `src/pages/Admin.tsx` 是 `/admin/sub-page`，被 `routes.ts` 用 `component: './Admin'`（相对 pages 目录的裸文件名）。

---

## 12. 后续值得做但本仓库还没做的（仅备忘，不要求一次都做）

- 把 openapi 从静态 `oneapi.json` 切到后端 `/v3/api-docs` 实时拉。
- 把页面级 mock 迁到 msw（service worker 级别，与 umi mock 解耦）。
- 跑通 e2e（Playwright）覆盖 chatbot 主流程。
- 把 `src/pages/` 下 boilerplate 页（dashboard / form / list / profile / result / exception）清理或归档 —— `npm run simple` 已部分处理。
- 把请求 baseURL 抽成 env，支持 staging / production 多套。
- 加 ESLint-vitest 兼容层，跑出 `eslint-plugin-vitest` 推荐规则（仍保留 Biome 作 formatter）。
