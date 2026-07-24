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
                    IMAGE_NAME=${FRONTEND_IMAGE} \
                    IMAGE_TAG=${params.FRONTEND_TAG} \
                    CONTAINER_NAME=${FRONTEND_NAME} \
                    NETWORK=${HOST_NETWORK} \
                    PORT=${FRONTEND_PORT} \
                        bash ./scripts/jenkins/deploy-container.sh
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
