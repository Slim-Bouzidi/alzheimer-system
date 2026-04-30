pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: maven
    image: maven:3.9.6-eclipse-temurin-17
    command: ['cat']
    tty: true
  - name: docker
    image: docker:latest
    command: ['cat']
    tty: true
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
  - name: kubectl
    image: alpine/k8s:1.29.0
    command: ['cat']
    tty: true
    securityContext:
      runAsUser: 0
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
'''
        }
    }
    stages {
        stage('Build & Dockerize Backend') {
            steps {
                container('maven') {
                    dir('backend') {
                        sh 'mvn clean install -DskipTests'
                    }
                }
                container('docker') {
                    sh '''
                        docker build -t alzheimer-api-gateway:latest ./backend/api-gateway
                        docker build -t alzheimer-user-service:latest ./backend/user-service
                        docker build -t alzheimer-cognitive-service:latest ./backend/cognitive-service
                        docker build -t alzheimer-patient-service:latest ./backend/patient-service
                        docker build -t alzheimer-discovery-server:latest ./backend/discovery-server
                        docker build -t alzheimer-main-app:latest ./backend/AlzheimerApp
                    '''
                }
            }
        }
        stage('Build & Dockerize Frontend') {
            steps {
                container('docker') {
                    sh 'docker build -t alzheimer-frontend:latest ./frontend/alzheimer-angular'
                }
            }
        }
        stage('Deploy to K8s') {
            steps {
                container('kubectl') {
                    sh '''
                        kubectl apply -f k8s/configmap.yaml -n alzheimer
                        kubectl apply -f k8s/infrastructure.yaml -n alzheimer
                        kubectl apply -f k8s/discovery-server.yaml -n alzheimer
                        kubectl apply -f k8s/keycloak.yaml -n alzheimer
                        kubectl apply -f k8s/microservices.yaml -n alzheimer
                        kubectl apply -f k8s/frontend.yaml -n alzheimer
                    '''
                }
            }
        }
    }
}
