-- BCB project database bootstrap for MySQL/phpMyAdmin
-- Generated from JPA entities in bcb-backend/src/main/java/com/bcb/backend/mysql/model

SET NAMES utf8mb4;
SET time_zone = '+07:00';

CREATE DATABASE IF NOT EXISTS `bcb_project`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `bcb_project`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `temporary_recruitment_saved`;
DROP TABLE IF EXISTS `temporary_registration`;
DROP TABLE IF EXISTS `reservation_detail`;
DROP TABLE IF EXISTS `temporary_recruitment`;
DROP TABLE IF EXISTS `payment_invoice`;
DROP TABLE IF EXISTS `reservation`;
DROP TABLE IF EXISTS `review`;
DROP TABLE IF EXISTS `voucher`;
DROP TABLE IF EXISTS `badminton_court_image`;
DROP TABLE IF EXISTS `badminton_court`;
DROP TABLE IF EXISTS `price`;
DROP TABLE IF EXISTS `price_type`;
DROP TABLE IF EXISTS `player`;
DROP TABLE IF EXISTS `branch`;
DROP TABLE IF EXISTS `partnership_request`;
DROP TABLE IF EXISTS `owner`;
DROP TABLE IF EXISTS `account`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `account` (
  `id` varchar(255) NOT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `is_activated` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_account_user_name` (`user_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `owner` (
  `id` varchar(255) NOT NULL,
  `owner_name` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `partnership_request` (
  `id` varchar(255) NOT NULL,
  `create_at` datetime(6) DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `owner_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_partnership_request_owner_id` (`owner_id`),
  CONSTRAINT `fk_partnership_request_owner`
    FOREIGN KEY (`owner_id`) REFERENCES `owner` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `branch` (
  `id` varchar(255) NOT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `bank_number` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_cooperated` tinyint(1) NOT NULL DEFAULT 1,
  `account_id` varchar(255) DEFAULT NULL,
  `partnership_request_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_branch_account_id` (`account_id`),
  UNIQUE KEY `uk_branch_partnership_request_id` (`partnership_request_id`),
  CONSTRAINT `fk_branch_account`
    FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `fk_branch_partnership_request`
    FOREIGN KEY (`partnership_request_id`) REFERENCES `partnership_request` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `player` (
  `id` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` tinyint(1) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `account_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_player_account_id` (`account_id`),
  CONSTRAINT `fk_player_account`
    FOREIGN KEY (`account_id`) REFERENCES `account` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `price_type` (
  `id` varchar(255) NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `price` (
  `id` varchar(255) NOT NULL,
  `start_time` smallint DEFAULT NULL,
  `end_time` smallint DEFAULT NULL,
  `day_of_week` varchar(255) DEFAULT NULL,
  `price_per_hour` decimal(38,2) DEFAULT NULL,
  `branch_id` varchar(255) DEFAULT NULL,
  `price_type_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_price_branch_id` (`branch_id`),
  KEY `idx_price_price_type_id` (`price_type_id`),
  CONSTRAINT `fk_price_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`),
  CONSTRAINT `fk_price_price_type`
    FOREIGN KEY (`price_type_id`) REFERENCES `price_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `badminton_court` (
  `id` varchar(255) NOT NULL,
  `ordinal_number` smallint DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `branch_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_badminton_court_branch_id` (`branch_id`),
  CONSTRAINT `fk_badminton_court_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `badminton_court_image` (
  `id` varchar(255) NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `short_description` varchar(255) DEFAULT NULL,
  `badminton_court_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_badminton_court_image_court_id` (`badminton_court_id`),
  CONSTRAINT `fk_badminton_court_image_court`
    FOREIGN KEY (`badminton_court_id`) REFERENCES `badminton_court` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `voucher` (
  `id` varchar(255) NOT NULL,
  `create_at` datetime(6) DEFAULT NULL,
  `discount_rate` double DEFAULT NULL,
  `event` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `branch_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_voucher_branch_id` (`branch_id`),
  CONSTRAINT `fk_voucher_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reservation` (
  `id` varchar(255) NOT NULL,
  `create_at` datetime(6) DEFAULT NULL,
  `book_at` datetime(6) DEFAULT NULL,
  `total_price` decimal(38,2) DEFAULT NULL,
  `deposit` decimal(38,2) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `player_id` varchar(255) DEFAULT NULL,
  `voucher_id` varchar(255) DEFAULT NULL,
  `branch_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reservation_player_id` (`player_id`),
  KEY `idx_reservation_voucher_id` (`voucher_id`),
  KEY `idx_reservation_branch_id` (`branch_id`),
  CONSTRAINT `fk_reservation_player`
    FOREIGN KEY (`player_id`) REFERENCES `player` (`id`),
  CONSTRAINT `fk_reservation_voucher`
    FOREIGN KEY (`voucher_id`) REFERENCES `voucher` (`id`),
  CONSTRAINT `fk_reservation_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payment_invoice` (
  `id` varchar(255) NOT NULL,
  `create_at` datetime(6) DEFAULT NULL,
  `total` decimal(38,2) DEFAULT NULL,
  `payment_status` varchar(255) DEFAULT NULL,
  `reservation_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_invoice_reservation_id` (`reservation_id`),
  CONSTRAINT `fk_payment_invoice_reservation`
    FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `review` (
  `id` varchar(255) NOT NULL,
  `create_at` datetime(6) DEFAULT NULL,
  `rating_level` smallint DEFAULT NULL,
  `content` text DEFAULT NULL,
  `player_id` varchar(255) DEFAULT NULL,
  `branch_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_review_player_id` (`player_id`),
  KEY `idx_review_branch_id` (`branch_id`),
  CONSTRAINT `fk_review_player`
    FOREIGN KEY (`player_id`) REFERENCES `player` (`id`),
  CONSTRAINT `fk_review_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `temporary_recruitment` (
  `id` varchar(255) NOT NULL,
  `create_at` datetime(6) DEFAULT NULL,
  `quantity` smallint DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `content` text DEFAULT NULL,
  `reservation_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_temporary_recruitment_reservation_id` (`reservation_id`),
  CONSTRAINT `fk_temporary_recruitment_reservation`
    FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reservation_detail` (
  `badminton_court_id` varchar(255) NOT NULL,
  `reservation_id` varchar(255) NOT NULL,
  `start_time` time(6) DEFAULT NULL,
  `rental_time` double DEFAULT NULL,
  PRIMARY KEY (`badminton_court_id`, `reservation_id`),
  KEY `idx_reservation_detail_reservation_id` (`reservation_id`),
  CONSTRAINT `fk_reservation_detail_court`
    FOREIGN KEY (`badminton_court_id`) REFERENCES `badminton_court` (`id`),
  CONSTRAINT `fk_reservation_detail_reservation`
    FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `temporary_registration` (
  `temporary_recruitment_id` varchar(255) NOT NULL,
  `player_id` varchar(255) NOT NULL,
  PRIMARY KEY (`temporary_recruitment_id`, `player_id`),
  KEY `idx_temporary_registration_player_id` (`player_id`),
  CONSTRAINT `fk_temporary_registration_recruitment`
    FOREIGN KEY (`temporary_recruitment_id`) REFERENCES `temporary_recruitment` (`id`),
  CONSTRAINT `fk_temporary_registration_player`
    FOREIGN KEY (`player_id`) REFERENCES `player` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `temporary_recruitment_saved` (
  `temporary_recruitment_id` varchar(255) NOT NULL,
  `player_id` varchar(255) NOT NULL,
  PRIMARY KEY (`temporary_recruitment_id`, `player_id`),
  KEY `idx_temporary_recruitment_saved_player_id` (`player_id`),
  CONSTRAINT `fk_temporary_recruitment_saved_recruitment`
    FOREIGN KEY (`temporary_recruitment_id`) REFERENCES `temporary_recruitment` (`id`),
  CONSTRAINT `fk_temporary_recruitment_saved_player`
    FOREIGN KEY (`player_id`) REFERENCES `player` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional basic seed
INSERT INTO `price_type` (`id`, `type`)
VALUES
  ('pricetype_weekday', 'WEEKDAY'),
  ('pricetype_weekend', 'WEEKEND')
ON DUPLICATE KEY UPDATE `type` = VALUES(`type`);

-- Admin account: username=admin, password=Admin@123
INSERT INTO `account` (
  `id`,
  `user_name`,
  `password`,
  `role`,
  `phone_number`,
  `image_path`,
  `is_activated`
)
VALUES (
  'acco_admin_001',
  'admin',
  '$2y$10$JADap/0cPXpDW86C1Ud4UOEss4Je16n8eIvphUBPvZiaUk6zf7IDO',
  'ADMIN',
  '0900000000',
  NULL,
  1
)
ON DUPLICATE KEY UPDATE
  `password` = VALUES(`password`),
  `role` = VALUES(`role`),
  `is_activated` = VALUES(`is_activated`);
