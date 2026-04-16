-- Insérer des patients de test pour la base de données assistanceQuotidienne
-- Compatible avec votre configuration Spring Boot + MySQL

INSERT INTO patients (nom_complet, date_naissance, adresse, numero_de_telephone, antecedents, allergies, nb_interventions_mois, derniere_visite, actif) VALUES
('Marie Dupont', '1945-03-15', '123 Rue de la Paix, 75001 Paris', '06 12 34 56 78', 'Hypertension, Diabète Type 2', 'Pénicilline', 3, '2023-10-25', true),
('Jean Martin', '1941-07-22', '45 Avenue des Champs-Élysées, 75008 Paris', '06 23 45 67 89', 'Maladie de Parkinson', 'Aucune', 2, '2023-10-20', true),
('Alice Bernard', '1948-11-08', '78 Boulevard Saint-Michel, 75005 Paris', '06 34 56 78 90', 'Arthrite rhumatoïde', 'Pollens', 4, '2023-10-15', true),
('Paul Durand', '1938-02-14', '21 Rue du Faubourg Saint-Honoré, 75001 Paris', '06 45 67 89 01', 'Troubles cognitifs légers', 'Noix', 1, '2023-10-10', true),
('Sophie Leroy', '1951-09-30', '156 Rue de Rivoli, 75004 Paris', '06 56 78 90 12', 'Ostéoporose', 'Acariens', 2, '2023-10-05', true),
('Robert Petit', '1943-05-18', '89 Avenue de la Grande Armée, 75016 Paris', '06 67 89 01 23', 'Insuffisance cardiaque', 'Latex', 3, '2023-09-28', true),
('Françoise Dubois', '1946-12-03', '234 Boulevard de la Vilette, 75019 Paris', '06 78 90 12 34', 'COPD', 'Mold', 1, '2023-10-01', true),
('Pierre Rousseau', '1939-08-25', '67 Rue du Temple, 75003 Paris', '06 89 01 23 45', 'Cancer du poumon en rémission', 'Aucune', 0, '2023-09-15', true),
('Simone Moreau', '1947-04-12', '145 Rue Lafayette, 75009 Paris', '06 90 12 34 56', 'Dépression', 'Iode', 2, '2023-10-18', true),
('Claude Girard', '1942-06-29', '98 Avenue d''Italie, 75013 Paris', '06 01 23 45 67', 'Maladie d''Alzheimer', 'Aucune', 5, '2023-10-22', true);

-- Vérifier l'insertion
SELECT * FROM patients ORDER BY nom_complet;
