#!/bin/sh
# ============================================================
# setup-runtime.sh - Dockerfile runtime 阶段的 nginx 镜像初始化
#
# 由 Dockerfile 的 RUN 在 nginx:alpine 上调用。
# 任务：
#   1. 切到国内 apk 镜像源（默认 dl-cdn.alpinelinux.org 在国内不稳）
#   2. 安装 tzdata 包以支持任意时区
#   3. 把容器时区设到 Asia/Shanghai（与公司后端一致，方便日志对时间）
#   4. 清掉 nginx 自带的默认欢迎页，dist/ 会通过 COPY 覆盖
# ============================================================
set -eu

# ---- 切到国内 apk 镜像源（保留原 path，把 host 换成 aliyun） ----
# nginx:1.27-alpine 自带的 /etc/apk/repositories 内容形如：
#   https://dl-cdn.alpinelinux.org/alpine/v3.21/main
#   https://dl-cdn.alpinelinux.org/alpine/v3.21/community
# 只换 host，path 跟着 base 镜像的 alpine 版本走，避免硬编码版本号挂掉
sed -i 's|dl-cdn.alpinelinux.org|mirrors.aliyun.com|g' /etc/apk/repositories

# 安装 tzdata（提供 /usr/share/zoneinfo/*）
apk add --no-cache tzdata

# 软链 + 写入 timezone，使应用内 / 应用外时间都按上海时区走
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
echo "Asia/Shanghai" > /etc/timezone

# 清掉 nginx 默认静态文件，避免在 dist COPY 进来之前误命中
rm -rf /usr/share/nginx/html/*
