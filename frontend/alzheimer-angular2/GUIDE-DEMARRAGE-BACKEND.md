# 🚀 Guide de Démarrage du Backend Spring Boot

## 📋 Prérequis

1. **Java 17+** installé
2. **MySQL** installé et démarré
3. **Maven** installé
4. **IDE** (IntelliJ IDEA ou Eclipse)

## 🔧 Étapes de Démarrage

### 1. Créer le projet Spring Boot

Si vous n'avez pas encore de projet Spring Boot :

```bash
# Via Spring Initializr (https://start.spring.io/)
# Configuration :
- Project: Maven
- Language: Java
- Spring Boot: 3.1.x
- Group: com.assistance
- Artifact: assistanceQuotidienne2
- Packaging: Jar
- Java: 17

# Dépendances à ajouter :
- Spring Web
- Spring Data JPA
- MySQL Driver
- Spring Boot DevTools
```

### 2. Configurer application.properties

Créez le fichier `src/main/resources/application.properties` :

```properties
spring.application.name=assistanceQuotidienne2
spring.datasource.url=jdbc:mysql://localhost:3306/assistanceQuotidienne?createDatabaseIfNotExist=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
spring.jpa.show-sql=true
spring.jpa.hibernate.ddl-auto=create
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.format_sql=true
server.port=8088
spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy
spring.jpa.hibernate.naming.implicit-strategy=org.hibernate.boot.model.naming.SpringPhysicalNamingStrategy

# CORS
spring.web.cors.allowed-origins=http://localhost:4200,http://localhost:4201,http://localhost:4202,http://localhost:4203,http://localhost:4204,http://localhost:4205,http://localhost:4206,http://localhost:4207,http://localhost:4208
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
spring.web.cors.allow-credentials=true
```

### 3. Créer les fichiers Java

Utilisez les fichiers exemples que j'ai créés :

- `entity-patient-example.java` → `src/main/java/com/assistance/entity/Patient.java`
- `patient-repository-example.java` → `src/main/java/com/assistance/repository/PatientRepository.java`
- `patient-service-example.java` → `src/main/java/com/assistance/service/PatientService.java`
- `patient-controller-example.java` → `src/main/java/com/assistance/controller/PatientController.java`

### 4. Créer la classe principale

`src/main/java/com/assistance/AssistanceQuotidienne2Application.java` :

```java
package com.assistance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AssistanceQuotidienne2Application {
    public static void main(String[] args) {
        SpringApplication.run(AssistanceQuotidienne2Application.class, args);
    }
}
```

### 5. Démarrer MySQL

```bash
# Sur Windows (avec XAMPP/WAMP)
# Assurez-vous que MySQL est démarré

# Créer la base de données manuellement si nécessaire
mysql -u root -p
CREATE DATABASE assistanceQuotidienne;
```

### 6. Démarrer l'application Spring Boot

```bash
# Dans le dossier du projet
mvn clean install
mvn spring-boot:run
```

### 7. Vérifier que l'API fonctionne

Ouvrez un navigateur et testez :

```bash
# Test si le backend est démarré
curl http://localhost:8088/api/patients

# Devrait retourner un tableau vide (ou les patients si vous en avez ajouté)
[]
```

## 🧪 Insérer des données de test

Vous pouvez utiliser le script SQL que j'ai créé :

```sql
-- Dans MySQL Workbench ou ligne de commande
SOURCE insert-patients-test.sql;
```

Ou via l'API :

```bash
# Créer un patient via l'API
curl -X POST http://localhost:8088/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "nomComplet": "Marie Dupont",
    "dateNaissance": "1945-03-15",
    "adresse": "123 Rue de la Paix, 75001 Paris",
    "numeroDeTelephone": "06 12 34 56 78",
    "antecedents": "Hypertension, Diabète Type 2",
    "allergies": "Pénicilline",
    "actif": true
  }'
```

## 🔍 Vérification finale

Quand le backend est démarré, vous devriez voir :

1. **Console Spring Boot** :
```
Started AssistanceQuotidienne2Application in X.XXX seconds
Tomcat started on port(s): 8088 (http)
```

2. **Tests API** :
```bash
curl http://localhost:8088/api/patients
# Retourne les patients de la base de données
```

3. **Angular** :
- L'application Angular se connectera automatiquement
- Plus d'erreur "Unknown Error"
- Les patients de la base de données s'affichent

## 🚨 Problèmes courants

### Port déjà utilisé
```bash
# Vérifier quel processus utilise le port 8088
netstat -ano | findstr :8088

# Tuer le processus si nécessaire
taskkill /PID <PID> /F
```

### MySQL non démarré
```bash
# Vérifier que MySQL est démarré
mysql --version

# Démarrer MySQL (selon votre installation)
# XAMPP: Démarrer MySQL depuis le panneau de contrôle
# WAMP: Démarrer MySQL depuis le panneau de contrôle
```

### Erreur de connexion à la base de données
```bash
# Vérifier les identifiants MySQL
mysql -u root -p

# Créer la base de données si nécessaire
CREATE DATABASE assistanceQuotidienne;
```

## ✅ Une fois démarré

Votre application Angular affichera automatiquement :
- ✅ Les patients de votre base de données MySQL
- ✅ Les rendez-vous connectés aux patients réels
- ✅ Les fonctionnalités CRUD complètes

L'erreur "Unknown Error" disparaîtra et vous aurez une connexion complète entre Angular et Spring Boot ! 🎉
