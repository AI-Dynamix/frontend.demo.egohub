pipeline {
    agent {
        label 'aidx-demo'
    }

    // tools {
    //     'org.jenkinsci.plugins.docker.commons.tools.DockerTool' 'docker'
    // }

    environment {
        branch= "main"
        repo= "zframe-aloai-frontend"
        COMMIT_HASH = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        BUILD_DATE = sh(script: "TZ='Asia/Ho_Chi_Minh' date +%Y%m%d-%H%M%S", returnStdout: true).trim()
        IMAGE_TAG = "${COMMIT_HASH}-${BUILD_DATE}"
    }

    stages {
        stage('Clone') {
            steps {
                git branch: "${env.branch}", credentialsId: "CREDENTIALS", url: "${env.gitZframeAloaiFrontendURL}"
            }
        }
        // stage('Create environment') {
        //     steps {
        //         sh """
        //             ls
        //             cat <<EOF > .env
        //             # API URL
        //             VITE_DEFAULT_LANGUAGE=vi
        //             VITE_FILE_RESOURCE_URL=${env.SWAPY_API}
        //             VITE_API_BASE_URL=${env.SWAPY_API}
        //             VITE_RECAPTCHA_SITE_KEY=${env.SWAPY_RECAPTCHA}
        //             EOF
        //         """

        //         // sh "cat .env"
                
        //         // echo "Building image with tag: ${env.swapyPartnerFe}:${env.IMAGE_TAG}"
        //         // echo "Commit Hash: ${env.COMMIT_HASH}"
        //         // echo "Build Date (Asia/Ho_Chi_Minh): ${env.BUILD_DATE}"
        //     }
        // }
        stage('Cleanup old images') {
            steps {
                sh '''#!/bin/bash
                    echo "Cleaning up old ${repo} images..."
                    if docker images | grep -q ${repo}; then
                        COUNT=$(docker images | grep ${repo} | wc -l)
                        if [ "$COUNT" -gt 2 ]; then
                            echo "Found $COUNT ${repo} images, removing them..."
                            docker images | grep ${repo} | awk '{print $1":"$2}' | xargs -r docker rmi || true
                            echo "Old images cleaned up"
                        else
                            echo "Found only $COUNT ${repo} images, keeping them."
                        fi
                    else
                        echo "No existing ${repo} images found"
                    fi
                '''
            }
        }

        stage('Build resource') {
            steps {
                sh """
                  docker-compose down
                
                  # Build image with specific tag
                  docker build -t ${repo}:${IMAGE_TAG} .
                  
                  # Update docker-compose.yaml to use the new specific tag
                  sed -i "s|image: zframe-aloai-frontend.*|image: zframe-aloai-frontend:${IMAGE_TAG}|g" docker-compose.yaml
                  
                  echo "Built new image: ${repo}:${IMAGE_TAG}"
                  echo "Updated docker-compose to use: ${repo}:${IMAGE_TAG}"
                  echo "Updated docker-compose.yaml:"
                  cat docker-compose.yaml | grep "image:"
                """
            }
        }
        stage('Start resource') {
            steps {
                sh 'docker-compose up -d'
            }
        }
    }
}
