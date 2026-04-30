pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: maven
    image: maven:3.8.6-openjdk-11
    command: ['cat']
    tty: true
  - name: docker
    image: docker:20.10.12
    command: ['cat']
    tty: true
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
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
        stage('Dockerize & Push') {
            steps {
                container('docker') {
                    sh 'docker build -t alzheimer-user-service:latest ./backend/user-service'
                    // In a real setup, you would push to Nexus here
                }
            }
        }
        stage('Deploy to K8s') {
            steps {
                sh 'kubectl apply -f k8s/microservices.yaml -n alzheimer'
            }
        }
    }
}
