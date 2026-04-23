---
status: resolved
trigger: "Investigate the MySQL connection failure for the consolidated project at c:\\Users\\ashre\\Desktop\\microservices\\slim\\alzheimer-system."
created: 2026-04-20T00:00:00Z
updated: 2026-04-20T00:30:00Z
---

## Current Focus

hypothesis: Confirmed. The active compose stack does not provide MySQL, while host-run services require a MySQL listener on localhost:3306.
test: Compare active compose services, running containers, Spring datasource URLs, and migration/database naming references.
expecting: No MySQL service in active compose; datasource URLs fixed to localhost:3306; schema naming drift documented separately.
next_action: return diagnosis and recommended fix plan

## Symptoms

expected: All Spring Boot services should start successfully with mvn spring-boot:run from the Windows host.
actual: Spring Boot services fail on startup with MySQL Communications link failure and java.net.ConnectException Connection refused.
errors: MySQL Communications link failure; java.net.ConnectException Connection refused.
reproduction: Start infrastructure with docker compose, then run each Spring Boot service locally with mvn spring-boot:run on Windows.
started: Current consolidated project state; no reachable MySQL server for host-run services.

## Eliminated

## Evidence

- timestamp: 2026-04-20T00:10:00Z
	checked: docker/docker-compose.yml
	found: Active consolidated compose defines only keycloak and rabbitmq services; no mysql service is present.
	implication: docker compose up cannot provide a database endpoint for Spring Boot services.

- timestamp: 2026-04-20T00:12:00Z
	checked: docker compose -f docker/docker-compose.yml ps
	found: Running containers are only keycloak and rabbitmq.
	implication: No MySQL container is running from the active consolidated stack.

- timestamp: 2026-04-20T00:15:00Z
	checked: backend application.properties files
	found: AlzheimerApp, patient-service, cognitive-service, user-service, gestion-patient, and gestion-livreur all use jdbc:mysql://localhost:3306/... datasource URLs.
	implication: For host-run services, localhost is the intended host, but startup fails because nothing is listening on port 3306.

- timestamp: 2026-04-20T00:18:00Z
	checked: README.md
	found: Repository docs state MySQL must be running locally before starting services.
	implication: The current consolidated project still assumes a host-accessible MySQL server outside the active compose stack.

- timestamp: 2026-04-20T00:22:00Z
	checked: keycloak/realm-config/docker-import-example.yml
	found: An older example compose contains a mysql service named mysql and uses container-to-container hostname mysql.
	implication: mysql is only correct for containers on the Docker network, not for mvn spring-boot:run on the Windows host.

- timestamp: 2026-04-20T00:26:00Z
	checked: database/migrations and patient-service configuration
	found: patient-service uses patientdb1, but migration assets reference patientdb and many migration docs/scripts still target alzheimer_db.
	implication: Even after connectivity is fixed, schema naming drift will cause migration or manual setup mistakes.

## Resolution

root_cause: The consolidated project's active infrastructure stack does not start MySQL, but six Spring Boot services are configured to connect from the Windows host to localhost:3306. Because no MySQL server is reachable there, startup fails with Communications link failure / Connection refused.
fix: Read-only diagnosis only. Safest fix is to provide a MySQL server on host-accessible localhost:3306 for host-run services, preferably by adding a MySQL container with published port 3306 and explicit initialization for all required schemas, then optionally standardizing datasource settings and schema names.
verification: Confirmed by inspection of active docker compose, docker compose ps output, service datasource URLs, README prerequisites, and migration/schema references.
files_changed: []
