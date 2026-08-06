pipeline {
    agent any

    environment {
        GIT_URL = 'https://github.com/Neueda-Learning/11_105_TxnSync.git'
        BRANCH = 'develop'
        
        SERVER_IP = '10.9.73.138'
    }

    stages {
        stage('Checkout Source') {
            steps {
                echo 'Checking out full-stack source code...'
                git branch: "${BRANCH}", url: "${GIT_URL}"
            }
        }

        stage('Configure Frontend API') {
            steps {
                echo 'Injecting Server IP and port 8082 into frontend configuration...'
                sh "sed -i 's/localhost:8082/${SERVER_IP}:8082/g' frontend/js/api.js"
            }
        }

        stage('Stop Existing Environment') {
            steps {
                echo 'Tearing down old containers...'
                sh 'docker-compose down || true'
            }
        }

       stage('Build & Deploy Full Stack') {
            steps {
                echo 'Building Frontend & Backend images, and launching Database...'
                
                withCredentials([string(credentialsId: 'txnsync-db-password', variable: 'SECRET_DB_PASS')]) {
                    sh """
                        export DB_PASSWORD=\$SECRET_DB_PASS
                        export SERVER_IP=${SERVER_IP}
                        docker-compose up -d --build
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                sh 'docker ps'
                echo '===================================================='
                echo '✅ TxnSync is Live!'
                echo "🌐 Dashboard accessible at: http://${SERVER_IP}:8083"
                echo "🔌 Backend API accessible at: http://${SERVER_IP}:8082"
                echo '===================================================='
            }
        }
    }
}