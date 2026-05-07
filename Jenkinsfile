pipeline {
    agent any

    environment {
        FRONTEND_DIR = "my-app"
        ARTIFACT_DIR = "artifacts"
    }

    stages {
        stage("Checkout") {
            steps {
                checkout scm
            }
        }

        stage("Build frontend artifact") {
            steps {
                dir("${FRONTEND_DIR}") {
                    powershell "npm.cmd ci"
                    powershell "npm.cmd run build"
                }
            }
        }

        stage("Create Jenkins artifact") {
            steps {
                powershell '''
                    if (Test-Path "artifacts") {
                        Remove-Item "artifacts" -Recurse -Force
                    }

                    New-Item -ItemType Directory -Path "artifacts" | Out-Null
                    Compress-Archive -Path "my-app\\dist\\*" -DestinationPath "artifacts\\frontend-dist.zip" -Force
                '''
            }
        }

        stage("Archive artifact in Jenkins") {
            steps {
                archiveArtifacts artifacts: "artifacts/frontend-dist.zip", fingerprint: true
            }
        }

        stage("Test compose config") {
            steps {
                powershell """
                    docker compose config
                """
            }
        }

        stage("Deploy") {
            steps {
                powershell """
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
