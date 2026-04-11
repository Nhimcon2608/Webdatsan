package com.bcb.backend.mysql.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.*;
import com.bcb.backend.mysql.model.Voucher;

public interface VoucherRepository extends JpaRepository<Voucher, String> {
    List<Voucher> findByIsAvailableTrue();
    List<Voucher> findByIsAvailableTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            LocalDate startDate, LocalDate endDate);
    List<Voucher> findByBranch_Id(String branchId);

}
