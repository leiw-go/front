# ============================================================
# Ant Design Pro 前端 - 多阶段构建
#   build:   node:22 npm ci + max build
#   runtime: nginx:alpine serving dist/
#
# 启用 BuildKit (syntax directive + --mount=type=cache)：
#   - 跨构建复用 npm 缓存，首次之后不必重下依赖
#   - 配合 `DOCKER_BUILDKIT=1 docker build --progress=plain` 实时回显 stdout
#   - 避免 legacy builder 的输出缓冲导致 Jenkins 看不到进度
# ============================================================
# syntax=docker/dockerfile:1.6
FROM node:22-alpine AS build
WORKDIR /build

# 先 copy package.json + lock 文件 + .npmrc 拿依赖缓存
COPY package.json package-lock.json* .npmrc ./

# 国内镜像加速 + 挂载 npm 缓存（跨构建复用）
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/build/node_modules/.cache \
    npm config set registry https://registry.npmmirror.com \
    && npm ci --legacy-peer-deps

# 复制全部源码并构建；保留 npm 缓存挂载以加速 utoo pack
COPY . .
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/build/node_modules/.cache \
    npm run build

# ------------------------------------------------------------
# Runtime 阶段 - 用 nginx 服务静态文件
# ------------------------------------------------------------
FROM nginx:1.27-alpine
RUN apk add --no-cache tzdata \
    && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && rm -rf /usr/share/nginx/html/*

# 复制构建产物
COPY --from=build /build/dist /usr/share/nginx/html

# 复制 SPA 友好的 nginx 配置
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8000/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]