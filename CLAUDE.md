# CLAUDE.md

> 给 Claude Code / Claude Agent SDK 看的"项目专属手册"。
> 通用版在 `AGENTS.md`；这份只讲 Claude 系代理在这个仓库里需要多注意的点。

---

## 1. 启动前必读

1. 先读 `AGENTS.md` —— 项目结构、技术栈、命令、约定都在那里。
2. 续接之前的对话：用 `SendMessage` 给同名 teammate 续上下文；不要靠"我记得上次"硬猜。
3. 跨过 5 分钟缓存窗口前决定：是否需要 `ScheduleWakeup` 续 `loop`，详情见 `AGENTS.md` §1。

---

## 2. 工具与命令

### 2.1 选用工具的优先级

| 任务 | 优先用 | 退路 |
| --- | --- | --- |
| 读文件 | `Read` | `Bash` + `cat` |
| 搜代码 | `Grep` / `Glob` | `Bash` + `grep` / `find` |
| 改文件 | `Edit` / `Write` | `Bash` + `sed` |
| 跑测试 | `Bash` + `npm run test` | 直连 IDE |
| 跑应用 | `Bash` + `npm start`（仅验证用） | `docker build` + `docker run` |
| 跨大量文件 grep | `Agent` / `Explore` 子代理 | 自己 `Grep` |
| 写代码前查全局上下文 | `Explore` 子代理 | 自己读 |
| 复杂实现规划 | `EnterPlanMode` | 边写边想 |
| 查 antd 组件 API | `Skill` → `/antd` 或 `npx antd info <Component>` | 自己猜（禁止） |

### 2.2 常用命令（可直接复制）

```bash
# 装依赖（首次 / 改 package.json 后）
npm ci                                # 优先用 ci（lockfile 一致）

# 开发
npm start                             # UMI_ENV=dev（默认，含 mock）
npm run dev                           # MOCK=none，对接真后端
npm run start:test                    # UMI_ENV=test

# Lint / 类型检查 / 测试（提交前必跑）
npm run lint                          # biome:lint + tsc
npm run tsc                           # 仅类型检查
npm run test                          # vitest run
npm run biome                         # auto-fix

# 构建产物
npm run build                         # → dist/

# 重新生成 OpenAPI services（基于 config/oneapi.json）
npm run openapi

# antd 工具
npx antd info <Component>             # 写 antd 代码前必查
npx antd lint ./src                   # 必过（提交前）
npx antd demo <Component> <demo>      # 抄 demo

# ⚠️ 不可逆操作 —— 先 commit / branch
npm run simple                        # 瘦身

# Docker / Jenkins（参考 AGENTS.md §6.5）
docker build -f Dockerfile -t leiw-go/front:dev .
```

### 2.3 模型选择提示

- 改 antd 组件 / 改路由 / 改样式 → 默认主会话（Opus 都行），不要下放到 Haiku 子代理。
- 写完整新页面（带 ProTable / ProForm）→ 主会话 + `EnterPlanMode` 先讨论结构。
- 大规模 grep / 文档类问题 → `Explore` 子代理，**不要**全塞主上下文。
- 写代码遇到选择题（包名 / 路径 / 组件命名）→ `AskUserQuestion` 一次问清，**不要**边写边改。
- 简单 lint / tsc 错误定位 → 可下放给 `general-purpose` 子代理，省主上下文。

---

## 3. 国内网络 / 代理

- npm 镜像：`.npmrc` / `Dockerfile` 已切到 `https://registry.npmmirror.com`，**不要**手动换回官方。
- 拉 Docker 基础镜像：看 `Dockerfile` 是否需要 mirror，没需要**不要**主动加。
- 任何 `git clone/pull/push` / `gh` / `curl` 到 GitHub / Google 等已知被墙域：在动手前**主动**调用 `proxy-helper` 技能（SSH 走 GitHub 通常不需代理，优先用 SSH URL）。
- 跑 `npm install` / `npm ci` 出网络问题：先看 `~/.npmrc` 是否覆盖了项目 `.npmrc`（项目里 `legacy-peer-deps=true` 是有意为之）。

---

## 4. 改前端代码的"高压线"（agent 容易踩）

> 这些改完会引发一次完整 rebuild / restart，而且排错成本高 —— 下笔前先想清楚。

- **`src/services/ant-design-pro/`**：自动生成，**不要**直接 Edit；要改 → 改 `config/oneapi.json` → `npm run openapi`。
- **新路由没加 i18n**：路由 `name` 必须在 8 个 `locales/*/menu.ts` 全加，否则菜单显示 `menu.xxx` 字面量。
- **`access: 'canAdmin'` vs `access: 'canUser'`**：当前只定义了 `canAdmin`（见 `src/access.ts`）；需要 USER-only 路由就 **先扩 access.ts**，不要去页面里 `if (role)`。
- **`getInitialState`**：里面调用 `queryCurrentUser` 失败会重定向到 `/user/login?redirect=...`。改它要小心，**死循环登录**的 bug 经常出在这里。
- **`requestErrorConfig`**：`errorThrower` 把后端 `code !== 200` 转成 `BizError`，再由 `errorHandler` 按 `showType` 分发；改 `errorHandler` 时不要把 `BizError` 当 axios 错误处理（会进 `else` 分支被吞）。
- **token 注入**：当前是手动 `localStorage.getItem('token')` + Bearer 头；改用 cookie / httpOnly 时**显式**迁移，**不要**只改一处。
- **样式硬编码色值**：先查 token / Tailwind 调色板，**不要**写 `#1677ff` 这种魔法数。
- **`config/oneapi.json`**：删字段会触发所有引用方编译失败（删除前先 grep 引用）。
- **`biome.json`**：改 `includes` / `exclude` 影响所有文件，提交前 `npm run biome:lint`。
- **Husky / lint-staged**：本地 git commit 会触发 pre-commit Biome auto-fix；改了 `.husky/_` 或 `.lintstagedrc` 之后第一次 commit 看清楚 diff。

---

## 5. 调试 / 验证流程

- 浏览器端验证：
  - `npm start` → <http://localhost:8000>（mock 数据）
  - `npm run dev` → <http://localhost:8000>（真后端，需先 `cd .. && ./mvnw spring-boot:run` 起 8888）
  - 登录（mock）：`admin / ant.design` 或 `user / ant.design`
  - 登录（真后端）：`admin / admin123` 或 `testuser / test123456`（见父项目 `data.sql`）
- 鉴权：401 → 自动跳 `/user/login?redirect=<原路径>`。
- 调试接口：`config/oneapi.json` 对应后端 `/v3/api-docs`；Swagger UI 在后端 <http://localhost:8888/swagger-ui.html>。
- 后端出问题时看 `requestErrorConfig.ts#errorHandler`：后端 `code=500` 会走 `message.error('Response status: ...')` 分支。
- chat 页（`/chatbot`）调试：`@ant-design/x` 的流式输出走 SSE，开发工具 Network 看 event-stream。

---

## 6. 写法上的偏好（按本仓库惯例）

- 组件：函数声明 + `export default function Page() {}`；复杂 props 用 `interface` 而非 `type`。
- Hooks：`useXxx` 命名；自定义 hook 放页面 `hooks/` 子目录（不要放全局 `src/hooks`，目前项目里**没有** `src/hooks`）。
- State：优先 `useModel('@@initialState')` 取全局；页面私有 state 用 `useState`；服务端状态用 `@tanstack/react-query` 或 ProTable `request`。
- 请求：`import { request } from '@umijs/max'`，**不要**直接 `import axios`。
- 异常：让 `errorThrower` 抛 `BizError`，**不要**在 service 里 `try-catch` 后吞掉。
- 国际化：所有用户可见文案走 `useIntl().formatMessage({ id, defaultMessage })`；commit message 可中文，技术名词保持英文。
- 注释：默认中文；Javadoc 给类 / 公开方法；不需要解释"是什么"，只解释"为什么"。
- 性能：ProTable 的 `request` 函数**必须**用 `useCallback` 或提到模块顶层，否则每次渲染重建导致 loading 闪烁。
- 锁文件：`package-lock.json`（**不要**手改 / 转 yarn / 转 pnpm）。

---

## 7. 写代码前的"必读一遍"

1. 这个改动会不会触发 `npm run openapi`？ → 改 `config/oneapi.json` 后**不要**忘记跑。
2. 这个改动会不会动菜单 / i18n？ → 同步 8 个 locale。
3. 这个改动会不会改权限？ → 改 `access.ts` / `app.tsx#getInitialState`。
4. 这个改动会不会动样式主题？ → 优先 token / Tailwind，最后 Less。
5. 这个改动会不会改 `biome.json`？ → 跑全套 lint。
6. 这个改动会不会改 Docker / Jenkinsfile？ → 国内镜像不要换回官方。
7. 这个改动会不会改 cloudflare-worker？ → 那是独立子项目，单独 `cd cloudflare-worker && npm install`。

---

## 8. 完成的定义 (DoD)

> 一个改动在"完工"之前必须满足：

- [ ] `npm run lint` 通过（Biome + tsc）。
- [ ] `npm run test` 通过（至少相关测试类绿；`passWithNoTests: true` 不算）。
- [ ] `npm run build` 通过，产物在 `dist/`。
- [ ] 改的接口走 `npm run openapi` 生成；改的页面有 i18n（8 个 locale 全部）。
- [ ] 改的页面加了 `access` 控制（如需）；改了 `access.ts` 时在 `access.test.ts` 补用例。
- [ ] 改的代码没有新增 `console.log` / `TODO` / `FIXME`（除非你能给出原因）。
- [ ] 没有把真实 token / 真实后端地址写进仓库（dev / test 例外）。
- [ ] 改完告知用户在父项目 / cloudflare-worker 哪些下游需要同步。

---

## 9. 失败模式（已知 & 应对）

| 现象 | 原因 | 应对 |
| --- | --- | --- |
| `npm start` 后白屏 / 卡 loading | `.umi` 缓存烂了 | `rm -rf src/.umi src/.umi-production .turbopack && npm start` |
| `npm run build` 报 `oneapi.json` schema 错 | 后端改了字段但 oneapi 没更新 | 重新导出后端 `/v3/api-docs` 覆盖 `config/oneapi.json` |
| 菜单显示 `menu.xxx` 字面量 | 漏加 i18n | 补对应 locale 的 `menu.xxx` |
| `npx antd lint ./src` 报错 | 用了 deprecated API | `npx antd info <Component>` 看新 API |
| `Biome` 与编辑器冲突 | IDE 自带 formatter | 关闭 IDE 的 format-on-save |
| `vitest` 跑 `login.test.tsx` 报 runner 不匹配 | 该测试依赖 Umi Jest | 已在 `vitest.config.ts` exclude，跳过 |
| Husky pre-commit 跑得很慢 | node_modules 重装过，缓存空 | 跑一次后正常 |
| Docker build 卡在 `npm ci` | 网络问题 | 看 `Dockerfile` 用了 `registry.npmmirror.com` 没有；必要时加 proxy-helper |
| `cloudflare-worker` 改完不生效 | 没单独 install | `cd cloudflare-worker && npm install && npx wrangler dev` |
| 调真后端报 401 | 没启后端 / token 过期 | `cd .. && SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run`；重新登录 |

---

## 10. 与 agent 系统约定

- **不要**在 `AGENTS.md` / `CLAUDE.md` / `README.md` 里写真实 token / 凭据 / 邮箱 / 手机号。
- **不要**直接 `git add` / `git commit` / `git push` —— 让用户决定。
- **不要**改 `.claude/settings.local.json`（这是用户本机权限设置）。
- **不要**在 `dist/` / `.umi*` / `.turbopack/` / `node_modules/` 下写代码（构建产物）。
- **不要**绕过 `access.ts` 在页面里写 `if (role === 'ADMIN')` —— 走 route `access` 字段。
- **不要**在 `src/services/ant-design-pro/` 里加手写代码 —— 改 `oneapi.json` + 跑 `npm run openapi`。
- **不要**把 `.env*` 提交（即使里面只有本地配置）。

---

## 11. 已知差异 / 临时状态（写代码时要留意）

- `src/services/ant-design-pro/` 当前生成自父项目 Nacos 配置 + 后端 `/v3/api-docs`，改后端前先确认生成版本。
- `mock/` + `src/pages/**/_mock.ts` 两套并存：默认 `npm start` 全开；`npm run dev` 全关。
- `src/pages/user/login/login.test.tsx` 已 exclude —— 是从 antd pro 模板继承的，跑在 Umi Jest runner 下，迁到 vitest 是个 TODO。
- `src/pages/Admin.tsx` 是顶层文件（不是目录），被路由用 `component: './Admin'` 引用；同类情况以后要新建时**遵循约定**（要么纯文件，要么目录里 `index.tsx`）。
- `cloudflare-worker/` **不是** npm workspace，**不要**假设主仓 `npm install` 会装它的依赖。
- `biome.json` 已把 `src/services`、`mock/`、`dist/`、`.umi*`、`.worktrees` 排除 —— 这些文件 lint 报错**忽略**，不要去加 rule 兜底。
- `src/tailwind.css` 是 21 字节的入口文件（`@import "tailwindcss";`）—— 改 Tailwind 配置走 `tailwind.config.js` + `postcss.config.js`。
- `routes.ts` 里大量页面是 antd pro 模板带的（dashboard / form / list / profile / result / exception），**还没删干净**；清理走 `npm run simple`（不可逆，先 commit）。
- 默认登录页 demo 账号（mock 下）：`admin / ant.design` 或 `user / ant.design`（见 `mock/user.ts`）；真后端用父项目 `data.sql` 里的 `admin / admin123`。

---

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
