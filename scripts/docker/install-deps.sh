#!/bin/sh
# ============================================================
# install-deps.sh - Dockerfile build 阶段的依赖安装脚本
#
# 由 Dockerfile 的 RUN --mount=type=cache,target=/root/.npm 调用，
# 因此可以跨构建复用 npm 缓存。
#
# 关键约定：
#   - 使用 npmmirror 国内镜像加速（见 CLAUDE.md §3）
#   - 必须使用 --legacy-peer-deps（项目根 .npmrc / package-lock 共同约定）
# ============================================================
set -eu

# 切到国内 npm 镜像
npm config set registry https://registry.npmmirror.com

# 干净安装依赖（lockfile 优先）
npm ci --legacy-peer-deps
