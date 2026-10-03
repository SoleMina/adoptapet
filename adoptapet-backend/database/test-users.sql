-- =====================================================================================================
-- AdoptaPet: test users (user-service, database pets_users)
--
-- Run it once user-service has started at least once, or on a new machine (it also creates the table):
--   mysql -u root -p < adoptapet-backend/database/test-users.sql
-- Safe to run again: INSERT IGNORE skips users whose username, email or DNI already exist.
-- Careful: it skips them silently. If a new user does not appear, its username, email or DNI is already taken.
--
-- Password of every user below: secreto123
--   admin.test   ADMIN    full panel (workers, users, reports)
--   worker.test  WORKER   staff panel (pets, applications, deliveries)
--   ana.torres*  ADOPTER  public site (catalog, applications)
-- The main admin of .env (ADMIN_USERNAME) is not here: user-service creates it on startup.
--
-- To add a user: copy a row of the INSERT and change username, email and dni (the three must be unique).
--   role:     'ADOPTER' | 'WORKER' | 'ADMIN'
--   password: BCrypt hash. To keep "secreto123" reuse this one:
--             $2a$10$6iaZlmOqLOUDRvg/7jRNleI1TZ/w4OVUmsDDXpz6Qi/UQVlDnSGem
-- =====================================================================================================

CREATE DATABASE IF NOT EXISTS pets_users CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE pets_users;

-- Same table Hibernate generates from User.java (ddl-auto=update), so this file also works on an empty database.
CREATE TABLE IF NOT EXISTS users (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  active     BIT(1)       NOT NULL,
  address    VARCHAR(250) DEFAULT NULL,
  birth_date DATE         DEFAULT NULL,
  created_at DATETIME(6)  DEFAULT NULL,
  dni        VARCHAR(8)   DEFAULT NULL,
  email      VARCHAR(150) NOT NULL,
  first_name VARCHAR(100) DEFAULT NULL,
  last_name  VARCHAR(100) DEFAULT NULL,
  password   VARCHAR(255) NOT NULL,
  phone      VARCHAR(20)  DEFAULT NULL,
  role       ENUM('ADMIN', 'ADOPTER', 'WORKER') NOT NULL,
  updated_at DATETIME(6)  DEFAULT NULL,
  username   VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UK6dotkott2kjsp8vw4d0m25fb7 (email),
  UNIQUE KEY UKr43af9ap4edm43mmtq01oddj6 (username),
  UNIQUE KEY UK6aphui3g30h49muho4c91n0yl (dni)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO users
  (username, email, password, role, active, first_name, last_name, dni, birth_date, phone, address, created_at, updated_at)
VALUES
  -- staff
  ('admin.test', 'admin.test@adoptapet.com', '$2a$10$6iaZlmOqLOUDRvg/7jRNleI1TZ/w4OVUmsDDXpz6Qi/UQVlDnSGem', 'ADMIN', b'1', 'Carla', 'Rojas', '71000001', '1988-03-14', '912345678', 'Miraflores, Lima', NOW(6), NOW(6)),
  ('worker.test', 'worker.test@adoptapet.com', '$2a$10$6iaZlmOqLOUDRvg/7jRNleI1TZ/w4OVUmsDDXpz6Qi/UQVlDnSGem', 'WORKER', b'1', 'Luis', 'Paredes', '71000002', '1992-08-21', '923456789', 'Surco, Lima', NOW(6), NOW(6)),
  -- adopters
  ('ana.torres512770', 'ana512770@example.com', '$2a$10$6iaZlmOqLOUDRvg/7jRNleI1TZ/w4OVUmsDDXpz6Qi/UQVlDnSGem', 'ADOPTER', b'1', 'Ana', 'Torres', '75127709', '1995-12-05', '987654321', 'Lima, Perú', NOW(6), NOW(6)),
  ('ana.torres577064', 'ana577064@example.com', '$2a$10$12h/fhhHjyncms8dZHLdQeRMLR9jXDPIoWKtgvcnnwm5CaFE4drv.', 'ADOPTER', b'1', 'Ana', 'Torres', '75770649', '1995-12-05', '987654321', 'Lima, Perú', NOW(6), NOW(6)),
  ('ana.torres638717', 'ana638717@example.com', '$2a$10$z8madTEkb9C68fFzFYW45eNkH2MPUN07kcZ5OnRlManzV8PHCphNK', 'ADOPTER', b'1', 'Ana', 'Torres', '76387179', '1995-12-05', '987654321', 'Lima, Perú', NOW(6), NOW(6));

-- Check:
-- SELECT id, username, email, role FROM users ORDER BY id;
