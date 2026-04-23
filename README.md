# Alzheimer System Consolidation

This repository contains the consolidated SLIM platform after migration of the MALEK features into the SLIM microservice architecture.

The active production path is:

- Angular frontend: `frontend/alzheimer-angular2`
- API entry point: `backend/api-gateway`
- Identity and access management: Keycloak
- Service discovery: Eureka
- Business services: `patient-service`, `cognitive-service`, `user-service`, `AlzheimerApp`, `gestion-patient`, `gestion-livreur`

The consolidation rules enforced in this codebase are:

- All frontend REST calls go through the API gateway
- All business microservices validate Keycloak JWTs
- MALEK patient management logic lives in `gestion-patient`
- MALEK delivery and logistics logic lives in `gestion-livreur`
- Support-network features remain in `AlzheimerApp` and use the renamed `/api/support-patients` surface

## Project Overview

The platform supports four major business domains:

- Core identity and user provisioning with role-based access
- Patient medical management for doctors and caregivers
- Cognitive and self-service patient clinical reporting
- Support-network coordination, alerts, reports, missions, and logistics delivery flows

### Modules

- `api-gateway`: single external entry point on port 8080
- `discovery-server`: Eureka registry for dynamic service registration
- `user-service`: user persistence, registration, Keycloak sync, role mapping
- `patient-service`: patient self-service and clinical record APIs used by the cognitive flow
- `cognitive-service`: cognitive activity tracking
- `AlzheimerApp`: support-network domain, alerts, missions, dashboard, reports, notifications, support patients
- `gestion-patient`: consolidated MALEK medical management domain: patients, treatments, medical records, emergency contacts, articles, comments
- `gestion-livreur`: consolidated MALEK delivery and logistics domain: staff, shifts, routes, stops, assignments, meal slots, delivery tasks, chatbot, location tracking
- `frontend/alzheimer-angular2`: active Angular application used for the merged UI

## Architecture Diagram

```text
Browser (Angular alzheimer-angular2, :4200)
    |
    | /api/*
    v
API Gateway (:8080)
    |
    +--> user-service (:8084)
    +--> patient-service (:8082)
    +--> cognitive-service (:8083)
    +--> AlzheimerApp / support-network (:8085)
    +--> gestion-patient (:8086)
    +--> gestion-livreur (:8087)

All services register into:
    Eureka Discovery Server (:8761)

All authentication and JWT issuance:
    Keycloak (:8081, realm: alzheimer-realm)

Frontend real-time notifications:
    /ws -> support-network WebSocket endpoint
```

### Gateway Route Map

- `/api/users/**` -> `user-service`
- `/api/patients/**`, `/api/clinical-records/**` -> `patient-service`
- `/api/cognitive-activities/**` -> `cognitive-service`
- `/api/alerts/**`, `/api/missions/**`, `/api/members/**`, `/api/availability/**`, `/api/skills/**`, `/api/notifications/**`, `/api/reports/**`, `/api/dispatch/**`, `/api/engine/**`, `/api/network/**`, `/api/dashboard/**`, `/api/support-patients/**` -> `AlzheimerApp`
- `/api/patient/**`, `/api/treatment/**`, `/api/medicalRecord/**`, `/api/emergencyContact/**`, `/api/articles/**`, `/api/comments/**` -> `gestion-patient`
- `/api/delivery-patients/**`, `/api/staff-profiles/**`, `/api/shifts/**`, `/api/routes/**`, `/api/route-stops/**`, `/api/assignments/**`, `/api/delivery-tasks/**`, `/api/meal-slots/**`, `/api/locations/**`, `/api/livreur-chatbot/**` -> `gestion-livreur`

## How To Run The Project

### Prerequisites

- Java 17
- Maven 3.9+ or the provided Maven wrapper scripts
- Node.js 18+
- npm
- Docker Desktop or Docker Engine

The project now provides MySQL through Docker Compose, so a separate host MySQL installation is not required.

### 1. Start Infrastructure

From the repository root:

```bash
docker compose -f docker/docker-compose.yml up -d --remove-orphans
```

This starts:

- MySQL on port 3306
- Keycloak on port 8081
- RabbitMQ on ports 5672 and 15672

Spring Boot services default to:

- `DB_HOST=localhost`
- `DB_PORT=3306`
- `DB_USER=alzheimer_app`
- `DB_PASSWORD=alzheimer_app`

Wait until MySQL is healthy before starting Spring Boot services:

```bash
docker compose -f docker/docker-compose.yml ps
```

If you already had an older MySQL volume from a previous run, initialize the application user once:

```bash
docker exec alzheimer-mysql mysql -uroot -e "CREATE USER IF NOT EXISTS 'alzheimer_app'@'%' IDENTIFIED BY 'alzheimer_app'; GRANT ALL PRIVILEGES ON userdb.* TO 'alzheimer_app'@'%'; GRANT ALL PRIVILEGES ON cognitivedb.* TO 'alzheimer_app'@'%'; GRANT ALL PRIVILEGES ON patientdb.* TO 'alzheimer_app'@'%'; GRANT ALL PRIVILEGES ON patientdb1.* TO 'alzheimer_app'@'%'; GRANT ALL PRIVILEGES ON gestion_patients.* TO 'alzheimer_app'@'%'; GRANT ALL PRIVILEGES ON gestion_livreur.* TO 'alzheimer_app'@'%'; GRANT ALL PRIVILEGES ON alzheimer_db.* TO 'alzheimer_app'@'%'; FLUSH PRIVILEGES;"
```

### 2. Start Discovery Server

```bash
cd backend/discovery-server
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd backend/discovery-server
.\mvnw.cmd spring-boot:run
```

### 3. Start API Gateway

```bash
cd backend/api-gateway
./mvnw spring-boot:run
```

### 4. Start All Microservices

Start each service in its own terminal after Eureka is available:

```bash
cd backend/user-service
./mvnw spring-boot:run
```

```bash
cd backend/patient-service
./mvnw spring-boot:run
```

```bash
cd backend/cognitive-service
./mvnw spring-boot:run
```

```bash
cd backend/AlzheimerApp
./mvnw spring-boot:run
```

```bash
cd backend/gestion-patient
./mvnw spring-boot:run
```

```bash
cd backend/gestion-livreur
./mvnw spring-boot:run
```

### 5. Start Angular Frontend

```bash
cd frontend/alzheimer-angular2
npm install
npm start
```

The production frontend runs on port 4200 and is the only Angular app that should be started for normal development and testing.

Frontend runtime behavior:

- The active app is `frontend/alzheimer-angular2`
- It keeps the merged UI shell, pages, and styling from the legacy frontend while remaining the single production frontend
- It proxies all REST calls through `/api` to the API Gateway on port 8080
- It initializes Keycloak before Angular bootstraps
- Visiting `/` or any protected route automatically redirects to Keycloak login when no session is active
- The public routes kept for UX and onboarding are `/landing` and `/register`
- After login, the frontend syncs the authenticated Keycloak user with `user-service`
- Bearer tokens are attached automatically to `/api/**` requests
- Role-based route guards are enforced for `ADMIN`, `DOCTOR`, `CAREGIVER`, `SOIGNANT`, `LIVREUR`, and `PATIENT`

Keycloak frontend configuration:

- Realm: `alzheimer-realm`
- Client ID: `alzheimer-frontend`
- Keycloak URL: `http://localhost:8081`

## Ports Table

| Component | Port | Purpose |
| --- | --- | --- |
| Angular frontend (`alzheimer-angular2`) | 4200 | Active user interface |
| API Gateway | 8080 | Single REST entry point |
| Keycloak | 8081 | Authentication and JWT issuance |
| MySQL | 3306 | Shared database server for all Spring Boot services |
| patient-service | 8082 | Patient self-service and clinical records |
| cognitive-service | 8083 | Cognitive activity APIs |
| user-service | 8084 | User sync and user management |
| AlzheimerApp | 8085 | Support-network, alerts, missions, reports |
| gestion-patient | 8086 | Consolidated MALEK patient management |
| gestion-livreur | 8087 | Consolidated MALEK logistics and delivery |
| discovery-server | 8761 | Eureka registry |

## Authentication Guide

### Keycloak Usage

- Realm: `alzheimer-realm`
- Frontend client: `alzheimer-frontend`
- The Angular app initializes Keycloak before bootstrapping the application module
- After login, the frontend syncs the authenticated user into `user-service` if the user does not already exist in the local application database

### Role Mapping

Supported application roles:

- `ADMIN`
- `DOCTOR`
- `CAREGIVER`
- `SOIGNANT`
- `LIVREUR`
- `PATIENT`

### JWT Flow

1. The user authenticates with Keycloak
2. Keycloak returns an access token to the Angular frontend
3. The frontend sends the bearer token on outgoing HTTP requests
4. The API gateway validates the JWT
5. Downstream microservices also validate JWTs as defense-in-depth
6. Controllers and service logic apply role-based behavior on top of authenticated identity

## Development Rules

- Do not call backend services directly from frontend feature code; always use `/api` through the gateway
- Do not hardcode backend ports in Angular feature services
- Keep Keycloak configuration centralized in the frontend bootstrap and Keycloak config
- Keep environment-specific configuration in environment files, Spring properties, or environment variables
- Keep MALEK medical logic only in `gestion-patient`
- Keep MALEK logistics logic only in `gestion-livreur`
- Do not reintroduce duplicate `org.example.alzheimerapp` code into the support-network service
- Do not expose unauthenticated business APIs; only health checks and explicitly token-based email action endpoints may remain public where already designed

## Validation Summary

The merged codebase has been validated at the repository level with these checks:

- Angular frontend build succeeds for `frontend/alzheimer-angular2`
- Gateway routing includes all consolidated medical, logistics, cognitive, support-network, and user endpoints
- Consolidated services `gestion-patient` and `gestion-livreur` are present in the backend parent build
- Support-network patient routing uses `/api/support-patients` to avoid collision with medical and delivery patient domains
- Remaining direct frontend REST calls were removed in favor of gateway-relative `/api` access

## Active Frontend

The active merged frontend is `frontend/alzheimer-angular2`.

`frontend/alzheimer-angular` is now legacy reference code only. It can be ignored for development and can be deleted once you no longer need it for historical comparison. New development, testing, and runtime validation must target `frontend/alzheimer-angular2` only.