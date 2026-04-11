CREATE DATABASE IF NOT EXISTS `bcb_project`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `bcb_project`;

SET FOREIGN_KEY_CHECKS = 0;

-- Xóa bảng cũ để làm mới cấu trúc
DROP TABLE IF EXISTS `temporary_recruitment_saved`, `temporary_registration`, `reservation_detail`, 
                     `temporary_recruitment`, `payment_invoice`, `reservation`, `review`, `voucher`, 
                     `badminton_court_image`, `badminton_court`, `price`, `price_type`, `player`, 
                     `branch`, `partnership_request`, `owner`, `account`;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 1. TẠO CẤU TRÚC BẢNG (STRUCTURE)
-- ==========================================

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
  CONSTRAINT `fk_partnership_request_owner` FOREIGN KEY (`owner_id`) REFERENCES `owner` (`id`)
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
  CONSTRAINT `fk_branch_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `fk_branch_partnership_request` FOREIGN KEY (`partnership_request_id`) REFERENCES `partnership_request` (`id`)
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
  CONSTRAINT `fk_player_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`)
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
  CONSTRAINT `fk_price_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`),
  CONSTRAINT `fk_price_price_type` FOREIGN KEY (`price_type_id`) REFERENCES `price_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `badminton_court` (
  `id` varchar(255) NOT NULL,
  `ordinal_number` smallint DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `branch_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_badminton_court_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `badminton_court_image` (
  `id` varchar(255) NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `short_description` varchar(255) DEFAULT NULL,
  `badminton_court_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_badminton_court_image_court` FOREIGN KEY (`badminton_court_id`) REFERENCES `badminton_court` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `voucher` (
  `id` varchar(255) NOT NULL,
  `create_at` datetime(6) DEFAULT NULL,
  `start_date` date DEFAULT NULL, -- Cột start_date bổ sung ở đây
  `end_date` date DEFAULT NULL, -- Cột end_date bổ sung ở đây
  `discount_rate` double DEFAULT NULL,
  `event` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `branch_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_voucher_branch_id` (`branch_id`),
  CONSTRAINT `fk_voucher_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`)
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
  CONSTRAINT `fk_reservation_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`id`),
  CONSTRAINT `fk_reservation_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `voucher` (`id`),
  CONSTRAINT `fk_reservation_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payment_invoice` (
  `id` varchar(255) NOT NULL,
  `create_at` datetime(6) DEFAULT NULL,
  `total` decimal(38,2) DEFAULT NULL,
  `payment_status` varchar(255) DEFAULT NULL,
  `reservation_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_invoice_reservation_id` (`reservation_id`),
  CONSTRAINT `fk_payment_invoice_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `review` (
  `id` varchar(255) NOT NULL,
  `create_at` datetime(6) DEFAULT NULL,
  `rating_level` smallint DEFAULT NULL,
  `content` text DEFAULT NULL,
  `player_id` varchar(255) DEFAULT NULL,
  `branch_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_review_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`id`),
  CONSTRAINT `fk_review_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `temporary_recruitment` (
  `id` varchar(255) NOT NULL,
  `create_at` datetime(6) DEFAULT NULL,
  `quantity` smallint DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `content` text DEFAULT NULL,
  `reservation_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_temporary_recruitment_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reservation_detail` (
  `badminton_court_id` varchar(255) NOT NULL,
  `reservation_id` varchar(255) NOT NULL,
  `start_time` time(6) DEFAULT NULL,
  `rental_time` double DEFAULT NULL,
  PRIMARY KEY (`badminton_court_id`, `reservation_id`),
  CONSTRAINT `fk_reservation_detail_court` FOREIGN KEY (`badminton_court_id`) REFERENCES `badminton_court` (`id`),
  CONSTRAINT `fk_reservation_detail_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `temporary_registration` (
  `temporary_recruitment_id` varchar(255) NOT NULL,
  `player_id` varchar(255) NOT NULL,
  PRIMARY KEY (`temporary_recruitment_id`, `player_id`),
  CONSTRAINT `fk_temporary_registration_recruitment` FOREIGN KEY (`temporary_recruitment_id`) REFERENCES `temporary_recruitment` (`id`),
  CONSTRAINT `fk_temporary_registration_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `temporary_recruitment_saved` (
  `temporary_recruitment_id` varchar(255) NOT NULL,
  `player_id` varchar(255) NOT NULL,
  PRIMARY KEY (`temporary_recruitment_id`, `player_id`),
  CONSTRAINT `fk_temporary_recruitment_saved_recruitment` FOREIGN KEY (`temporary_recruitment_id`) REFERENCES `temporary_recruitment` (`id`),
  CONSTRAINT `fk_temporary_recruitment_saved_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 2. DỮ LIỆU MẪU (SEED DATA)
-- ==========================================

-- Accounts (Đã gộp image_path từ các lệnh UPDATE vào đây)
INSERT INTO `account` (`id`, `user_name`, `password`, `role`, `phone_number`, `image_path`, `is_activated`) VALUES
('acco_admin_001', 'admin', '$2y$10$JADap/0cPXpDW86C1Ud4UOEss4Je16n8eIvphUBPvZiaUk6zf7IDO', 'ADMIN', '0900000000', NULL, 1),
('acc_admin_01', 'trongphuoc', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'ADMIN', '0901234567', NULL, 1),
('acc_owner_01', 'quangthien', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'MANAGER', '0911222333', 'uploads/images/seed/branch-quangthien.jpg', 1),
('acc_owner_02', 'nhuquynh_owner', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'MANAGER', '0988111222', 'uploads/images/seed/branch-nhuquynh.jpg', 1),
('acc_owner_03', 'trongphuoc_owner', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'MANAGER', '0903456789', 'uploads/images/seed/branch-trongphuoc.jpg', 1),
('acc_owner_04', 'minhtam_owner', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'MANAGER', '0904567891', 'uploads/images/seed/branch-minhtam.jpg', 1),
('acc_player_01', 'nhuquynh', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'USER', '0988111222', 'uploads/images/seed/avatar-player-01.jpg', 1),
('acc_player_02', 'minhtam', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'USER', '0977333444', 'uploads/images/seed/avatar-player-02.jpg', 1),
('acc_player_03', 'thanhha', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'USER', '0944555666', 'uploads/images/seed/avatar-player-03.jpg', 1),
('acc_player_04', 'hoanglong', '$2a$12$godzW3ywiZkjYETVOIUiH.dFi3ycg8tdtxYDKInaPh0FUtRXFxf7u', 'USER', '0933444555', 'uploads/images/seed/avatar-player-04.jpg', 1)
ON DUPLICATE KEY UPDATE `image_path` = VALUES(`image_path`), `password` = VALUES(`password`);

-- Players
INSERT INTO `player` (`id`, `full_name`, `date_of_birth`, `gender`, `email`, `account_id`) VALUES
('pl_admin', 'Nguyễn Trọng Phước', '2004-06-12', 1, 'trongphuoc@bcb.vn', 'acc_admin_01'),
('pl_01', 'Trần Nguyễn Ngọc Như Quỳnh', '2005-01-12', 0, 'nhuquynh@gmail.com', 'acc_player_01'),
('pl_02', 'Trần Biện Minh Tâm', '2004-11-30', 1, 'minhtam@gmail.com', 'acc_player_02'),
('pl_03', 'Nguyễn Thanh Hà', '2003-05-20', 0, 'thanhha@gmail.com', 'acc_player_03'),
('pl_04', 'Phạm Hoàng Long', '1999-08-10', 1, 'hoanglong@gmail.com', 'acc_player_04');

-- Owners
INSERT INTO `owner` (`id`, `owner_name`, `phone_number`, `email`) VALUES
('own_01', 'Nguyễn Quang Thiện', '0911222333', 'quangthien@badminton.vn'),
('own_02', 'Trần Nguyễn Ngọc Như Quỳnh', '0988111222', 'nhuquynh@badminton.vn'),
('own_03', 'Nguyễn Trọng Phước', '0903456789', 'trongphuoc.owner@badminton.vn'),
('own_04', 'Trần Biện Minh Tâm', '0904567891', 'minhtam.owner@badminton.vn');

-- Partnership Requests
INSERT INTO `partnership_request` (`id`, `create_at`, `branch_name`, `address`, `phone_number`, `status`, `owner_id`) VALUES
('req_01', '2026-03-20 08:00:00', 'Sân Cầu Lông Quang Thiện', '456 Lê Trọng Tấn, Tân Phú, TP.HCM', '02838445566', 'APPROVED', 'own_01'),
('req_02', '2026-03-21 09:30:00', 'Sân Cầu Lông Như Quỳnh', '123 Cộng Hòa, Tân Bình, TP.HCM', '02812345678', 'APPROVED', 'own_02'),
('req_03', '2026-03-22 08:30:00', 'Trọng Phước Badminton', '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM', '02838647256', 'APPROVED', 'own_03'),
('req_04', '2026-03-22 09:00:00', 'Minh Tâm Badminton', '227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM', '02838309928', 'APPROVED', 'own_04');

-- Branches
INSERT INTO `branch` (`id`, `branch_name`, `email`, `address`, `bank_name`, `bank_number`, `description`, `is_cooperated`, `account_id`, `partnership_request_id`) VALUES
('br_01', 'Quang Thiện Badminton', 'contact@quangthien.vn', '456 Lê Trọng Tấn, Tân Phú, TP.HCM', 'MB Bank', '1900112233', 'Sân thảm mới 100%, trần cao thoáng mát.', 1, 'acc_owner_01', 'req_01'),
('br_02', 'Như Quỳnh Badminton', 'contact@nhuquynh.vn', '123 Cộng Hòa, Tân Bình, TP.HCM', 'Vietcombank', '0071000998877', 'Sân tiêu chuẩn thi đấu, sạch đẹp, nhân viên nhiệt tình.', 1, 'acc_owner_02', 'req_02'),
('br_03', 'Trọng Phước Badminton', 'contact@trongphuoc.vn', '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM', 'Techcombank', '1903988888', 'Không gian hiện đại, gần trung tâm, phù hợp đánh giao lưu và đặt lịch cố định.', 1, 'acc_owner_03', 'req_03'),
('br_04', 'Minh Tâm Badminton', 'contact@minhtam.vn', '227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM', 'ACB', '140299999', 'Sân thoáng, đèn sáng tốt, phù hợp cho cả người mới chơi và nhóm đánh cuối tuần.', 0, 'acc_owner_04', 'req_04');

-- Price Types
INSERT INTO `price_type` (`id`, `type`) VALUES
('pricetype_fixed', 'Cố định'),
('pricetype_casual', 'Vãng lai')
ON DUPLICATE KEY UPDATE `type` = VALUES(`type`);

-- Prices
INSERT INTO `price` (`id`, `start_time`, `end_time`, `day_of_week`, `price_per_hour`, `branch_id`, `price_type_id`) VALUES 
('pr_01', 5, 16, '0', 85000.00, 'br_01', 'pricetype_casual'),
('pr_02', 5, 16, '1', 120000.00, 'br_01', 'pricetype_casual'),
('pr_03', 5, 16, '0', 95000.00, 'br_02', 'pricetype_casual'),
('pr_04', 5, 16, '1', 130000.00, 'br_02', 'pricetype_casual'),
('pr_05', 5, 9, '0', 80000.00, 'br_01', 'pricetype_fixed'),
('pr_06', 17, 22, '0', 110000.00, 'br_01', 'pricetype_fixed'),
('pr_07', 5, 9, '0', 90000.00, 'br_02', 'pricetype_fixed'),
('pr_08', 17, 22, '0', 120000.00, 'br_02', 'pricetype_fixed'),
('pr_09', 5, 16, '0', 95000.00, 'br_03', 'pricetype_casual'),
('pr_10', 16, 22, '0', 125000.00, 'br_03', 'pricetype_casual'),
('pr_11', 5, 22, '1', 135000.00, 'br_03', 'pricetype_casual'),
('pr_12', 6, 10, '0', 85000.00, 'br_03', 'pricetype_fixed'),
('pr_13', 17, 22, '0', 115000.00, 'br_03', 'pricetype_fixed'),
('pr_14', 5, 16, '0', 90000.00, 'br_04', 'pricetype_casual'),
('pr_15', 16, 22, '0', 120000.00, 'br_04', 'pricetype_casual'),
('pr_16', 5, 22, '1', 130000.00, 'br_04', 'pricetype_casual'),
('pr_17', 6, 10, '0', 80000.00, 'br_04', 'pricetype_fixed'),
('pr_18', 17, 22, '0', 110000.00, 'br_04', 'pricetype_fixed'),
('pr_19', 16, 22, '0', 115000.00, 'br_01', 'pricetype_casual'),
('pr_20', 16, 22, '1', 140000.00, 'br_01', 'pricetype_casual'),
('pr_21', 16, 22, '0', 125000.00, 'br_02', 'pricetype_casual'),
('pr_22', 16, 22, '1', 145000.00, 'br_02', 'pricetype_casual')
ON DUPLICATE KEY UPDATE `price_per_hour` = VALUES(`price_per_hour`);

-- Badminton Courts
INSERT INTO `badminton_court` (`id`, `ordinal_number`, `is_available`, `branch_id`) VALUES
('ct_01', 1, 1, 'br_01'), ('ct_02', 2, 1, 'br_01'), ('ct_06', 3, 1, 'br_01'), ('ct_07', 4, 1, 'br_01'),
('ct_03', 1, 1, 'br_02'), ('ct_04', 2, 1, 'br_02'), ('ct_05', 3, 1, 'br_02'), ('ct_08', 4, 1, 'br_02'), ('ct_09', 5, 1, 'br_02'),
('ct_10', 1, 1, 'br_03'), ('ct_11', 2, 1, 'br_03'), ('ct_12', 3, 1, 'br_03'),
('ct_13', 1, 1, 'br_04'), ('ct_14', 2, 1, 'br_04'), ('ct_15', 3, 1, 'br_04'), ('ct_16', 4, 1, 'br_04')
ON DUPLICATE KEY UPDATE `is_available` = VALUES(`is_available`);

-- Badminton Court Images
INSERT INTO `badminton_court_image` (`id`, `image_path`, `short_description`, `badminton_court_id`) VALUES
('img_ct_01_a', 'uploads/images/seed/court-01.jpg', 'Court 1 main view', 'ct_01'),
('img_ct_02_a', 'uploads/images/seed/court-02.jpg', 'Court 2 main view', 'ct_02'),
('img_ct_03_a', 'uploads/images/seed/court-03.jpg', 'Court 1 branch 2 main view', 'ct_03'),
('img_ct_04_a', 'uploads/images/seed/court-04.jpg', 'Court 2 branch 2 main view', 'ct_04'),
('img_ct_05_a', 'uploads/images/seed/court-05.jpg', 'Court 3 branch 2 main view', 'ct_05'),
('img_ct_06_a', 'uploads/images/seed/court-06.jpg', 'Court 3 branch 1 main view', 'ct_06'),
('img_ct_07_a', 'uploads/images/seed/court-07.jpg', 'Court 4 branch 1 main view', 'ct_07'),
('img_ct_08_a', 'uploads/images/seed/court-08.jpg', 'Court 4 branch 2 main view', 'ct_08'),
('img_ct_09_a', 'uploads/images/seed/court-09.jpg', 'Court 5 branch 2 main view', 'ct_09'),
('img_ct_10_a', 'uploads/images/seed/court-10.jpg', 'Court 1 branch 3 main view', 'ct_10'),
('img_ct_11_a', 'uploads/images/seed/court-11.jpg', 'Court 2 branch 3 main view', 'ct_11'),
('img_ct_12_a', 'uploads/images/seed/court-12.jpg', 'Court 3 branch 3 main view', 'ct_12'),
('img_ct_13_a', 'uploads/images/seed/court-13.jpg', 'Court 1 branch 4 main view', 'ct_13'),
('img_ct_14_a', 'uploads/images/seed/court-14.jpg', 'Court 2 branch 4 main view', 'ct_14'),
('img_ct_15_a', 'uploads/images/seed/court-15.jpg', 'Court 3 branch 4 main view', 'ct_15'),
('img_ct_16_a', 'uploads/images/seed/court-16.jpg', 'Court 4 branch 4 main view', 'ct_16')
ON DUPLICATE KEY UPDATE `image_path` = VALUES(`image_path`);

-- Vouchers
INSERT INTO `voucher` (`id`, `create_at`, `start_date`, `end_date`, `discount_rate`, `event`, `is_available`, `branch_id`) VALUES
('vou_seed_01', '2026-04-01 09:00:00', '2026-04-01', '2026-06-01', 10.0, 'Morning Saver - weekday bookings before 9 AM', 1, 'br_01'),
('vou_seed_02', '2026-04-02 10:30:00', '2026-04-02', '2026-05-30', 15.0, 'Team Up - booking 2 hours or more', 1, 'br_01'),
('vou_seed_03', '2026-04-01 11:00:00', '2026-04-01', '2026-06-15', 12.0, 'Student Match - valid from Monday to Thursday', 1, 'br_02'),
('vou_seed_04', '2026-04-03 15:00:00', '2026-04-03', '2026-05-15', 18.0, 'Weekend Rally - limited promo for weekend slots', 1, 'br_02'),
('vou_seed_05', '2026-04-02 09:00:00', '2026-04-02', '2026-07-01', 10.0, 'Opening Week - Trọng Phước Badminton', 1, 'br_03'),
('vou_seed_06', '2026-04-02 09:30:00', '2026-04-02', '2026-06-20', 12.0, 'Early Bird - Minh Tâm Badminton', 1, 'br_04')
ON DUPLICATE KEY UPDATE
  `create_at` = VALUES(`create_at`),
  `start_date` = VALUES(`start_date`),
  `end_date` = VALUES(`end_date`),
  `discount_rate` = VALUES(`discount_rate`),
  `event` = VALUES(`event`),
  `is_available` = VALUES(`is_available`),
  `branch_id` = VALUES(`branch_id`);

-- Reservations
INSERT INTO `reservation` (`id`, `create_at`, `book_at`, `total_price`, `deposit`, `status`, `player_id`, `branch_id`) VALUES
('res_01', '2026-03-24 10:00:00', '2026-03-25 17:00:00', 180000.00, 50000.00, 'CONFIRMED', 'pl_01', 'br_01'),
('res_02', '2026-03-24 14:00:00', '2026-03-26 18:00:00', 200000.00, 100000.00, 'CONFIRMED', 'pl_03', 'br_02');

-- Reservation Details
INSERT INTO `reservation_detail` (`badminton_court_id`, `reservation_id`, `start_time`, `rental_time`) VALUES
('ct_01', 'res_01', '17:00:00', 2.0),
('ct_03', 'res_02', '18:00:00', 2.0);

-- Recruitment
INSERT INTO `temporary_recruitment` (`id`, `create_at`, `quantity`, `is_available`, `content`, `reservation_id`) VALUES
('rec_01', '2026-03-24 11:00:00', 2, 1, 'Cần thêm 2 bạn đánh vui vẻ!', 'res_01'),
('rec_02', '2026-03-24 15:00:00', 1, 1, 'Tìm đối giao lưu trình trung bình.', 'res_02');

-- Registrations
INSERT INTO `temporary_registration` (`temporary_recruitment_id`, `player_id`) VALUES
('rec_01', 'pl_02'),
('rec_02', 'pl_04'); 

-- Reviews
INSERT INTO `review` (`id`, `create_at`, `rating_level`, `content`, `player_id`, `branch_id`) VALUES
('rev_seed_01', '2026-04-01 19:30:00', 5, 'San thoang, den sang.', 'pl_01', 'br_01'),
('rev_seed_02', '2026-04-02 20:00:00', 4, 'Gia hop ly.', 'pl_02', 'br_01'),
('rev_seed_03', '2026-04-03 18:45:00', 5, 'Mat san em.', 'pl_03', 'br_01'),
('rev_seed_04', '2026-04-01 21:00:00', 5, 'Khu san sach se.', 'pl_02', 'br_02'),
('rev_seed_05', '2026-04-02 17:40:00', 4, 'Phu hop danh giao luu.', 'pl_04', 'br_02'),
('rev_seed_06', '2026-04-04 08:15:00', 5, 'Dat san nhanh.', 'pl_01', 'br_02'),
('rev_seed_07', '2026-04-04 18:00:00', 5, 'Vi tri trung tam.', 'pl_02', 'br_03'),
('rev_seed_08', '2026-04-04 20:30:00', 4, 'San moi, den sang.', 'pl_04', 'br_03'),
('rev_seed_09', '2026-04-05 19:10:00', 5, 'Dia chi de tim.', 'pl_03', 'br_04'),
('rev_seed_10', '2026-04-05 21:00:00', 4, 'San thoang.', 'pl_01', 'br_04');