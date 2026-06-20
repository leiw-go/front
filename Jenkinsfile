// ============================================================
// Jenkinsfile — 部署前端（Ant Design Pro / Umi Max）到本机 Docker
//
// 用法：在 Jenkins 中创建一个 Pipeline 任务，把本文件作为 Pipeline Script
//   1. 任务配置里 SCM = Git, URL = git@github.com:leiw-go/front.git, Branch = master
//   2. 流水线定义 = Pipeline script from SCM
//   3. 触发方式：手动 Build with Parameters，或加 GitHub webhook
//
// 部署流程：
//   - 从当前仓库 checkout 源码
//   - 多阶段构建镜像（node:22 build → nginx:alpine serve）
//   - 停掉旧容器，重新跑 frontend 容器（连接到 deploy-net 网络）
//   - Nginx 反代通过 deploy-net 把 / 路由到 frontend:8000
//
// 前置条件：
//   - Jenkins 容器里已经安装 docker CLI
//   - deploy-net 网络已创建（docker network create deploy-net 或 docker compose up -d）
//   - 当前仓库所在机器的宿主机已经 docker login / 有足够磁盘
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

        stage('2. Restart Container') {
            steps {
                sh """
                    set -eux
                    docker rm -f \${FRONTEND_NAME} || true
                    docker run -d \\
                        --name \${FRONTEND_NAME} \\
                        --network deploy-net \\
                        --restart unless-stopped \\
                        \${FRONTEND_IMAGE}:${params.FRONTEND_TAG}

                    # 等 nginx 就绪（用 127.0.0.1 避免 IPv6 localhost 解析问题）
                    for i in 1 2 3 4 5 6 7 8; do
                        sleep 2
                        if docker exec \${FRONTEND_NAME} wget -qO- http://127.0.0.1:8000/healthz 2>/dev/null | grep -q ok; then
                            echo "==> frontend ready"
                            exit 0
                        fi
                    done
                    echo '==> frontend not ready; check: docker logs \${FRONTEND_NAME}'
                    docker logs \${FRONTEND_NAME} || true
                    exit 1
                """
            }
        }
    }

    post {
        success {
            echo "✅ frontend deploy OK. image=\${env.FRONTEND_IMAGE}:\${params.FRONTEND_TAG}"
            echo "   logs: docker logs -f \${env.FRONTEND_NAME}"
            echo "   test: curl http://localhost/  (Nginx 会路由到 frontend:8000)"
        }
        failure {
            echo "❌ frontend deploy failed. debug:"
            echo "   docker ps -a | grep \${env.FRONTEND_NAME}"
            echo "   docker logs \${env.FRONTEND_NAME}"
        }
        always {
            deleteDir()
        }
    }
}
