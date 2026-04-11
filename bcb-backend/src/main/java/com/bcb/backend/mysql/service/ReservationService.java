package com.bcb.backend.mysql.service;

import com.bcb.backend.SSE.SSEEventType;
import com.bcb.backend.SSE.SSEService;
import com.bcb.backend.mysql.dto.request.ReservationRequestDTO;
import com.bcb.backend.mysql.dto.response.ReservationResponseDTO;
import com.bcb.backend.mysql.mapper.ReservationMapper;
import com.bcb.backend.mysql.model.Reservation;
import com.bcb.backend.mysql.model.Voucher;
import com.bcb.backend.mysql.repository.BranchRepository;
import com.bcb.backend.mysql.repository.PlayerRepository;
import com.bcb.backend.mysql.repository.ReservationRepository;
import com.bcb.backend.mysql.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReservationService {

	private final ReservationRepository reservationRepository;
	private final PlayerRepository playerRepository;
	private final VoucherRepository voucherRepository;
	private final BranchRepository branchRepository;
	private final SSEService sseService;
	private final PlayerAccountService playerAccountService;

	public List<ReservationResponseDTO> getAllReservations() {
		return reservationRepository.findAll().stream()
				.map(ReservationMapper::toDTO)
				.collect(Collectors.toList());
	}

	public ReservationResponseDTO getReservationById(String id) {
		Reservation reservation = reservationRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Reservation not found"));
		return ReservationMapper.toDTO(reservation);
	}

	public List<ReservationResponseDTO> getAllReservationsOfUser(String accountId, String status) {

		/*
		 * status
		 * tát cả: all
		 * đang chờ thanh toán: awaiting_payment
		 * đang chờ checkin: waiting
		 * đã checkin: checked
		 * đã hoàn thành: finish
		 * đã hủy: cancel
		 */

		String playerId = playerAccountService.getPlayerForUserAccount(accountId).getId();

		if (status.equals("all")) {
			return reservationRepository.findAll().stream()
					.filter(r -> r.getPlayer().getId().equals(playerId))
					.map(ReservationMapper::toDTO).collect(Collectors.toList());
		}

		return reservationRepository.findAll().stream()
				.filter(r -> r.getPlayer().getId().equals(playerId) && r.getStatus().equals(status))
				.map(ReservationMapper::toDTO).collect(Collectors.toList());
	}

	public List<ReservationResponseDTO> getUncanceledReservationOfBranchByDate(String branchId, Date date) {

		ZoneId zone = ZoneId.systemDefault();

		LocalDate localDate = date.toInstant()
				.atZone(zone)
				.toLocalDate();

		Date startOfDay = Date.from(
				localDate.atStartOfDay(zone).toInstant());

		Date endOfDay = Date.from(
				localDate.plusDays(1).atStartOfDay(zone).toInstant());

		return reservationRepository
				.findByBranch_IdAndBookAtGreaterThanEqualAndBookAtLessThanAndStatusNot(
						branchId,
						startOfDay,
						endOfDay,
						"cancel")
				.stream()
				.map(ReservationMapper::toDTO)
				.toList();
	}

	public List<ReservationResponseDTO> getUncanceledReservationOfBranchBetween(String branchId, Date from, Date to) {
		return reservationRepository
				.findByBookAtBetweenAndStatusNotAndBranch_Id(from, to, "cancel", branchId)
				.stream()
				.map(ReservationMapper::toDTO)
				.collect(Collectors.toList());

	}

	public ReservationResponseDTO createReservation(ReservationRequestDTO dto) {

		Reservation reservation = new Reservation();
		reservation.setId(GenerationId.generateId("rese"));
		ReservationMapper.updateEntity(reservation, dto);

		if (dto.getPlayerId() != null) {
			playerRepository.findById(dto.getPlayerId())
					.ifPresent(reservation::setPlayer);
		}

		applyVoucher(reservation, dto.getVoucherId());

		if (dto.getBranchId() != null) {
			branchRepository.findById(dto.getBranchId())
					.ifPresent(reservation::setBranch);
		}

		// reservation.setTotalPrice(BigDecimal.ZERO);

		reservation = reservationRepository.save(reservation);

		return ReservationMapper.toDTO(reservation);
	}

	public boolean sendToManager(String reservationId) {
		try {
			Reservation reservation = reservationRepository.findById(reservationId).orElse(null);

			String managerAccountId = reservation.getBranch().getAccount().getId();
			sseService.sendToUser(managerAccountId, SSEEventType.RESERVATION_CREATED,
					ReservationMapper.toDTO(reservation));
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	public ReservationResponseDTO updateReservation(String id, ReservationRequestDTO dto) {
		Reservation reservation = reservationRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Reservation not found"));

		ReservationMapper.updateEntity(reservation, dto);

		if (dto.getPlayerId() != null) {
			playerRepository.findById(dto.getPlayerId())
					.ifPresent(reservation::setPlayer);
		}

		applyVoucher(reservation, dto.getVoucherId());

		reservation = reservationRepository.save(reservation);

		return ReservationMapper.toDTO(reservation);
	}

	public ReservationResponseDTO cancelReservation(String id) {
		Reservation reservation = reservationRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Reservation not found"));

		reservation.setStatus("cancel");

		// if (reservation.getReservationDetails() != null) {
		// reservation.getReservationDetails().forEach(detail -> {
		// detail.getBadmintonCourt().setAvailable(true);
		// });
		// }

		reservation = reservationRepository.save(reservation);

		return ReservationMapper.toDTO(reservation);
	}

	private void applyVoucher(Reservation reservation, String voucherId) {
		if (voucherId == null || voucherId.isBlank()) {
			return;
		}

		Voucher voucher = voucherRepository.findById(voucherId)
				.orElseThrow(() -> new IllegalArgumentException("Voucher not found"));

		if (!isVoucherActive(voucher)) {
			throw new IllegalArgumentException("Voucher không còn hiệu lực");
		}

		reservation.setVoucher(voucher);
	}

	private boolean isVoucherActive(Voucher voucher) {
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
		return voucher.isAvailable()
				&& voucher.getStartDate() != null
				&& voucher.getEndDate() != null
				&& !today.isBefore(voucher.getStartDate())
				&& !today.isAfter(voucher.getEndDate());
	}

	public List<ReservationResponseDTO> getRecentReservations(String branchId, String status) {
		List<Reservation> reservations;

		if (status != null && !status.isEmpty()) {
			reservations = reservationRepository
					.findTop5ByBranchIdAndStatusOrderByCreateAtDesc(branchId, status);
		} else {
			reservations = reservationRepository
					.findTop5ByBranchIdOrderByCreateAtDesc(branchId);
		}

		return reservations.stream()
				.map(ReservationMapper::toDTO)
				.collect(Collectors.toList());
	}

	@Async
	public void scheduleCancellation(String reservationId) {

		try {
			Thread.sleep(10 * 60 * 1000);
			Reservation r = reservationRepository.findById(reservationId).orElse(null);

			if (r != null && r.getStatus().equals("awaiting_payment")) {
				r.setDeposit(BigDecimal.ZERO);
				r.setStatus("cancel");
				reservationRepository.save(r);
			}
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}

	}

	@Async
	public void scheduleCancellation(List<String> reservationIds) {

		try {
			for (String id : reservationIds) {

				Thread.sleep(10 * 60 * 1000);
				Reservation r = reservationRepository.findById(id).orElse(null);

				if (r != null && r.getStatus().equals("awaiting_payment")) {
					r.setDeposit(BigDecimal.ZERO);
					r.setStatus("cancel");
					reservationRepository.save(r);
				}
			}
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}

	}

	@Scheduled(fixedRate = 24 * 60 * 60 * 1000)
	public void cleanupExpiredReservations() {
		ZoneId vietnamZone = ZoneId.of("Asia/Ho_Chi_Minh");
		LocalDate yesterdayVN = LocalDate.now(vietnamZone).minusDays(1);

		List<Reservation> expiredReservations = reservationRepository.findAll().stream()
				.filter(r -> {
					Date bookAtDate = r.getBookAt();
					LocalDate bookAtVN = bookAtDate.toInstant()
							.atZone(vietnamZone)
							.toLocalDate();
					return bookAtVN.isBefore(yesterdayVN) && !r.getStatus().equals("cancel")
							&& !r.getStatus().equals("checked") && !r.getStatus().equals("finish");
				})
				.collect(Collectors.toList());

		for (Reservation reservation : expiredReservations) {

			reservation.setStatus("cancel");
			reservationRepository.save(reservation);

		}

		System.out.println("Đã dọn " + expiredReservations.size() + " reservation hết hạn.");
	}

	public List<ReservationResponseDTO> getReservationsByBranchAll(String branchId, String status) {
		List<Reservation> reservations;

		if (status != null && !status.isEmpty()) {
			reservations = reservationRepository.findByBranch_IdAndStatus(branchId, status);
		} else {
			reservations = reservationRepository.findByBranch_Id(branchId);
		}

		return reservations.stream()

				.map(ReservationMapper::toDTO)
				.collect(Collectors.toList());
	}

	public List<ReservationResponseDTO> getReservationsByBranch(String branchId, String status) {
		List<Reservation> reservations;

		if (status != null && !status.isEmpty()) {
			reservations = reservationRepository.findTop5ByBranchIdAndStatusOrderByCreateAtDesc(branchId, status);
		} else {
			reservations = reservationRepository.findTop5ByBranchIdOrderByCreateAtDesc(branchId);
		}

		return reservations.stream()
				.limit(5)
				.map(ReservationMapper::toDTO)
				.collect(Collectors.toList());
	}

	public ReservationResponseDTO updateStatus(String id, String status) {
		Set<String> validStatuses = Set.of("checked", "waiting", "cancel", "finish", "pending_confirmation");
		if (!validStatuses.contains(status.toLowerCase())) {
			throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
		}

		Reservation reservation = reservationRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Không tìm thấy đặt sân"));

		reservation.setStatus(status.toLowerCase());
		reservationRepository.save(reservation);

		return ReservationMapper.toDTO(reservation);
	}

	public ReservationResponseDTO confirmPayment(String id) {
		Reservation reservation = reservationRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Không tìm thấy đặt sân"));

		if (!"pending_confirmation".equals(reservation.getStatus())) {
			throw new IllegalStateException("Đặt sân không ở trạng thái chờ xác nhận thanh toán");
		}

		reservation.setStatus("waiting");
		reservationRepository.save(reservation);

		String playerAccountId = reservation.getPlayer().getAccount().getId();
		sseService.sendToUser(playerAccountId, SSEEventType.PAYMENT_CONFIRMED, ReservationMapper.toDTO(reservation));

		return ReservationMapper.toDTO(reservation);
	}

	public ReservationResponseDTO rejectPayment(String id) {
		Reservation reservation = reservationRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Không tìm thấy đặt sân"));

		if (!"pending_confirmation".equals(reservation.getStatus())) {
			throw new IllegalStateException("Đặt sân không ở trạng thái chờ xác nhận thanh toán");
		}

		reservation.setStatus("cancel");
		reservationRepository.save(reservation);

		String playerAccountId = reservation.getPlayer().getAccount().getId();
		sseService.sendToUser(playerAccountId, SSEEventType.PAYMENT_REJECTED, ReservationMapper.toDTO(reservation));

		return ReservationMapper.toDTO(reservation);
	}

	public List<ReservationResponseDTO> getAllReservationsByBookAtDesc(String branchId) {
		List<Reservation> reservations;

		if (branchId != null && !branchId.isEmpty()) {
			// Lấy theo branchId sắp xếp bookAt giảm dần
			reservations = reservationRepository.findByBranch_IdOrderByBookAtDesc(branchId);
		} else {
			// Lấy tất cả
			reservations = reservationRepository.findAllByOrderByBookAtDesc();
		}

		return reservations.stream()
				.map(ReservationMapper::toDTO)
				.collect(Collectors.toList());
	}
}
