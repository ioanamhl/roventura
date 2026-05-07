pipeline {
    agent any

    environment {
        FRONTEND_DIR = "my-app"
        ARTIFACT_DIR = "artifacts"
    }

    stages {
        stage("Check Docker") {
            steps {
                sh "docker --version"
                sh "docker compose version"
            }
        }

        stage("Build frontend artifact") {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'docker run --rm -v "$PWD:/app" -w /app node:20 npm ci'
                    sh 'docker run --rm -v "$PWD:/app" -w /app node:20 npm run build'
                }
            }
        }

        stage("Create Jenkins artifact") {
            steps {
                sh '''
                    rm -rf artifacts
                    mkdir -p artifacts
                    tar -czf artifacts/frontend-dist.tar.gz -C my-app/dist .
                '''
            }
        }

        stage("Archive artifact in Jenkins") {
            steps {
                archiveArtifacts artifacts: "artifacts/frontend-dist.tar.gz", fingerprint: true
            }
        }

        stage("Test compose config") {
            steps {
                sh """
                    docker compose config
                """
            }
        }

        stage("Deploy") {
            steps {
                sh """
                    docker compose up -d --build
                    docker compose ps
                """
            }
        }
    }

    post {
        success {
            echo "CI/CD pipeline completed successfully."
        }

        failure {
            echo "Pipeline failed. Check Jenkins console logs."
        }
    }
}
