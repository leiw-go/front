# ============================================================
# Ant Design Pro 前端 - 多阶段构建
#   build:   node:22 npm ci + max build
#   runtime: nginx:alpine serving dist/
#
# 注意：本镜像使用 legacy builder（无需 buildx），所以 nginx 配置
# 改用单独的 COPY 文件方式，而不是 heredoc。
# ============================================================
FROM node:22-alpine AS build
WORKDIR /build

# 先 copy package.json + lock 文件拿依赖缓存
COPY package.json package-lock.json* ./
COPY .npmrc ./

# 国内镜像加速
RUN npm config set registry https://registry.npmmirror.com \
    && npm ci --legacy-peer-deps

# 复制全部源码并构建
COPY . .
RUN npm run build

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