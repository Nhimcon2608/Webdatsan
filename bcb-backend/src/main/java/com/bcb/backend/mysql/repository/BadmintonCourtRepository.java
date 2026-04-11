package com.bcb.backend.mysql.repository;

import com.bcb.backend.mysql.model.BadmintonCourt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BadmintonCourtRepository extends JpaRepository<BadmintonCourt, String> {
    List<BadmintonCourt> findByBranch_Id(String branchId);

    boolean existsByBranch_IdAndOrdinalNumber(String branchId, short ordinalNumber);
}
