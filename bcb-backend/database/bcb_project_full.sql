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
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
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
  ('pricetype_fixed', 'Cố định'),
  ('pricetype_casual', 'Vãng lai')
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
  
INSERT INTO `account` (`id`, `user_name`, `password`, `role`, `phone_number`, `is_activated`) VALUES
('acc_admin_01', 'trongphuoc', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'ADMIN', '0901234567', 1),
('acc_owner_01', 'quangthien', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'MANAGER', '0911222333', 1),
('acc_owner_02', 'nhuquynh_owner', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'MANAGER', '0988111222', 1), -- Tài khoản chủ sân cho Như Quỳnh
('acc_player_01', 'nhuquynh', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'USER', '0988111222', 1),
('acc_player_02', 'minhtam', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'USER', '0977333444', 1),
('acc_player_03', 'thanhha', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'USER', '0944555666', 1),
('acc_player_04', 'hoanglong', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'USER', '0933444555', 1);

INSERT INTO `player` (`id`, `full_name`, `date_of_birth`, `gender`, `email`, `account_id`) VALUES
('pl_admin', 'Nguyễn Trọng Phước', '2004-06-12', 1, 'trongphuoc@bcb.vn', 'acc_admin_01'),
('pl_01', 'Trần Nguyễn Ngọc Như Quỳnh', '2005-01-12', 0, 'nhuquynh@gmail.com', 'acc_player_01'),
('pl_02', 'Trần Biện Minh Tâm', '2004-11-30', 1, 'minhtam@gmail.com', 'acc_player_02'),
('pl_03', 'Nguyễn Thanh Hà', '2003-05-20', 0, 'thanhha@gmail.com', 'acc_player_03'),
('pl_04', 'Phạm Hoàng Long', '1999-08-10', 1, 'hoanglong@gmail.com', 'acc_player_04');

INSERT INTO `owner` (`id`, `owner_name`, `phone_number`, `email`) VALUES
('own_01', 'Nguyễn Quang Thiện', '0911222333', 'quangthien@badminton.vn'),
('own_02', 'Trần Nguyễn Ngọc Như Quỳnh', '0988111222', 'nhuquynh@badminton.vn');

INSERT INTO `partnership_request` (`id`, `create_at`, `branch_name`, `address`, `phone_number`, `status`, `owner_id`) VALUES
('req_01', '2026-03-20 08:00:00', 'Sân Cầu Lông Quang Thiện', '456 Lê Trọng Tấn, Tân Phú, TP.HCM', '02838445566', 'APPROVED', 'own_01'),
('req_02', '2026-03-21 09:30:00', 'Sân Cầu Lông Như Quỳnh', '123 Cộng Hòa, Tân Bình, TP.HCM', '02812345678', 'APPROVED', 'own_02');

INSERT INTO `branch` (`id`, `branch_name`, `email`, `address`, `bank_name`, `bank_number`, `description`, `account_id`, `partnership_request_id`) VALUES
('br_01', 'Quang Thiện Badminton', 'contact@quangthien.vn', '456 Lê Trọng Tấn, Tân Phú, TP.HCM', 'MB Bank', '1900112233', 'Sân thảm mới 100%, trần cao thoáng mát.', 'acc_owner_01', 'req_01'),
('br_02', 'Như Quỳnh Badminton', 'contact@nhuquynh.vn', '123 Cộng Hòa, Tân Bình, TP.HCM', 'Vietcombank', '0071000998877', 'Sân tiêu chuẩn thi đấu, sạch đẹp, nhân viên nhiệt tình.', 'acc_owner_02', 'req_02');

INSERT INTO `badminton_court` (`id`, `ordinal_number`, `is_available`, `branch_id`) VALUES
('ct_01', 1, 1, 'br_01'),
('ct_02', 2, 1, 'br_01'),
('ct_03', 1, 1, 'br_02'),
('ct_04', 2, 1, 'br_02'),
('ct_05', 3, 1, 'br_02');

INSERT INTO `price` (`id`, `start_time`, `end_time`, `day_of_week`, `price_per_hour`, `branch_id`, `price_type_id`) VALUES 
('pr_01', 5, 22, '0', 90000.00, 'br_01', 'pricetype_fixed'),
('pr_02', 5, 22, '1', 120000.00, 'br_01', 'pricetype_fixed'),
('pr_03', 5, 22, '0', 100000.00, 'br_02', 'pricetype_casual');

INSERT INTO `reservation` (`id`, `create_at`, `book_at`, `total_price`, `deposit`, `status`, `player_id`, `branch_id`) VALUES
('res_01', '2026-03-24 10:00:00', '2026-03-25 17:00:00', 180000.00, 50000.00, 'CONFIRMED', 'pl_01', 'br_01'),
('res_02', '2026-03-24 14:00:00', '2026-03-26 18:00:00', 200000.00, 100000.00, 'CONFIRMED', 'pl_03', 'br_02');

INSERT INTO `reservation_detail` (`badminton_court_id`, `reservation_id`, `start_time`, `rental_time`) VALUES
('ct_01', 'res_01', '17:00:00', 2.0),
('ct_03', 'res_02', '18:00:00', 2.0);

INSERT INTO `temporary_recruitment` (`id`, `create_at`, `quantity`, `is_available`, `content`, `reservation_id`) VALUES
('rec_01', '2026-03-24 11:00:00', 2, 1, 'Cần thêm 2 bạn đánh vui vẻ tại sân Thiên Quang tối mai!', 'res_01'),
('rec_02', '2026-03-24 15:00:00', 1, 1, 'Tìm đối giao lưu trình trung bình tại sân Như Quỳnh.', 'res_02');

INSERT INTO `temporary_registration` (`temporary_recruitment_id`, `player_id`) VALUES
('rec_01', 'pl_02'),
('rec_02', 'pl_04');
