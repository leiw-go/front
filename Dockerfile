# ============================================================
# Ant Design Pro 前端 - 多阶段构建
#   build:   node:22 npm ci + max build
#   runtime: nginx:alpine serving dist/
#
# 启用 BuildKit (syntax directive + --mount=type=cache)：
#   - 跨构建复用 npm 缓存，首次之后不必重下依赖
#   - 配合 `DOCKER_BUILDKIT=1 docker build --progress=plain` 实时回显 stdout
#   - 避免 legacy builder 的输出缓冲导致 Jenkins 看不到进度
#
# 阶段内的具体命令抽到 scripts/docker/*.sh，方便本地复跑与维护
# ============================================================
# syntax=docker/dockerfile:1.6
# 国内 build：从 DaoCloud 镜像拉 base 镜像；registry-mirrors 不影响 FROM，必须改这里
#
# 三层缓存（从快到慢）：
#   1. Docker layer cache（默认）：package.json 不变 → npm ci 整层复用
#   2. BuildKit --mount=type=cache：源文件变了 / dockerignore 失效，也能复用下载元数据
#   3. 外部 registry cache（CI 用）：docker buildx --cache-from/--cache-to type=registry，跨机器复用
FROM docker.m.daocloud.io/library/node:22-alpine AS build
WORKDIR /build

# 兜底镜像源：所有子进程（npm / npx / Umi Max 插件）的 registry 都走国内
# 同时设 NPM_CONFIG_REGISTRY（npm ≥ 7 默认）和 npm_config_registry（兼容旧版），二者等价
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

# 兼容读全小写变量的工具链（与 NPM_CONFIG_REGISTRY 等价，二选一即可）
ENV npm_config_registry=https://registry.npmmirror.com

# 先 copy package.json + lock 文件 + .npmrc 拿依赖缓存
COPY package.json package-lock.json* .npmrc ./
# 提前把 install-deps.sh 放到镜像里 —— 这样 `npm ci` 这一 RUN 不再写长链
COPY scripts/docker/install-deps.sh /usr/local/bin/install-deps.sh

# 国内镜像加速 + 挂载 npm 缓存（跨构建复用，id 锁定避免并发构建互相踩）
RUN --mount=type=cache,id=npm,target=/root/.npm,sharing=locked \
    chmod +x /usr/local/bin/install-deps.sh \
    && /usr/local/bin/install-deps.sh

# 复制全部源码并构建；保留 npm 缓存挂载以加速 utoo pack
COPY . .
# node_modules/.cache 是 Umi Max 的工具缓存（babel / webpack 等），持久化能显著缩短二次构建
RUN --mount=type=cache,id=npm,target=/root/.npm,sharing=locked \
    --mount=type=cache,id=build,target=/build/node_modules/.cache,sharing=locked \
    npm run build

# ------------------------------------------------------------
# Runtime 阶段 - 用 nginx 服务静态文件
# ------------------------------------------------------------
FROM docker.m.daocloud.io/library/nginx:1.27-alpine
COPY scripts/docker/setup-runtime.sh /usr/local/bin/setup-runtime.sh
RUN chmod +x /usr/local/bin/setup-runtime.sh \
    && /usr/local/bin/setup-runtime.sh

# 复制构建产物
COPY --from=build /build/dist /usr/share/nginx/html

# 复制 SPA 友好的 nginx 配置
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8000/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
