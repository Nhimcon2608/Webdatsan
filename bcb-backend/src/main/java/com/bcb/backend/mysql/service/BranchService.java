package com.bcb.backend.mysql.service;

import java.util.List;
import java.util.stream.Collectors;
import javax.security.auth.login.AccountNotFoundException;
import org.springframework.stereotype.Service;
import com.bcb.backend.mysql.dto.request.CreateBranchRequest;
import com.bcb.backend.mysql.dto.request.UpdateBranchRequest;
import com.bcb.backend.mysql.dto.response.AccountResponse;
import com.bcb.backend.mysql.dto.response.BranchGetAllResponse;
import com.bcb.backend.mysql.dto.response.BranchResponse;
import com.bcb.backend.mysql.mapper.BranchMapper;
import com.bcb.backend.mysql.model.Branch;
import com.bcb.backend.mysql.repository.*;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BranchService {

	private final BranchRepository branchRepo;
	private final AccountService accountService;
	private final AccountRepository accountRepo;
	private final PartnershipRequestRepository partnershipRequestRepo;
	private final PartnershipRequestService partnershipRequestService;
	private final PriceService priceService;

	public List<BranchGetAllResponse> getAllBranchs() {
		return branchRepo.findAll().stream()
				.map(branch -> {
					var account = accountRepo.findById(branch.getAccount().getId())
							.orElseThrow(() -> new IllegalArgumentException(
									"Account not found with id: " + branch.getAccount().getId()));

					return BranchGetAllResponse.builder()
							.id(branch.getId())
							.branchName(branch.getBranchName())
							.email(branch.getEmail())
							.address(branch.getAddress())
							.isCooperated(branch.isCooperated())
							.phoneNumber(account.getPhoneNumber())
							.imagePath(account.getImagePath())
							.build();
				})
				.collect(Collectors.toList());
	}

	public List<BranchGetAllResponse> getBranchsByCooperated(boolean isCooperated) {
		return branchRepo.findAll().stream()
				.filter(branch -> branch.isCooperated() == isCooperated)
				.map(branch -> {
					var account = accountRepo.findById(branch.getAccount().getId())
							.orElseThrow(() -> new IllegalArgumentException(
									"Account not found with id: " + branch.getAccount().getId()));

					return BranchGetAllResponse.builder()
							.id(branch.getId())
							.branchName(branch.getBranchName())
							.email(branch.getEmail())
							.address(branch.getAddress())
							.isCooperated(branch.isCooperated())
							.phoneNumber(account.getPhoneNumber())
							.imagePath(account.getImagePath())
							.build();
				})
				.collect(Collectors.toList());
	}

	public BranchResponse getBranchById(String id) {
		return branchRepo.findById(id)
				.map(branch -> {
					var account = accountRepo.findById(branch.getAccount().getId())
							.orElseThrow(() -> new IllegalArgumentException(
									"Account not found with id: " + branch.getAccount().getId()));

					BranchResponse response = BranchMapper.toDTO(branch);
					response.setPhoneNumber(account.getPhoneNumber());
					response.setImagePath(account.getImagePath());
					response.setPrices(priceService.getPricesByBranchId(branch.getId()));

					return response;
				})
				.orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + id));
	}

	public BranchResponse getBranchByPartnershipRequest(String requestId) {
		return branchRepo.findByPartnershipRequestId(requestId)
				.map(branch -> {
					var account = accountRepo.findById(branch.getAccount().getId())
							.orElseThrow(() -> new IllegalArgumentException(
									"Account not found with id: " + branch.getAccount().getId()));

					BranchResponse response = BranchMapper.toDTO(branch);
					response.setPhoneNumber(account.getPhoneNumber());
					response.setImagePath(account.getImagePath());
					response.setPrices(priceService.getPricesByBranchId(branch.getId()));

					return response;
				})
				.orElseThrow(() -> new IllegalArgumentException(
						"Branch not found with partnership request id: " + requestId));
	}

	public BranchResponse changeCooperate(String id, boolean isCooperated) {
		Branch branch = branchRepo.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + id));

		branch.setCooperated(isCooperated);
		return BranchMapper.toDTO(branchRepo.save(branch));
	}

	public BranchResponse createBranch(CreateBranchRequest branchRequest) throws Exception {
		Branch branch = BranchMapper.toEntity(branchRequest);
		branch.setId(GenerationId.generateId("bran"));

		AccountResponse newAccount = accountService.registerManagerAccount(branchRequest.getAccountRequest());

		try {
			branch.setPartnershipRequest(
					partnershipRequestRepo.findById(branchRequest.getPartnershipRequestId())
							.orElseThrow(() -> new IllegalArgumentException(
									"Partnership request not found with id: "
											+ branchRequest.getPartnershipRequestId())));

			branch.setCooperated(true);
			partnershipRequestService.updateStatus(branchRequest.getPartnershipRequestId(), "approved");

			branch.setAccount(accountRepo.findById(newAccount.getId())
					.orElseThrow(() -> new AccountNotFoundException(
							"Account not found with id: " + newAccount.getId())));

			branchRepo.save(branch);
			return BranchMapper.toDTO(branch);

		} catch (Exception e) {
			throw e;
		}
	}

	public BranchResponse updateInformation(String id, UpdateBranchRequest updateBranchRequest) {
		Branch branch = branchRepo.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + id));

		if (updateBranchRequest.getDescription() != null) {
			branch.setDescription(updateBranchRequest.getDescription());
		}

		if (updateBranchRequest.getBranchName() != null) {
			branch.setBranchName(updateBranchRequest.getBranchName());
		}
		if (updateBranchRequest.getEmail() != null) {
			branch.setEmail(updateBranchRequest.getEmail());
		}
		if (updateBranchRequest.getAddress() != null) {
			branch.setAddress(updateBranchRequest.getAddress());
		}
		if (updateBranchRequest.getBankName() != null) {
			branch.setBankName(updateBranchRequest.getBankName());
		}
		if (updateBranchRequest.getBankNumber() != null) {
			branch.setBankNumber(updateBranchRequest.getBankNumber());
		}

		Branch updatedBranch = branchRepo.save(branch);

		return BranchMapper.toDTO(updatedBranch);
	}

	public BranchResponse getBranchByAccountId(String accountId) {
		Branch branch = branchRepo.findByAccountId(accountId)
				.orElseThrow(() -> new RuntimeException("Không tìm thấy chi nhánh với accountId: " + accountId));

		return BranchMapper.toDTO(branch);
	}
}
