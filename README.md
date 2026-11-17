# 外贸 CRM 系统 · 前端

UmiJS 4 (max) + Ant Design Pro 6 + antd v6 + React 19 + TypeScript 的外贸 CRM 前端。

后端为 Spring Boot 服务，接口前缀 `/api/crm/**`，服务端上下文路径 `/design`（`server.servlet.context-path=/design`）。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | UmiJS 4 / @umijs/max（约定式路由 + 插件体系） |
| 组件 | antd v6、@ant-design/pro-components 3.x |
| 数据 | @tanstack/react-query（服务端状态）、Umi model（全局状态） |
| 样式 | Tailwind CSS 4 + antd token；无 Less 业务样式 |
| 国际化 | 8 种语言（zh-CN / zh-TW / en-US / ja-JP / pt-BR / id-ID / fa-IR / bn-BD） |
| 质量 | Biome（lint + format）、TypeScript strict、vitest（happy-dom） |

## 目录结构

```
config/
  routes.ts            # 全部路由（CRM 12 个模块 + 角色/用户/个人中心/AI 助手）
  proxy.ts             # dev 代理：/api/ → http://127.0.0.1:8888/design
  crm-openapi.json     # 后端 CRM 接口的 OpenAPI 快照（service 生成器的输入）
scripts/
  openapi-crm.js       # CRM 专属 service 生成器（只读 crm-openapi.json，输出 src/services/crm）
src/
  pages/crm/           # CRM 各模块页面 + shared.ts（枚举/格式化）+ hooks/useOptions.ts
  pages/crm/quotation-calculator/  # 报价计算（pricing.ts 算价镜像 + 单测）
  services/crm/        # 自动生成，勿手改
  services/ant-design-pro/  # 手工维护（users / roles / auth）
```

## 功能模块

客户管理、产品管理、商机管理、询盘管理、报价单管理、报价计算、订单管理、发货与应收、邮件群发、汇率管理、站内信、CRM 看板。

菜单分层：顶部导航直接暴露 **产品管理**、**报价计算**、**CRM**（其余模块在 CRM 下拉里）；用户管理 / 角色管理 / 个人设置 / 站内信收敛在右上角头像下拉。

---

# 部署

## 部署架构

**本地构建 → rsync 静态产物 → 远程宿主 nginx 直接托管 → 反代到后端容器。**

远程机器上不做任何编译打包。

```
本地 macOS (arm64)                    远程 43.143.244.13 (Ubuntu 24.04, x86_64)
┌────────────────────┐                ┌──────────────────────────────────────────┐
│ npm run build      │  rsync -az     │ nginx :80/:443                            │
│   → dist/          │ ────────────► │   root /var/www/frontend   (CRM SPA 静态)  │
└────────────────────┘   --delete     │   location /api/ → /design/api/           │
                                        │            └──────────► backend 容器      │
                                        │                        127.0.0.1:8888   │
                                        │                        (context-path    │
                                        │                         /design)         │
                                        └──────────────────────────────────────────┘
```

**为什么用宿主 nginx 而不是容器**：

- 前端是纯静态资源，nginx 直接托管即可，不需要运行时
- 该机器只有 2GB 内存（可用约 800MB），多一层容器 nginx 没有收益
- 站点原本就是 nginx `root /var/www/frontend` 直发，配置注释里明确记录过"双层 nginx 曾导致 SPA 路由与资源 URL 问题"
- 本地是 arm64、远程是 x86_64，走容器需要 buildx 交叉编译，慢且脆

> 仓库里的 `Dockerfile` 仍然保留，需要容器化时见文末「容器化备选方案」。

## 环境信息

| 项 | 值 |
| --- | --- |
| 服务器 | `ubuntu@43.143.244.13` |
| 访问域名 | https://design.yaowen.store （解析到 43.143.244.13，HTTPS 证书有效） |
| 站点根目录 | `/var/www/frontend`（宿主 nginx 直发，nginx 配置 `root /var/www/frontend`） |
| nginx 配置 | `/etc/nginx/sites-available/{services.conf, design.yaowen.store.conf}`，`sites-enabled/` 下是软链 |
| 后端 | docker 容器 `backend`，监听 `127.0.0.1:8888`，context-path `/design` |
| 上游定义 | `services.conf` → `backend_upstream { server 127.0.0.1:8888; }`；`design.yaowen.store.conf` → `yaowen_backend_upstream` |
| 旧版本备份 | `/home/ubuntu/backups/frontend-<时间戳>/` |

## 部署步骤

### 0. 本地构建

```bash
cd /Users/wanglei/IdeaProjects/GreatBusUI
npm ci                 # 首次或依赖变更后
npm run build          # 产物在 dist/（约 6.3MB）
```

构建前建议先跑一遍质量检查：

```bash
npm run lint           # biome lint + tsc --noEmit
npm run test           # vitest run
```

> `npm run dev` 会占用 `.turbopack` 缓存锁，**构建前先停掉 dev server**，否则 `npm run build` 会报 `Unable to acquire utoo pack build persistent cache lock`。

### 1. 备份远程现有站点（可回滚的关键一步）

```bash
TS=$(date +%Y%m%d_%H%M%S)
ssh ubuntu@43.143.244.13 "mkdir -p /home/ubuntu/backups && cp -a /var/www/frontend /home/ubuntu/backups/frontend-$TS"
```

### 2. 同步构建产物

```bash
rsync -az --delete \
  --exclude '.DS_Store' \
  -e "ssh -o ConnectTimeout=10" \
  dist/ ubuntu@43.143.244.13:/var/www/frontend/
```

`--delete` 会清掉远端旧版本残留的 chunk 文件（文件名带 hash，留着也不会被引用，但会持续占空间）。

### 3. nginx 反代配置（一次性的，配置已就位）

后端带 `/design` 上下文路径，而前端统一请求 `/api/...`，所以 nginx 要把 `/api/` 映射到 `/design/api/`。

`services.conf`（`:80` 默认站点）—— 改 `proxy_pass`：

```nginx
    # ---- Backend (Spring Boot API) ----------------------------------
    # 后端带 server.servlet.context-path=/design，真实路径是 /design/api/...
    # SPA 侧统一请求 /api/...，这里把前缀映射过去（proxy_pass 带 URI 时
    # 会替换掉匹配到的 location 前缀）：
    #   /api/crm/quotations  ->  http://127.0.0.1:8888/design/api/crm/quotations
    location /api/ {
        proxy_pass http://backend_upstream/design/api/;
    }
```

`design.yaowen.store.conf`（HTTPS 站点）—— 新增同名 location（原来只有 `/design/`，SPA 的 `/api/` 会落到 SPA fallback 拿到一段 HTML）：

```nginx
    # CRM SPA API: 后端带 /design 上下文路径，把 SPA 的 /api/... 映射到
    # /design/api/...（proxy_pass 带 URI 时替换匹配到的 location 前缀）。
    location /api/ {
        proxy_pass http://yaowen_backend_upstream/design/api/;
    }
```

> `proxy_pass` 带 URI 与不带 URI 的区别：不带（`http://backend_upstream;`）会把原始请求路径原样转发；带（`http://backend_upstream/design/api/;`）会用 URI 替换掉命中的 location 前缀 `/api/`。这里要的是后者。

### 4. 校验并重载 nginx

```bash
ssh ubuntu@43.143.244.13 'sudo nginx -t && sudo systemctl reload nginx'
```

`nginx -t` 出现 `conflicting server name "yaowen.store"` 警告是**既有问题**（`sites-enabled/` 里残留了两个 `.bak` 配置文件也会被 include），与本次改动无关，不影响服务。

### 5. 验证

```bash
# 页面与静态资源
curl -s https://design.yaowen.store/ | grep -o "<title>[^<]*</title>"   # 外贸 CRM 系统
curl -s https://design.yaowen.store/ | grep -oE 'src="/umi[^"]+"'        # 取出入口 chunk 名
curl -s -o /dev/null -w "%{http_code}\n" https://design.yaowen.store/crm/dashboard   # SPA 深链

# API 链路（登录 → 带 token 调 CRM 接口）
TOKEN=$(curl -s -X POST https://design.yaowen.store/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).data.token")
curl -s -o /dev/null -w "%{http_code}\n" "https://design.yaowen.store/api/crm/quotations?page=1&size=3" \
  -H "Authorization: Bearer $TOKEN"
```

期望：标题为 `外贸 CRM 系统`，静态资源与深链 200，登录返回 `code:200`，CRM 接口 200。

浏览器里再确认一遍：登录 → 顶部导航（产品管理 / 报价计算 / CRM）→ 进 CRM 看板，看接口是否全绿。

## 回滚

```bash
TS=<备份时间戳>
ssh ubuntu@43.143.244.13 "rsync -a --delete /home/ubuntu/backups/frontend-$TS/ /var/www/frontend/"

# 如需连 nginx 配置一起回退
ssh ubuntu@43.143.244.13 "sudo cp /etc/nginx/sites-available/services.conf.bak-<时间戳> /etc/nginx/sites-available/services.conf && \
  sudo cp /etc/nginx/sites-available/design.yaowen.store.conf.bak-<时间戳> /etc/nginx/sites-available/design.yaowen.store.conf && \
  sudo nginx -t && sudo systemctl reload nginx"
```

前端是纯静态文件，回滚只需换目录内容，秒级生效，不需要重启后端。

## 常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 页面能开但接口报 404 | nginx `/api/` 没映射到后端 `/design/api/` | 回到步骤 3 检查两个站点的 `location /api/` |
| 接口返回一段 HTML | 请求落到了 SPA fallback（`location /` 的 `try_files`） | 同上，说明 `/api/` 没命中 |
| 接口 401 | token 过期或没带 `Authorization` | 重新登录；前端 token 在 localStorage |
| 打开页面是旧版本 | 浏览器缓存了带 hash 的 chunk | 强制刷新；带 hash 的资源已设 `Cache-Control: immutable`，index.html 不要缓存 |
| 502 | 后端容器没起来 | `docker ps` 看 `backend` 容器状态，`docker logs backend` |
| `npm run build` 报缓存锁 | dev server 还开着 | 先停掉 `npm run dev` 再构建 |

## 容器化备选方案

仓库保留了多阶段 `Dockerfile`（node 构建 → nginx:alpine 托管）。若后续要用容器，**仍然在本地构建**，因为远程内存不足以做交叉编译构建：

```bash
# 本地（mac arm64 → 远程 x86_64 需要交叉编译）
docker buildx build --platform linux/amd64 -t crm-frontend:latest --load .

# 传到远程并换容器
docker save crm-frontend:latest | ssh ubuntu@43.143.244.13 'docker load'
ssh ubuntu@43.143.244.13 'docker rm -f frontend && \
  docker run -d --name frontend --restart unless-stopped \
    -p 127.0.0.1:8000:8000 crm-frontend:latest'
```

注意：当前宿主 nginx 是直接用 `root /var/www/frontend` 托管静态文件的（不是反代到 8000），换容器后需要同步改成 `proxy_pass http://127.0.0.1:8000;`，而这套配置历史上出过 SPA 路由问题，切换前务必先在预发环境验证。

## 相关命令速查

```bash
npm run dev            # 开发（UMI_ENV=dev，mock 关闭），http://localhost:8000
npm run build          # 生产构建 → dist/
npm run openapi:crm    # 后端接口变更后重新生成 src/services/crm
npm run lint           # biome + tsc
npm run test           # vitest
```
