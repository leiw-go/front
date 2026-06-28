// ============================================================
// Jenkinsfile — 部署前端（Ant Design Pro / Umi Max）到本机 Docker
//
// 用法：在 Jenkins 中创建一个 Pipeline from SCM 任务
//   1. SCM = Git
//      Repository URL  = git@github.com:leiw-go/front.git
//      Credentials     = github-ssh-key（init.groovy.d 已自动创建）
//      Branch Specifier = */master
//   2. Script Path = Jenkinsfile
//   3. 触发方式：手动 Build with Parameters，或加 GitHub webhook
//
// 部署流程：
//   0. 装 docker CLI（如果容器里没有）—— 静态二进制，幂等
//   1. 多阶段构建镜像（node:22-alpine build → nginx:alpine serve）
//   2. 停掉旧 frontend 容器，启动新容器并 publish 8000 到宿主机
//   3. 等容器内 nginx 就绪，curl /healthz 验证
//
// 前置条件：
//   - Jenkins 容器已挂 /var/run/docker.sock（docker-out-of-docker）
//   - deploy-net 网络会在首次部署时自动创建
// ============================================================

pipeline {
    agent any

    parameters {
        string(name: 'FRONTEND_TAG', defaultValue: 'latest', description: '镜像 tag')
        booleanParam(name: 'CLEAN_IMAGE', defaultValue: false, description: '构建前清理同名旧镜像')
        booleanParam(name: 'CLEAN_BUILD', defaultValue: false, description: '清理 node_modules 后重新安装依赖')
    }

    environment {
        FRONTEND_IMAGE = 'leiw-go/front'
        FRONTEND_NAME  = 'frontend'
        FRONTEND_PORT  = '8000'
        HOST_NETWORK   = 'deploy-net'
        // 把 $HOME/.local/bin 放到 PATH 头部，这样 stage 0 安装的 docker CLI 后续阶段也能找到
        PATH = "$HOME/.local/bin:$PATH"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {

        stage('0. Install docker CLI') {
            steps {
                sh '''
                    set -eux
                    DOCKER_BIN="$HOME/.local/bin/docker"
                    if [ -x "$DOCKER_BIN" ] && "$DOCKER_BIN" version >/dev/null 2>&1; then
                        echo "==> docker CLI already installed: $("$DOCKER_BIN" --version)"
                        exit 0
                    fi

                    DOCKER_VERSION=27.5.1
                    mkdir -p "$(dirname "$DOCKER_BIN")"
                    curl -fsSL "https://mirrors.aliyun.com/docker-ce/linux/static/stable/x86_64/docker-${DOCKER_VERSION}.tgz" -o /tmp/docker.tgz
                    tar -xzf /tmp/docker.tgz -C /tmp/
                    mv /tmp/docker/docker "$DOCKER_BIN"
                    rm -rf /tmp/docker /tmp/docker.tgz

                    "$DOCKER_BIN" --version
                    "$DOCKER_BIN" info >/dev/null 2>&1 || { echo "WARN: docker info failed (socket not reachable?)"; }
                '''
            }
        }

        stage('1. Build Image') {
            steps {
                script {
                    if (params.CLEAN_IMAGE) {
                        sh "docker rmi -f ${FRONTEND_IMAGE}:${params.FRONTEND_TAG} || true"
                    }
                    if (params.CLEAN_BUILD) {
                        sh 'rm -rf node_modules package-lock.json || true'
                    }
                }
                sh "docker build -t ${FRONTEND_IMAGE}:${params.FRONTEND_TAG} ."
                sh "docker images --format '{{.Repository}}:{{.Tag}} {{.Size}}' | grep ${FRONTEND_IMAGE} || true"
            }
        }

        stage('2. Deploy Container') {
            steps {
                sh """
                    set -eux

                    # deploy-net 与 backend / config-server 共用同一网络
                    docker network inspect ${HOST_NETWORK} >/dev/null 2>&1 || docker network create ${HOST_NETWORK}

                    # 停掉旧容器
                    docker rm -f ${FRONTEND_NAME} 2>/dev/null || true

                    # 启动新容器（端口直接 publish 到宿主机，与 backend 形态一致）
                    docker run -d \\
                        --name ${FRONTEND_NAME} \\
                        --network ${HOST_NETWORK} \\
                        --restart unless-stopped \\
                        -p ${FRONTEND_PORT}:${FRONTEND_PORT} \\
                        --log-driver json-file \\
                        --log-opt max-size=50m \\
                        --log-opt max-file=10 \\
                        ${FRONTEND_IMAGE}:${params.FRONTEND_TAG}

                    # 等容器内 nginx 就绪（健康检查）
                    for i in 1 2 3 4 5 6 7 8; do
                        sleep 2
                        if docker exec ${FRONTEND_NAME} wget -qO- http://127.0.0.1:${FRONTEND_PORT}/healthz 2>/dev/null | grep -q ok; then
                            echo "==> frontend container ready"
                            break
                        fi
                        if [ \$i -eq 8 ]; then
                            echo "==> frontend container not ready; check: docker logs ${FRONTEND_NAME}"
                            docker logs ${FRONTEND_NAME} || true
                            exit 1
                        fi
                    done
                """
            }
        }

        stage('3. Verify') {
            steps {
                sh """
                    curl -fsS http://127.0.0.1:${FRONTEND_PORT}/healthz && echo
                    echo "==> Browse: http://localhost:${FRONTEND_PORT}/  (Windows host)"
                """
            }
        }
    }

    post {
        success {
            echo "✅ frontend deploy OK. image=${FRONTEND_IMAGE}:${params.FRONTEND_TAG}"
            echo "   容器: docker ps -f name=${FRONTEND_NAME}"
            echo "   日志: docker logs -f ${FRONTEND_NAME}"
            echo "   访问: http://localhost:${FRONTEND_PORT}/"
        }
        failure {
            echo "❌ frontend deploy failed. debug:"
            echo "   docker ps -a | grep ${FRONTEND_NAME}"
            echo "   docker logs ${FRONTEND_NAME}"
        }
    }
}