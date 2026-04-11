package com.bcb.backend.mysql.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bcb.backend.mysql.dto.request.*;
import com.bcb.backend.mysql.dto.response.*;
import com.bcb.backend.mysql.mapper.PartnershipRequestMapper;
import com.bcb.backend.mysql.model.Owner;
import com.bcb.backend.mysql.model.PartnershipRequest;
import com.bcb.backend.mysql.repository.OwnerRepository;
import com.bcb.backend.mysql.repository.PartnershipRequestRepository;

import jakarta.transaction.Transactional;

@Service
public class PartnershipRequestService {
	private final PartnershipRequestRepository partnershipRequestRepo;
	private final OwnerRepository ownerRepo;
	private final OwnerService ownerService;

	public PartnershipRequestService(PartnershipRequestRepository partnershipRequestRepo, OwnerRepository ownerRepo,
			OwnerService ownerService) {
		this.partnershipRequestRepo = partnershipRequestRepo;
		this.ownerRepo = ownerRepo;
		this.ownerService = ownerService;
	}

	public List<PartnershipRequestResponse> getAllPartnershipRequests() {
		return partnershipRequestRepo.findAll().stream().map(PartnershipRequestMapper::toDTO)
				.collect(Collectors.toList());
	}

	public PartnershipRequestResponse getPartnershipRequestsById(String id) {
		return PartnershipRequestMapper.toDTO(partnershipRequestRepo.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("ParnershipRequest not found with id: " + id)));
	}

	@Transactional
	public PartnershipRequestResponse createPartnershipRequest(OwnerRequest ownerRequest,
			PartnershipRequestRequest partnerRequest) {

		partnerRequest.setId(GenerationId.generateId("pare"));
		partnerRequest.setStatus("sent");

		PartnershipRequest partner = PartnershipRequestMapper.toEntity(partnerRequest);

		Owner owner;
		if (ownerRequest.getId() != null && !ownerRequest.getId().isEmpty() && ownerRequest.getId().length() != 0) {
			owner = ownerRepo.findById(ownerRequest.getId())
					.orElseThrow(
							() -> new IllegalArgumentException("Owner not found with id: " + ownerRequest.getId()));
		} else {
			owner = ownerRepo.findByPhoneNumber(ownerRequest.getPhoneNumber())
					.orElseGet(() -> {
						OwnerResponse ownerResponse = ownerService.createOwner(ownerRequest);
						return ownerRepo.findById(ownerResponse.getId())
								.orElseThrow(
										() -> new IllegalArgumentException("Owner not create, id: " + ownerResponse.getId()));
					});
		}

		partner.setOwner(owner);

		return PartnershipRequestMapper.toDTO(partnershipRequestRepo.save(partner));
	}

	public PartnershipRequestResponse updateStatus(String id, String status) {
		PartnershipRequest partner = partnershipRequestRepo.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("ParnershipRequest not found with id: " + id));

		partner.setStatus(status);

		System.out.println(partner.getStatus() + " " + partner.getStatus().length());

		return PartnershipRequestMapper.toDTO(partnershipRequestRepo.save(partner));
	}

	@Transactional
	public boolean deletePartnershipRequest(String partnerId) {

		PartnershipRequest partnerToDelete = partnershipRequestRepo.findById(partnerId)
				.orElseThrow(() -> new IllegalArgumentException("ParnershipRequest not found with id: " + partnerId));

		if (partnerToDelete.getStatus() != "approved") {

			partnershipRequestRepo.delete(partnerToDelete);

			Owner owner = ownerRepo.findById(partnerToDelete.getOwner().getId()).orElseThrow(
					() -> new UnsupportedOperationException("Error when find owner of partnership request"));

			if (owner.getPartnershipRequests().size() == 1) {
				ownerRepo.delete(owner);
			}

			return true;

		}

		return false;
	}

}
