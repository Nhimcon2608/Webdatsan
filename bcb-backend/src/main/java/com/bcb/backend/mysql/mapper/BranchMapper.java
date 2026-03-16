package com.bcb.backend.mysql.mapper;

import com.bcb.backend.mysql.dto.request.CreateBranchRequest;
import com.bcb.backend.mysql.dto.response.BranchResponse;
import com.bcb.backend.mysql.model.Branch;

public class BranchMapper {

	public static BranchResponse toDTO(Branch entity) {
		return BranchResponse.builder()
				.id(entity.getId())
				.branchName(entity.getBranchName())
				.email(entity.getEmail())
				.address(entity.getAddress())
				.bankName(entity.getBankName())
				.bankNumber(entity.getBankNumber())
				.isCooperated(entity.isCooperated())
				.description(entity.getDescription() == null ? "" : entity.getDescription())
				.build();
	}

	public static Branch toEntity(CreateBranchRequest dto) {
		return Branch.builder()
				.branchName(dto.getBranchName())
				.email(dto.getEmail())
				.address(dto.getAddress())
				.bankName(dto.getBankName())
				.bankNumber(dto.getBankNumber())
				.description("")
				.build();
	}
}
