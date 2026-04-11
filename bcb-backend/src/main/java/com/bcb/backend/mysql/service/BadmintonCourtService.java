package com.bcb.backend.mysql.service;

import com.bcb.backend.mysql.dto.request.BadmintonCourtRequest;
import com.bcb.backend.mysql.dto.request.UpdateCourtStatusRequest;
import com.bcb.backend.mysql.dto.response.BadmintonCourtResponse;
import com.bcb.backend.mysql.mapper.BadmintonCourtMapper;
import com.bcb.backend.mysql.model.Account;
import com.bcb.backend.mysql.model.BadmintonCourt;
import com.bcb.backend.mysql.model.Branch;
import com.bcb.backend.mysql.repository.AccountRepository;
import com.bcb.backend.mysql.repository.BadmintonCourtRepository;
import com.bcb.backend.mysql.repository.BranchRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import jakarta.persistence.EntityNotFoundException;

@Service
@RequiredArgsConstructor
public class BadmintonCourtService {

    private final BadmintonCourtRepository badmintonCourtRepository;
    private final BranchRepository branchRepository;
    private final AccountRepository accountRepository;

    public BadmintonCourtResponse create(BadmintonCourtRequest request) {
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));

        if (request.getOrdinalNumber() < 1) {
            throw new IllegalArgumentException("Court ordinal number must be greater than 0");
        }

        if (badmintonCourtRepository.existsByBranch_IdAndOrdinalNumber(branch.getId(), request.getOrdinalNumber())) {
            throw new IllegalArgumentException("Court ordinal number already exists in this branch");
        }

        BadmintonCourt court = BadmintonCourtMapper.toBadmintonCourt(request, branch);
        court.setId(GenerationId.generateId("badm"));
        BadmintonCourt saved = badmintonCourtRepository.save(court);

        return BadmintonCourtMapper.toResponse(saved);
    }

    public List<BadmintonCourtResponse> getAll() {
        return badmintonCourtRepository.findAll().stream()
                .map(BadmintonCourtMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<BadmintonCourtResponse> getAllCourtsOfBranchByStatus(String branchId, String status) {

        if (status.equals("all")) {

            return badmintonCourtRepository.findAll().stream().filter(r -> r.getBranch().getId().equals(branchId))
            .map(BadmintonCourtMapper::toResponse)
            .collect(Collectors.toList());
        }

        Boolean isAvailable = Boolean.parseBoolean(status);

        return badmintonCourtRepository.findAll().stream().filter(r -> r.getBranch().getId().equals(branchId) && r.isAvailable() == isAvailable)
                .map(BadmintonCourtMapper::toResponse)
                .collect(Collectors.toList());
    }
    
    public List<BadmintonCourtResponse> getAllCourtsOfBranch(String branchId) {
        return badmintonCourtRepository.findAll().stream()
                .filter(r -> r.getBranch().getId().equals(branchId))
                .map(BadmintonCourtMapper::toResponse)
                .collect(Collectors.toList());
    }

    public BadmintonCourtResponse getById(String id) {
        return badmintonCourtRepository.findById(id)
                .map(BadmintonCourtMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Court not found"));
    }

    public BadmintonCourtResponse update(String id, BadmintonCourtRequest request) {
        BadmintonCourt court = badmintonCourtRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Court not found"));

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));

        if (request.getOrdinalNumber() < 1) {
            throw new IllegalArgumentException("Court ordinal number must be greater than 0");
        }

        boolean ordinalChanged = court.getOrdinalNumber() != request.getOrdinalNumber()
                || !court.getBranch().getId().equals(branch.getId());
        if (ordinalChanged
                && badmintonCourtRepository.existsByBranch_IdAndOrdinalNumber(branch.getId(), request.getOrdinalNumber())) {
            throw new IllegalArgumentException("Court ordinal number already exists in this branch");
        }

        court.setOrdinalNumber(request.getOrdinalNumber());
        court.setAvailable(request.isAvailable());
        court.setBranch(branch);

        return BadmintonCourtMapper.toResponse(badmintonCourtRepository.save(court));
    }

    public List<BadmintonCourtResponse> getCourtsByManager(String accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found"));

        Branch branch = account.getBranch();
        if (branch == null) {
            throw new EntityNotFoundException("Branch not found for this account");
        }

        List<BadmintonCourt> courts = badmintonCourtRepository.findByBranch_Id(branch.getId());

        return courts.stream()
                .map(BadmintonCourtMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<BadmintonCourt> getAllCourts() {
        return badmintonCourtRepository.findAll();
    }

    public BadmintonCourtResponse updateStatus(String id, UpdateCourtStatusRequest request) {
        BadmintonCourt court = badmintonCourtRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Court not found"));

        court.setAvailable(request.isAvailable());
        BadmintonCourt updatedCourt = badmintonCourtRepository.save(court);

        return BadmintonCourtMapper.toResponse(updatedCourt);
    }

    public void toggleAvailability(String id) {
        BadmintonCourt court = badmintonCourtRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Court not found"));

        court.setAvailable(!court.isAvailable());
        badmintonCourtRepository.save(court);
    }
}
