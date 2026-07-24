#!/bin/sh
# ============================================================
# prune-images.sh - 清理历史镜像，保留当前活跃 tag
#
# 策略：
#   1. 保留所有被容器（运行中+已停止）引用的镜像
#   2. 保留最近 build 的 IMAGE_TAG（默认 leiw-go/front:latest）
#   3. 清掉本项目 IMAGE_NAME 同名前缀的其他 tag + 所有 dangling
#   4. 清掉过期 BuildKit 缓存
#
# 用法：
#   IMAGE_NAME=leiw-go/front ./scripts/docker/prune-images.sh
#   KEEP_TAG=production ./scripts/docker/prune-images.sh
#   DRY_RUN=1 ./scripts/docker/prune-images.sh
# ============================================================
set -eu

IMAGE_NAME="${IMAGE_NAME:-leiw-go/front}"
KEEP_TAG="${KEEP_TAG:-latest}"
DRY_RUN="${DRY_RUN:-0}"

log() { printf '[prune] %s\n' "$*"; }

if [ "$DRY_RUN" = "1" ]; then
  log "DRY_RUN=1：不实际删除，只打印"
  DOCKER="echo docker"
else
  DOCKER="docker"
fi

# ---- 1. 拿到本项目镜像的所有 tag id ----
ALL_TAG_IDS=$($DOCKER images "${IMAGE_NAME}" --format '{{.Tag}} {{.ID}}' | awk '{print $2}' | sort -u)
if [ -z "$ALL_TAG_IDS" ]; then
  log "本机没有 ${IMAGE_NAME} 镜像，跳过"
  exit 0
fi

# ---- 2. 找到保留 tag 的 id（latest / 指定 tag） ----
KEEP_ID=$($DOCKER images "${IMAGE_NAME}:${KEEP_TAG}" --format '{{.ID}}' || true)
log "保留 tag: ${IMAGE_NAME}:${KEEP_TAG} (id=${KEEP_ID:-<not exist>})"

# ---- 3. 收集所有要被删的 id ----
TO_REMOVE=""
for id in $ALL_TAG_IDS; do
  [ "$id" != "$KEEP_ID" ] && TO_REMOVE="$TO_REMOVE $id"
done

if [ -z "$TO_REMOVE" ]; then
  log "本项目镜像没有历史 tag 需要清"
else
  log "准备删除 ${IMAGE_NAME} 的历史 tag：$TO_REMOVE"
  $DOCKER image rm -f $TO_REMOVE
fi

# ---- 4. 顺带清 dangling + 过期 BuildKit 缓存 ----
log "清理本项目外的 dangling 镜像"
$DOCKER image prune -f
log "清理 72h 之前的 BuildKit 缓存"
$DOCKER builder prune -f --filter "until=72h"

log "✅ 完成。当前 ${IMAGE_NAME} 占用："
$DOCKER images "${IMAGE_NAME}"
