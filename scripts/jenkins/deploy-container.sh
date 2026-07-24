#!/bin/sh
# ============================================================
# deploy-container.sh - 部署新镜像到运行容器
#
# 由 Jenkinsfile stage 2 调用（也可单独调试用）：
#   IMAGE_NAME=leiw-go/front IMAGE_TAG=latest \
#   CONTAINER_NAME=frontend NETWORK=deploy-net PORT=8000 \
#     bash ./scripts/jenkins/deploy-container.sh
#
# 流程：
#   1. network inspect，不存在则创建
#   2. 停掉旧容器（如果有）
#   3. 启动新容器（端口 publish、json-file 日志限大小）
#   4. 轮询 /healthz，最多重试 HEALTH_RETRIES × 2s
# ============================================================
set -eu

# ---- 可调参数（环境变量覆盖） ----
IMAGE_NAME="${IMAGE_NAME:-leiw-go/front}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONTAINER_NAME="${CONTAINER_NAME:-frontend}"
NETWORK="${NETWORK:-deploy-net}"
PORT="${PORT:-8000}"
LOG_MAX_SIZE="${LOG_MAX_SIZE:-50m}"
LOG_MAX_FILE="${LOG_MAX_FILE:-10}"
HEALTH_PATH="${HEALTH_PATH:-/healthz}"
HEALTH_RETRIES="${HEALTH_RETRIES:-8}"   # 8 × 2s = 16s 兜底

log() { printf '[deploy] %s\n' "$*"; }
die() { log "ERROR: $*"; exit 1; }

# ---- 1. 网络 ----
if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
  log "creating network: $NETWORK"
  docker network create "$NETWORK"
fi

# ---- 2. 清理旧容器（可能不存在，吞掉错误） ----
if docker rm -f "$CONTAINER_NAME" 2>/dev/null; then
  log "removed old container: $CONTAINER_NAME"
fi

# ---- 3. 启动新容器 ----
log "starting: ${IMAGE_NAME}:${IMAGE_TAG}"
docker run -d \
  --name "$CONTAINER_NAME" \
  --network "$NETWORK" \
  --restart unless-stopped \
  -p "${PORT}:${PORT}" \
  --log-driver json-file \
  --log-opt "max-size=${LOG_MAX_SIZE}" \
  --log-opt "max-file=${LOG_MAX_FILE}" \
  "${IMAGE_NAME}:${IMAGE_TAG}"

# ---- 4. 健康检查 ----
i=0
while [ "$i" -lt "$HEALTH_RETRIES" ]; do
  i=$((i + 1))
  sleep 2
  if docker exec "$CONTAINER_NAME" wget -qO- "http://127.0.0.1:${PORT}${HEALTH_PATH}" 2>/dev/null | grep -q ok; then
    log "container ready"
    exit 0
  fi
done

# 到了 retries 还没起来 —— 失败兜底，打日志退出非 0
log "container not ready after $((HEALTH_RETRIES * 2))s; check: docker logs $CONTAINER_NAME"
docker logs "$CONTAINER_NAME" || true
die "container failed health check"
