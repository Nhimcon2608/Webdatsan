package com.bcb.backend.mysql.mapper;

import com.bcb.backend.mysql.dto.request.VoucherRequest;
import com.bcb.backend.mysql.dto.response.VoucherResponse;
import com.bcb.backend.mysql.model.Voucher;

public class VoucherMapper {

    public static VoucherResponse toDTO(Voucher voucher) {

        return VoucherResponse.builder()
                .id(voucher.getId())
                .createAt(voucher.getCreateAt())
                .discountRate(voucher.getDiscountRate())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .event(voucher.getEvent())
                .isAvailable(voucher.isAvailable())
                .branchName(voucher.getBranch() != null ? voucher.getBranch().getBranchName() : null)
                .build();
    }

    public static Voucher toEntity(VoucherRequest dto) {

        return Voucher.builder()
                .discountRate(dto.getDiscountRate())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .event(dto.getEvent())
                .isAvailable(dto.isAvailable())
                .build();
    }
}
