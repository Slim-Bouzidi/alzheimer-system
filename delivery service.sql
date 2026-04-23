-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 22 avr. 2026 à 22:48
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `patientdb`
--

-- --------------------------------------------------------

--
-- Structure de la table `assignment`
--

CREATE TABLE `assignment` (
  `id` bigint(20) NOT NULL,
  `active` bit(1) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `patient_id` bigint(20) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `staff_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `assignment`
--

INSERT INTO `assignment` (`id`, `active`, `end_date`, `patient_id`, `start_date`, `staff_id`) VALUES
(2, b'0', '2026-04-25', 2, '2026-03-14', 22),
(3, b'0', '2026-03-30', 3, '2026-03-16', 23),
(4, b'0', '2026-03-30', 2, '2026-03-24', 25),
(5, b'1', '2026-04-29', 7, '2026-04-22', 3);

-- --------------------------------------------------------

--
-- Structure de la table `clinical_records`
--

CREATE TABLE `clinical_records` (
  `id` bigint(20) NOT NULL,
  `alcohol_consumption` varchar(255) DEFAULT NULL,
  `blood_sugar` double DEFAULT NULL,
  `bmi` double DEFAULT NULL,
  `cholesterol_total` double DEFAULT NULL,
  `diabetes` bit(1) DEFAULT NULL,
  `diastolicbp` int(11) DEFAULT NULL,
  `diet_quality` int(11) DEFAULT NULL,
  `family_history` bit(1) DEFAULT NULL,
  `heart_rate` int(11) DEFAULT NULL,
  `hypertension` bit(1) DEFAULT NULL,
  `physical_activity` int(11) DEFAULT NULL,
  `recorded_at` datetime DEFAULT NULL,
  `recorded_by` varchar(255) DEFAULT NULL,
  `sleep_quality` int(11) DEFAULT NULL,
  `smoking_status` varchar(255) DEFAULT NULL,
  `systolicbp` int(11) DEFAULT NULL,
  `patient_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `delivery_task`
--

CREATE TABLE `delivery_task` (
  `id` bigint(20) NOT NULL,
  `assigned_staff_id` bigint(20) DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `patient_id` bigint(20) DEFAULT NULL,
  `planned_time` time DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `meal_slot_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `delivery_task`
--

INSERT INTO `delivery_task` (`id`, `assigned_staff_id`, `confirmed_at`, `delivered_at`, `delivery_date`, `notes`, `patient_id`, `planned_time`, `status`, `meal_slot_id`) VALUES
(2, NULL, '2026-02-26 11:28:07', '2026-02-26 11:28:12', '2026-02-03', 'salut11', 2, '00:45:00', 'DELIVERED', NULL),
(3, 6, '2026-04-10 20:44:04', '2026-04-10 20:44:07', '2026-02-11', 'ss\n', 2, '00:45:00', 'DELIVERED', NULL),
(4, 3, NULL, NULL, '2026-02-03', 'sss', 2, '00:24:00', 'PLANNED', NULL),
(5, 23, NULL, NULL, '2026-03-04', 's', 2, '09:11:00', 'PLANNED', NULL),
(6, 3, NULL, NULL, '2026-04-16', 'zaezae', 2, '22:20:00', 'PLANNED', NULL),
(8, 3, NULL, NULL, '2026-04-15', 'aaaaa', 3, '13:23:00', 'PLANNED', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `location_updates`
--

CREATE TABLE `location_updates` (
  `id` bigint(20) NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `route_id` bigint(20) NOT NULL,
  `staff_id` bigint(20) NOT NULL,
  `timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `meal_slot`
--

CREATE TABLE `meal_slot` (
  `id` bigint(20) NOT NULL,
  `enabled` bit(1) DEFAULT NULL,
  `label` varchar(255) DEFAULT NULL,
  `meal_type` varchar(255) DEFAULT NULL,
  `time` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `meal_slot`
--

INSERT INTO `meal_slot` (`id`, `enabled`, `label`, `meal_type`, `time`) VALUES
(2, b'1', 'zz', 'LUNCH', '14:00:00'),
(4, b'1', NULL, 'DINNER', '19:00:00'),
(8, b'1', NULL, 'DINNER', '03:12:00'),
(9, b'1', NULL, 'LUNCH', '12:00:00'),
(10, b'1', NULL, 'BREAKFAST', '11:00:00');

-- --------------------------------------------------------

--
-- Structure de la table `patients`
--

CREATE TABLE `patients` (
  `id` bigint(20) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `patient_code` varchar(255) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `alcohol_consumption` varchar(255) DEFAULT NULL,
  `blood_sugar` double DEFAULT NULL,
  `bmi` double DEFAULT NULL,
  `cholesterol_total` double DEFAULT NULL,
  `diabetes` bit(1) DEFAULT NULL,
  `diastolicbp` int(11) DEFAULT NULL,
  `diet_quality` int(11) DEFAULT NULL,
  `family_history` bit(1) DEFAULT NULL,
  `heart_rate` int(11) DEFAULT NULL,
  `hypertension` bit(1) DEFAULT NULL,
  `keycloak_id` varchar(255) NOT NULL,
  `physical_activity` int(11) DEFAULT NULL,
  `sleep_quality` int(11) DEFAULT NULL,
  `smoking_status` varchar(255) DEFAULT NULL,
  `systolicbp` int(11) DEFAULT NULL,
  `user_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `patients`
--

INSERT INTO `patients` (`id`, `age`, `first_name`, `last_name`, `patient_code`, `latitude`, `longitude`, `alcohol_consumption`, `blood_sugar`, `bmi`, `cholesterol_total`, `diabetes`, `diastolicbp`, `diet_quality`, `family_history`, `heart_rate`, `hypertension`, `keycloak_id`, `physical_activity`, `sleep_quality`, `smoking_status`, `systolicbp`, `user_id`) VALUES
(2, 31, 'Jean', 'Dupont', 'PAT-001', 36.8065, 10.1815, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL),
(3, 32, 'iyed ', 'mnmnassri', 'PAT-006', 36.8072, 10.1823, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL),
(4, 22, 'malek', 'ellafi', 'PAT-005', 36.8058, 10.1801, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL),
(7, 23, 'marwen', 'lefi', 'PAT-008', 36.8081, 10.183, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL),
(8, 30, 'MALEK', 'AYED', 'PAT-003', 36.8049, 10.1795, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL),
(9, 38, 'moetaz', 'ayed', 'PAT-0010', 36.8069, 10.1842, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL),
(10, 15, 'KHALIL', 'ELLAFI', 'PAT-0011', 36.8077, 10.1788, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL),
(11, 19, 'ze', 'ze', 'ze', 36.8053, 10.1829, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `route`
--

CREATE TABLE `route` (
  `id` bigint(20) NOT NULL,
  `active` bit(1) DEFAULT NULL,
  `label` varchar(255) DEFAULT NULL,
  `route_date` date DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `meal_slot_id` bigint(20) DEFAULT NULL,
  `staff_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `route`
--

INSERT INTO `route` (`id`, `active`, `label`, `route_date`, `status`, `meal_slot_id`, `staff_id`) VALUES
(2, b'1', 'Centre ville', '2026-02-06', 'DONE', 2, 3),
(11, b'1', 'bonjour', '2026-03-04', 'DONE', 8, 3),
(12, b'1', 'tournee test', '2026-03-04', 'DONE', 9, 24),
(13, b'1', 'HHHHHH', '2026-03-04', 'DONE', 8, 24),
(14, b'1', 'salut', '2026-03-04', 'DONE', 8, 22),
(15, b'1', 'la vie', '2026-03-04', 'IN_PROGRESS', 8, 4),
(16, b'1', 'BONJOUR', '2026-03-05', 'IN_PROGRESS', 8, 22),
(17, b'1', 'test', '2026-03-04', 'IN_PROGRESS', 10, 25),
(19, b'1', 'centre ville', '2026-04-10', 'IN_PROGRESS', 8, 22),
(20, b'1', 'zeze', '2026-04-21', 'IN_PROGRESS', 8, 22),
(22, b'1', 'aaaa', '2026-04-22', 'IN_PROGRESS', 8, 22),
(23, b'1', '54848', '2026-04-10', 'DONE', 8, 22),
(24, b'1', 'aaaaaa', '2026-04-10', 'DONE', 4, 3),
(25, b'1', 'aaaa', '2026-04-14', 'DONE', 4, 4),
(26, b'1', '  mfmfm', '2026-04-11', 'DONE', 4, 24);

-- --------------------------------------------------------

--
-- Structure de la table `route_stop`
--

CREATE TABLE `route_stop` (
  `id` bigint(20) NOT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `notes` varchar(200) DEFAULT NULL,
  `patient_id` bigint(20) NOT NULL,
  `status` varchar(255) DEFAULT NULL,
  `stop_order` int(11) NOT NULL,
  `route_id` bigint(20) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `route_stop`
--

INSERT INTO `route_stop` (`id`, `delivered_at`, `notes`, `patient_id`, `status`, `stop_order`, `route_id`, `latitude`, `longitude`) VALUES
(6, NULL, '', 3, 'PENDING', 1, 12, NULL, NULL),
(7, NULL, '', 4, 'PENDING', 1, 13, NULL, NULL),
(8, NULL, '', 7, 'PENDING', 1, 14, NULL, NULL),
(9, NULL, '', 8, 'PENDING', 1, 15, NULL, NULL),
(10, NULL, '', 3, 'PENDING', 1, 19, NULL, NULL),
(12, NULL, 'aaaaaaa', 3, 'PENDING', 2, 20, NULL, NULL),
(13, NULL, 'test', 2, 'PENDING', 1, 16, NULL, NULL),
(14, NULL, 'aaaaa', 4, 'PENDING', 1, 17, NULL, NULL),
(15, NULL, '', 3, 'PENDING', 1, 11, NULL, NULL),
(17, NULL, '48', 3, 'PENDING', 1, 22, NULL, NULL),
(18, NULL, '585', 3, 'PENDING', 1, 23, NULL, NULL),
(19, NULL, 'aa', 3, 'PENDING', 1, 2, 36.8072, 10.1823),
(20, '2026-04-10 22:27:37', 'a', 2, 'DELIVERED', 1, 24, 36.8065, 10.1815),
(21, '2026-04-10 23:45:44', 'ged', 9, 'DELIVERED', 1, 25, 36.8069, 10.1842),
(22, '2026-04-11 08:43:19', '', 3, 'DELIVERED', 1, 26, 36.8072, 10.1823),
(23, '2026-04-11 08:43:20', '', 2, 'DELIVERED', 2, 26, 36.8065, 10.1815);

-- --------------------------------------------------------

--
-- Structure de la table `shift`
--

CREATE TABLE `shift` (
  `id` bigint(20) NOT NULL,
  `active` bit(1) DEFAULT NULL,
  `day_of_week` varchar(255) DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `staff_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `shift`
--

INSERT INTO `shift` (`id`, `active`, `day_of_week`, `end_time`, `start_time`, `staff_id`) VALUES
(2, b'1', 'MONDAY', '21:05:00', '14:22:00', 4),
(3, b'1', 'MONDAY', '23:01:00', '02:03:00', 4),
(4, b'1', 'TUESDAY', '19:00:00', '14:01:00', 23),
(5, b'1', 'WEDNESDAY', '19:22:00', '09:09:00', 22),
(6, b'1', 'TUESDAY', '13:42:00', '00:40:00', 22),
(7, b'1', 'TUESDAY', '22:44:00', '22:38:00', 4);

-- --------------------------------------------------------

--
-- Structure de la table `staff_profile`
--

CREATE TABLE `staff_profile` (
  `id` bigint(20) NOT NULL,
  `active` bit(1) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `username` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `staff_profile`
--

INSERT INTO `staff_profile` (`id`, `active`, `full_name`, `phone`, `username`) VALUES
(3, b'1', 'Staff Nuit', '06000000031', 'staffnight'),
(4, b'1', 'ahmd bn ali', '5898754', 'staff22'),
(22, b'1', 'ahla ahla', '24674455', 'staff12'),
(23, b'1', 'malk malk', '26797765', 'staffpi'),
(24, b'1', 'malek ellafi', '26044039', 'stafftest'),
(25, b'1', 'mmmmmm', '26044039', 'staffprojet'),
(26, b'1', 'eeeeee', '67865757', 'zez');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `assignment`
--
ALTER TABLE `assignment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK2q6ey12p0q6fyybao2ha0h64c` (`staff_id`),
  ADD KEY `FKjglit4fti2sh7d6sc986kbj0o` (`patient_id`);

--
-- Index pour la table `clinical_records`
--
ALTER TABLE `clinical_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKavo63pdvomwrb7wcatrnd4hn7` (`patient_id`);

--
-- Index pour la table `delivery_task`
--
ALTER TABLE `delivery_task`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK42dms0fi8uca6bx0dv1gvreh7` (`meal_slot_id`);

--
-- Index pour la table `location_updates`
--
ALTER TABLE `location_updates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_loc_staff_route` (`staff_id`,`route_id`),
  ADD KEY `idx_loc_route_ts` (`route_id`,`timestamp`);

--
-- Index pour la table `meal_slot`
--
ALTER TABLE `meal_slot`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK_pdu5f0e015icwwcx7otn46rv8` (`patient_code`);

--
-- Index pour la table `route`
--
ALTER TABLE `route`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKofs2254yp98er13k200aly5y4` (`meal_slot_id`),
  ADD KEY `FKpfwxufybygybackfbso1ju2yy` (`staff_id`);

--
-- Index pour la table `route_stop`
--
ALTER TABLE `route_stop`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKrah0j8khs716aqhsqt3x5yxbw` (`route_id`),
  ADD KEY `FKsew6iv0lxhn7ai9t3imh09ewr` (`patient_id`);

--
-- Index pour la table `shift`
--
ALTER TABLE `shift`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK53h92hxcnsfxmfp9hrrboso9c` (`staff_id`);

--
-- Index pour la table `staff_profile`
--
ALTER TABLE `staff_profile`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK_g4swoy8b1v0yso8v5sl0hmsrh` (`username`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `assignment`
--
ALTER TABLE `assignment`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `clinical_records`
--
ALTER TABLE `clinical_records`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `delivery_task`
--
ALTER TABLE `delivery_task`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `location_updates`
--
ALTER TABLE `location_updates`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `meal_slot`
--
ALTER TABLE `meal_slot`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `route`
--
ALTER TABLE `route`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT pour la table `route_stop`
--
ALTER TABLE `route_stop`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT pour la table `shift`
--
ALTER TABLE `shift`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `staff_profile`
--
ALTER TABLE `staff_profile`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `assignment`
--
ALTER TABLE `assignment`
  ADD CONSTRAINT `FK2q6ey12p0q6fyybao2ha0h64c` FOREIGN KEY (`staff_id`) REFERENCES `staff_profile` (`id`),
  ADD CONSTRAINT `FKjglit4fti2sh7d6sc986kbj0o` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`);

--
-- Contraintes pour la table `clinical_records`
--
ALTER TABLE `clinical_records`
  ADD CONSTRAINT `FKavo63pdvomwrb7wcatrnd4hn7` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`);

--
-- Contraintes pour la table `delivery_task`
--
ALTER TABLE `delivery_task`
  ADD CONSTRAINT `FK42dms0fi8uca6bx0dv1gvreh7` FOREIGN KEY (`meal_slot_id`) REFERENCES `meal_slot` (`id`);

--
-- Contraintes pour la table `route`
--
ALTER TABLE `route`
  ADD CONSTRAINT `FKofs2254yp98er13k200aly5y4` FOREIGN KEY (`meal_slot_id`) REFERENCES `meal_slot` (`id`),
  ADD CONSTRAINT `FKpfwxufybygybackfbso1ju2yy` FOREIGN KEY (`staff_id`) REFERENCES `staff_profile` (`id`);

--
-- Contraintes pour la table `route_stop`
--
ALTER TABLE `route_stop`
  ADD CONSTRAINT `FKrah0j8khs716aqhsqt3x5yxbw` FOREIGN KEY (`route_id`) REFERENCES `route` (`id`),
  ADD CONSTRAINT `FKsew6iv0lxhn7ai9t3imh09ewr` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`);

--
-- Contraintes pour la table `shift`
--
ALTER TABLE `shift`
  ADD CONSTRAINT `FK53h92hxcnsfxmfp9hrrboso9c` FOREIGN KEY (`staff_id`) REFERENCES `staff_profile` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
