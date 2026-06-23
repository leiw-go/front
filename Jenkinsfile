// ============================================================
// Jenkinsfile — 部署前端（Ant Design Pro / Umi Max）到本机 Docker
//
// 用法：在 Jenkins 中创建一个 Pipeline 任务，把本文件作为 Pipeline Script
//   1. 任务配置里 SCM = Git, URL = git@github.com:leiw-go/front.git, Branch = master
//   2. 流水线定义 = Pipeline script from SCM
//   3. 触发方式：手动 Build with Parameters，或加 GitHub webhook
//
// 部署流程（容器 + 共享 volume 方案）：
//   1. 多阶段构建镜像（node:22 build → nginx:alpine serve）
//   2. 从镜像里把 dist/ 抽到宿主机 /var/www/frontend（供宿主机 nginx 直出）
//   3. 停掉旧容器，启动新容器并把 /var/www/frontend 挂进 /usr/share/nginx/html:ro
//   4. 容器内 nginx 仍在跑（兜底 / 健康检查用），宿主机 nginx 是唯一对外入口
//
// 为什么这样：避免两层 nginx 各自做 SPA fallback 导致的 URL/端口漂移，
//   见 docs/frontend-deploy.md（如有）。
//
// 前置条件：
//   - Jenkins 容器里已经安装 docker CLI，并加入宿主机 docker 用户组
//   - deploy-net 网络已创建（docker network create deploy-net 或 docker compose up -d）
//   - 宿主机已有 /var/www/frontend 目录（Jenkinsfile 会自动创建）
// ============================================================

pipeline {
    agent any

    parameters {
        string(name: 'FRONTEND_TAG', defaultValue: 'latest', description: '镜像 tag')
        booleanParam(name: 'CLEAN_IMAGE', defaultValue: false, description: '构建前清理同名旧镜像')
        booleanParam(name: 'CLEAN_BUILD', defaultValue: false, description: '清理 node_modules 后重新安装')
    }

    environment {
        FRONTEND_IMAGE = 'leiw-go/front'
        FRONTEND_NAME  = 'frontend'
        // 宿主机目录：宿主机 nginx 直接 serve 它（不再走容器 nginx）
        HOST_FRONTEND_DIR = '/var/www/frontend'
        // 容器内 nginx 的 root，会被 volume 覆盖
        CONTAINER_NGINX_ROOT = '/usr/share/nginx/html'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {

        stage('1. Build Image') {
            steps {
                script {
                    if (params.CLEAN_IMAGE) {
                        sh "docker rmi -f ${FRONTEND_IMAGE}:${params.FRONTEND_TAG} || true"
                    }
                    if (params.CLEAN_BUILD) {
                        sh "rm -rf node_modules package-lock.json || true"
                    }
                }
                sh "docker build -t ${FRONTEND_IMAGE}:${params.FRONTEND_TAG} ."
                sh "docker images | grep ${FRONTEND_IMAGE} || true"
            }
        }

        stage('2. Sync dist to host') {
            steps {
                sh """
                    set -eux
                    # 确保宿主机目录存在，归属 ubuntu:ubuntu（与 nginx 读取权限匹配）
                    mkdir -p ${HOST_FRONTEND_DIR}
                    chown -R ubuntu:ubuntu ${HOST_FRONTEND_DIR} 2>/dev/null || true

                    # 用 docker create（不启动）创建一个临时容器，把构建产物抽出来
                    TMP_CONTAINER="\${FRONTEND_NAME}-extract-\${BUILD_NUMBER}"
                    docker rm -f \${TMP_CONTAINER} 2>/dev/null || true
                    docker create \\
                        --name \${TMP_CONTAINER} \\
                        ${FRONTEND_IMAGE}:${params.FRONTEND_TAG}

                    # 清空旧文件再拷贝，避免陈旧文件残留
                    rm -rf ${HOST_FRONTEND_DIR}/* ${HOST_FRONTEND_DIR}/.[!.]* 2>/dev/null || true
                    docker cp \${TMP_CONTAINER}:${CONTAINER_NGINX_ROOT}/. ${HOST_FRONTEND_DIR}/

                    docker rm \${TMP_CONTAINER}
                    echo "==> synced to ${HOST_FRONTEND_DIR}:"
                    ls -la ${HOST_FRONTEND_DIR} | head -10
                """
            }
        }

        stage('3. Restart Container') {
            steps {
                sh """
                    set -eux
                    # 确保 deploy-net 网络存在（即使 jenkins-deploy compose 未运行）
                    docker network inspect deploy-net >/dev/null 2>&1 || docker network create deploy-net

                    docker rm -f \${FRONTEND_NAME} || true

                    docker run -d \\
                        --name \${FRONTEND_NAME} \\
                        --network deploy-net \\
                        --restart unless-stopped \\
                        -p 127.0.0.1:8000:8000 \\
                        -v ${HOST_FRONTEND_DIR}:${CONTAINER_NGINX_ROOT}:ro \\
                        --log-driver json-file \\
                        --log-opt max-size=50m \\
                        --log-opt max-file=10 \\
                        ${FRONTEND_IMAGE}:${params.FRONTEND_TAG}

                    # 等容器内 nginx 就绪（健康检查）
                    for i in 1 2 3 4 5 6 7 8; do
                        sleep 2
                        if docker exec \${FRONTEND_NAME} wget -qO- http://127.0.0.1:8000/healthz 2>/dev/null | grep -q ok; then
                            echo "==> frontend container ready"
                            break
                        fi
                        if [ \$i -eq 8 ]; then
                            echo '==> frontend container not ready; check: docker logs \${FRONTEND_NAME}'
                            docker logs \${FRONTEND_NAME} || true
                            exit 1
                        fi
                    done

                    # 验证宿主机 nginx 直出也能拿到内容
                    if curl -fsS -o /dev/null http://127.0.0.1/healthz; then
                        echo "==> host nginx serving frontend OK"
                    else
                        echo "==> WARN: host nginx healthz failed; check /var/www/frontend and host nginx config"
                    fi
                """
            }
        }
    }

    post {
        success {
            echo "✅ frontend deploy OK. image=\${env.FRONTEND_IMAGE}:\${params.FRONTEND_TAG}"
            echo "   容器（兜底/健康检查）: docker logs -f \${env.FRONTEND_NAME}"
            echo "   宿主机直出:           curl http://localhost/"
            echo "   静态文件目录:         ${HOST_FRONTEND_DIR}"
        }
        failure {
            echo "❌ frontend deploy failed. debug:"
            echo "   docker ps -a | grep \${env.FRONTEND_NAME}"
            echo "   docker logs \${env.FRONTEND_NAME}"
            echo "   sudo tail -50 /var/log/nginx/services_error.log"
        }
        always {
            deleteDir()
        }
    }
}
