CREATE DATABASE IF NOT EXISTS alzheimer_db;
CREATE DATABASE IF NOT EXISTS userdb;
CREATE DATABASE IF NOT EXISTS cognitivedb;
CREATE DATABASE IF NOT EXISTS patientdb;
CREATE DATABASE IF NOT EXISTS patientdb1;
CREATE DATABASE IF NOT EXISTS gestion_patients;
CREATE DATABASE IF NOT EXISTS gestion_livreur;

CREATE USER IF NOT EXISTS 'alzheimer_app'@'%' IDENTIFIED BY 'alzheimer_app';
GRANT ALL PRIVILEGES ON alzheimer_db.* TO 'alzheimer_app'@'%';
GRANT ALL PRIVILEGES ON userdb.* TO 'alzheimer_app'@'%';
GRANT ALL PRIVILEGES ON cognitivedb.* TO 'alzheimer_app'@'%';
GRANT ALL PRIVILEGES ON patientdb.* TO 'alzheimer_app'@'%';
GRANT ALL PRIVILEGES ON patientdb1.* TO 'alzheimer_app'@'%';
GRANT ALL PRIVILEGES ON gestion_patients.* TO 'alzheimer_app'@'%';
GRANT ALL PRIVILEGES ON gestion_livreur.* TO 'alzheimer_app'@'%';
FLUSH PRIVILEGES;