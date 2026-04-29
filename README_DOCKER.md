# Docker Deployment Guide

This project is now fully containerized using Docker and Docker Compose.

## Prerequisites
- Docker Desktop installed and running
- Maven installed (to build the JAR files)

## Build and Run

To start the entire system, follow these steps:

1. **Build the microservices (JAR files):**
   Open a terminal in the root directory and run:
   ```bash
   cd backend
   mvn clean package -DskipTests
   cd ..
   ```

2. **Start the system with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

## Infrastructure Services
- **Eureka Dashboard:** [http://localhost:8761](http://localhost:8761)
- **API Gateway:** [http://localhost:8080](http://localhost:8080)
- **Keycloak Admin:** [http://localhost:8081](http://localhost:8081) (Admin: `admin`/`admin`)
- **RabbitMQ Management:** [http://localhost:15672](http://localhost:15672) (Guest: `guest`/`guest`)
- **MySQL:** Port `3306` (Root: `root`)

## Networking Decisions
- **Internal Communication:** All services communicate via the `alzheimer-network` using container names as hostnames (e.g., `mysql:3306`, `discovery-server:8761`).
- **Service Discovery:** Microservices register themselves with Eureka using their service names. The API Gateway routes requests using the `lb://` protocol.
- **Persistence:** MySQL data is persisted using a Docker volume named `mysql_data`.
- **Initialization:** An `init.sql` script ensures all microservice databases (`userdb`, `patientdb`, `cognitivedb`, `gestion_patients`) are created on startup.

## Individual Services
- **User Service:** [http://localhost:8084](http://localhost:8084)
- **Patient Service:** [http://localhost:8082](http://localhost:8082)
- **Cognitive Service:** [http://localhost:8083](http://localhost:8083)
- **Alzheimer App:** [http://localhost:8085](http://localhost:8085)
