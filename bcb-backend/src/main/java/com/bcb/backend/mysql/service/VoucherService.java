package com.bcb.backend.mysql.service;

import com.bcb.backend.mysql.dto.request.VoucherRequest;
import com.bcb.backend.mysql.dto.response.VoucherResponse;
import com.bcb.backend.mysql.mapper.VoucherMapper;
import com.bcb.backend.mysql.model.Branch;
import com.bcb.backend.mysql.model.Voucher;
import com.bcb.backend.mysql.repository.BranchRepository;
import com.bcb.backend.mysql.repository.VoucherRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final BranchRepository branchRepository;

    public VoucherService(VoucherRepository voucherRepository, BranchRepository branchRepository) {
        this.voucherRepository = voucherRepository;
        this.branchRepository = branchRepository;
    }

    // Lấy toàn bộ voucher
    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAll().stream()
                .map(VoucherMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Lấy toàn bộ voucher còn hiệu lực
    public List<VoucherResponse> getActiveVouchers() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        return voucherRepository
                .findByIsAvailableTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today).stream()
                .map(VoucherMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Lấy một voucher theo ID
    public VoucherResponse getVoucherById(String id) {
        return voucherRepository.findById(id)
                .map(VoucherMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
    }

    // Tạo mới voucher
    public VoucherResponse create(VoucherRequest request) {
        validateRequest(request);

        Voucher voucher = VoucherMapper.toEntity(request);
        voucher.setId(GenerationId.generateId("vouc"));
        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId()).orElse(null);
            voucher.setBranch(branch);
        }
        return VoucherMapper.toDTO(voucherRepository.save(voucher));
    }

    // Cập nhật voucher
    public VoucherResponse updateVoucher(String id, VoucherRequest request) {
        validateRequest(request);

        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        voucher.setDiscountRate(request.getDiscountRate());
        voucher.setStartDate(request.getStartDate());
        voucher.setEndDate(request.getEndDate());
        voucher.setEvent(request.getEvent());
        voucher.setAvailable(request.isAvailable());

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId()).orElse(null);
            voucher.setBranch(branch);
        }

        return VoucherMapper.toDTO(voucherRepository.save(voucher));
    }

    // Xóa mềm voucher
    public VoucherResponse disableVoucher(String id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        voucher.setAvailable(false);
        return VoucherMapper.toDTO(voucherRepository.save(voucher));
    }

    public List<VoucherResponse> getAllVouchersOfBranch(String branchId) {
        return voucherRepository.findByBranch_Id(branchId).stream()
                .map(VoucherMapper::toDTO).collect(Collectors.toList());
    }

    // Kích hoạt voucher / xoa voucher
    public VoucherResponse enableVoucher(String id, boolean status) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        voucher.setAvailable(status);
        return VoucherMapper.toDTO(voucherRepository.save(voucher));
    }

    private void validateRequest(VoucherRequest request) {
        if (request.getStartDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày bắt đầu voucher");
        }

        if (request.getEndDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày kết thúc voucher");
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        }
    }

}
