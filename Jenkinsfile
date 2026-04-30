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
    image: bitnami/kubectl:1.29
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
        stage('Build Backend') {
            steps {
                container('maven') {
                    dir('backend') {
                        sh 'mvn clean install -DskipTests'
                    }
                }
            }
        }
        stage('Dockerize') {
            steps {
                container('docker') {
                    sh 'docker build -t alzheimer-user-service:latest ./backend/user-service'
                }
            }
        }
        stage('Deploy') {
            steps {
                container('kubectl') {
                    sh 'kubectl apply -f k8s/microservices.yaml -n alzheimer'
                }
            }
        }
    }
}
