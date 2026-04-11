package com.bcb.backend.mysql.dto.request;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherRequest {
    private double discountRate;
    private LocalDate startDate;
    private LocalDate endDate;
    private String event;
    private boolean isAvailable;
    private String branchId;
}
