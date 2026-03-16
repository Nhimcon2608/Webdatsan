package com.bcb.backend.mysql.service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bcb.backend.mysql.dto.request.TemporaryRecruitmentRequest;
import com.bcb.backend.mysql.dto.response.BadmintonCourtRentalInformation;
import com.bcb.backend.mysql.dto.response.PaginationResponse;
import com.bcb.backend.mysql.dto.response.TemporaryRecruitmentCompactResponse;
import com.bcb.backend.mysql.dto.response.TemporaryRecruitmentDetailResponse;
import com.bcb.backend.mysql.dto.response.TemporaryRecruitmentResponse;
import com.bcb.backend.mysql.mapper.TemporaryRecruitmentMapper;
import com.bcb.backend.mysql.model.Reservation;
import com.bcb.backend.mysql.model.ReservationDetail;
import com.bcb.backend.mysql.model.TemporaryRecruitment;
import com.bcb.backend.mysql.repository.ReservationRepository;
import com.bcb.backend.mysql.repository.TemporaryRecruitmentRepository;
import com.bcb.backend.SSE.SSEEventType;
import com.bcb.backend.SSE.SSEService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class TemporaryRecruitmentService {

	private final TemporaryRecruitmentRepository temporaryRecruitmentRepository;
	private final ReservationRepository reservationRepository;
	private final SSEService sseService;

	@Transactional(rollbackFor = Exception.class)
	public TemporaryRecruitmentCompactResponse createTemporaryRecruitment(TemporaryRecruitmentRequest request) {
		Reservation reservation = reservationRepository.findById(request.getReservationId())
				.orElseThrow(
						() -> new RuntimeException("Reservation not found with id: " + request.getReservationId()));

		TemporaryRecruitment temporaryRecruitment = TemporaryRecruitmentMapper.toEntity(request, reservation);
		temporaryRecruitment.setContent(request.getContent() == null ? "" : request.getContent());

		String temporaryId = GenerationId.generateId("temp");
		temporaryRecruitment.setId(temporaryId);

		TemporaryRecruitment savedEntity = temporaryRecruitmentRepository.save(temporaryRecruitment);
		TemporaryRecruitmentCompactResponse response = TemporaryRecruitmentMapper.toDTO(savedEntity);

		sseService.broadcastToAll(SSEEventType.TEMPORARY_RECRUITMENT_POST_CREATED, response);
		return response;
	}

	/**
	 * Get paginated temporary recruitments with custom sort and pagination
	 * 
	 * @param page          page number (0-indexed)
	 * @param size          page size
	 * @param sortBy        field to sort by
	 * @param sortDirection sort direction (ASC, DESC)
	 * @return PaginationResponse containing paginated data
	 */
	public PaginationResponse<TemporaryRecruitmentCompactResponse> getAll(
			String status, int page, int size, String sortBy, String sortDirection,
			String searchByName, Date createdFrom, Date createdTo,
			Date bookAtFrom, Date bookAtTo, Integer quantityMin, Integer quantityMax) {

		page = Math.max(page, 0);
		size = Math.min(Math.max(size, 1), 30);

		Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection)
				? Sort.Direction.ASC
				: Sort.Direction.DESC;

		Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

		Specification<TemporaryRecruitment> spec = Specification.where(null);

		// TODO: enable this code to show temporary days after the current date.
		// Date now = new Date();
		// spec = spec.and((root, query, cb) ->
		// cb.greaterThanOrEqualTo(root.get("reservation").get("bookAt"), now));

		if (!"all".equalsIgnoreCase(status)) {
			boolean available = Boolean.parseBoolean(status);
			spec = spec.and((root, query, cb) -> cb.equal(root.get("isAvailable"), available));
		}

		if (searchByName != null && !searchByName.isEmpty()) {
			String pattern = "%" + searchByName.toLowerCase() + "%";
			spec = spec.and((root, query, cb) -> cb.or(
					cb.like(cb.lower(root.get("reservation")
							.get("player")
							.get("account")
							.get("username")), pattern),
					cb.like(cb.lower(root.get("reservation")
							.get("branch")
							.get("branchName")), pattern)));
		}

		if (createdFrom != null) {
			spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createAt"), createdFrom));
		}

		if (createdTo != null) {
			spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createAt"), createdTo));
		}

		if (bookAtFrom != null) {
			spec = spec.and(
					(root, query, cb) -> cb.greaterThanOrEqualTo(root.get("reservation").get("bookAt"), bookAtFrom));
		}

		if (bookAtTo != null) {
			spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("reservation").get("bookAt"), bookAtTo));
		}

		if (quantityMin != null) {
			spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("quantity"), quantityMin));
		}

		if (quantityMax != null) {
			spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("quantity"), quantityMax));
		}

		Page<TemporaryRecruitment> pageResult = temporaryRecruitmentRepository.findAll(spec, pageable);

		Page<TemporaryRecruitmentCompactResponse> mappedPage = pageResult.map(TemporaryRecruitmentMapper::toDTO);

		return PaginationResponse.<TemporaryRecruitmentCompactResponse>builder()
				.data(mappedPage.getContent())
				.pageNumber(mappedPage.getNumber())
				.pageSize(mappedPage.getSize())
				.totalElements(mappedPage.getTotalElements())
				.totalPages(mappedPage.getTotalPages())
				.isFirst(mappedPage.isFirst())
				.isLast(mappedPage.isLast())
				.build();
	}

	public TemporaryRecruitmentDetailResponse getById(String id) {
		TemporaryRecruitment temporaryRecruitment = temporaryRecruitmentRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("TemporaryRecruitment not found"));

		List<ReservationDetail> reservationDetails = temporaryRecruitment.getReservation().getReservationDetails();

		List<BadmintonCourtRentalInformation> courtRental = reservationDetails.stream().map(item -> {
			return BadmintonCourtRentalInformation.builder()
					.ordinalNumber(item.getBadmintonCourt().getOrdinalNumber())
					.startTime(item.getStartTime())
					.rentalTime(item.getRentalTime())
					.build();

		})
				.collect(Collectors.toList());

		return TemporaryRecruitmentDetailResponse.builder()
				.id(temporaryRecruitment.getId())
				.address(temporaryRecruitment.getReservation().getBranch().getAddress())
				.badmintonCourtRentalInformations(courtRental)
				.build();
	}

	public TemporaryRecruitmentResponse getFullInforById(String id) {
		TemporaryRecruitment temporaryRecruitment = temporaryRecruitmentRepository.findById(id)
				.orElse(null);

		if (temporaryRecruitment == null || !temporaryRecruitment.isAvailable()) {
			return null;
		}

		List<ReservationDetail> reservationDetails = temporaryRecruitment.getReservation().getReservationDetails();

		List<BadmintonCourtRentalInformation> courtRental = reservationDetails.stream().map(item -> {
			return BadmintonCourtRentalInformation.builder()
					.ordinalNumber(item.getBadmintonCourt().getOrdinalNumber())
					.startTime(item.getStartTime())
					.rentalTime(item.getRentalTime())
					.build();

		})
				.collect(Collectors.toList());

		return TemporaryRecruitmentResponse.builder()
				.id(temporaryRecruitment.getId())
				.createAt(temporaryRecruitment.getCreateAt())
				.quantity(temporaryRecruitment.getQuantity())
				.isAvailable(temporaryRecruitment.isAvailable())
				.reservationId(temporaryRecruitment.getReservation().getId())
				.content(temporaryRecruitment.getContent() == null ? "" : temporaryRecruitment.getContent())
				.bookAt(temporaryRecruitment.getReservation().getBookAt())
				.username(temporaryRecruitment.getReservation().getPlayer().getAccount().getUsername())
				.imagePath(temporaryRecruitment.getReservation().getPlayer().getAccount().getImagePath())
				.branchName(temporaryRecruitment.getReservation().getBranch().getBranchName())
				.address(temporaryRecruitment.getReservation().getBranch().getAddress())
				.badmintonCourtRentalInformations(courtRental)
				.build();
	}

	public List<TemporaryRecruitmentCompactResponse> getByReservationId(String resId) {

		List<TemporaryRecruitment> temporaryRecruitments = temporaryRecruitmentRepository
				.findAllByReservation_Id(resId);

		if (temporaryRecruitments == null || temporaryRecruitments.size() == 0) {
			return null;
		}

		return temporaryRecruitments.stream().map(item -> {

			return TemporaryRecruitmentCompactResponse.builder()
					.id(item.getId())
					.createAt(item.getCreateAt())
					.quantity(item.getQuantity())
					.isAvailable(item.isAvailable())
					.reservationId(resId)
					.content(item.getContent() == null ? "" : item.getContent())
					.bookAt(item.getReservation().getBookAt())
					.build();
		}).collect(Collectors.toList());
	}

	@Transactional(rollbackFor = Exception.class)
	public TemporaryRecruitmentCompactResponse update(String id, TemporaryRecruitmentRequest request) {
		TemporaryRecruitment temporaryRecruitment = temporaryRecruitmentRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("TemporaryRecruitment not found"));

		temporaryRecruitment.setQuantity(request.getQuantity());
		temporaryRecruitment.setAvailable(request.getAvailable());

		if (request.getContent() != null && !request.getContent().isEmpty()) {
			temporaryRecruitment.setContent(request.getContent());
		} else if (temporaryRecruitment.getContent() == null) {
			temporaryRecruitment.setContent("");
		}
		temporaryRecruitment = temporaryRecruitmentRepository.save(temporaryRecruitment);

		return TemporaryRecruitmentMapper.toDTO(temporaryRecruitment);
	}

	public TemporaryRecruitmentCompactResponse changeStatus(String id, boolean isAvailable) {
		TemporaryRecruitment temporaryRecruitment = temporaryRecruitmentRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("TemporaryRecruitment not found"));

		temporaryRecruitment.setAvailable(isAvailable);
		temporaryRecruitment = temporaryRecruitmentRepository.save(temporaryRecruitment);

		return TemporaryRecruitmentMapper.toDTO(temporaryRecruitment);

	}

	public void delete(String id) {
		TemporaryRecruitment temporaryRecruitment = temporaryRecruitmentRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("TemporaryRecruitment not found"));
		temporaryRecruitment.setAvailable(false);
		temporaryRecruitmentRepository.save(temporaryRecruitment);
	}
}
