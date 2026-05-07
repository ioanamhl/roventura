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
                powershell """
                    cd \$env:FRONTEND_DIR

                    npm.cmd ci
                    npm.cmd run build

                    cd ..

                    if (Test-Path \$env:ARTIFACT_DIR) {
                        Remove-Item \$env:ARTIFACT_DIR -Recurse -Force
                    }

                    New-Item -ItemType Directory -Path \$env:ARTIFACT_DIR | Out-Null

                    Compress-Archive `
                        -Path "\$env:FRONTEND_DIR\\dist\\*" `
                        -DestinationPath "\$env:ARTIFACT_DIR\\frontend-dist.zip" `
                        -Force
                """
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
