package com.bcb.backend.mysql.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.sql.Timestamp;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;

import org.springframework.stereotype.Service;

import com.bcb.backend.mysql.dto.request.FixedBookingRequest;
import com.bcb.backend.mysql.dto.request.FixedBookingReservationDetailRequest;
import com.bcb.backend.mysql.dto.request.WeeklySchedule;
import com.bcb.backend.mysql.dto.response.ReservationResponseDTO;
import com.bcb.backend.mysql.mapper.ReservationMapper;
import com.bcb.backend.mysql.model.BadmintonCourt;
import com.bcb.backend.mysql.model.Branch;
import com.bcb.backend.mysql.model.Player;
import com.bcb.backend.mysql.model.Reservation;
import com.bcb.backend.mysql.model.ReservationDetail;
import com.bcb.backend.mysql.model.ReservationDetailId;
import com.bcb.backend.mysql.model.Voucher;
import com.bcb.backend.mysql.repository.BadmintonCourtRepository;
import com.bcb.backend.mysql.repository.BranchRepository;
import com.bcb.backend.mysql.repository.ReservationDetailRepository;
import com.bcb.backend.mysql.repository.ReservationRepository;
import com.bcb.backend.mysql.repository.VoucherRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FixedBookingService {

	private final PlayerAccountService playerAccountService;
	private final ReservationRepository reservationRepository;
	private final ReservationDetailRepository reservationDetailRepository;
	private final VoucherRepository voucherRepository;
	private final BranchRepository branchRepository;
	private final BadmintonCourtRepository badmintonCourtRepository;

	@Transactional
	public List<String> createFixedBooking(String accountId, FixedBookingRequest req) {

		Player player = playerAccountService.getPlayerForUserAccount(accountId);

		Voucher voucher = null;
		if (req.getVoucherId() != null && !req.getVoucherId().isBlank()) {
			voucher = voucherRepository.findById(req.getVoucherId())
					.orElseThrow(() -> new IllegalArgumentException("Voucher not found"));
			if (!isVoucherActive(voucher)) {
				throw new IllegalArgumentException("Voucher không còn hiệu lực");
			}
		}

		Branch branch = branchRepository.findById(req.getBranchId())
				.orElseThrow(() -> new IllegalArgumentException("Branch not found"));

		// LẤY totalPrice và deposit TỪ REQUEST (frontend gửi số, không phải String)
		BigDecimal totalPrice = req.getTotalPrice() != null ? req.getTotalPrice() : BigDecimal.ZERO;
		BigDecimal deposit = req.getDeposit() != null ? req.getDeposit() : BigDecimal.ZERO;

		int divisor = 4 * req.getWeeklySchedule().size();
		BigDecimal averageBill = totalPrice.divide(BigDecimal.valueOf(divisor), 2, RoundingMode.HALF_UP);
		// System.out.println("req.getWeeklySchedule().size(): " + req.getWeeklySchedule().size());		
		// System.out.println("divisor: " + divisor);
		// System.out.println("averageBill: " + averageBill);
		
		List<String> reservationIds = new ArrayList<>();
		LocalDate firstWeek = req.getFirstWeekDate();

		List<Reservation> reservations = new ArrayList<>();
		List<ReservationDetail> details = new ArrayList<>();

		for (int week = 0; week < 4; week++) {
			for (WeeklySchedule ws : req.getWeeklySchedule()) {

				LocalDate bookingDate = firstWeek.plusWeeks(week)
						.with(TemporalAdjusters.nextOrSame(ws.getDayOfWeek()));

				String resId = GenerationId.generateId("rese");

				Reservation reservation = Reservation.builder()
						.id(resId)
						.branch(branch)
						.player(player)
						.voucher(voucher)
						.createAt(new Timestamp(System.currentTimeMillis()))
						.bookAt(Date.valueOf(bookingDate))
						.totalPrice(averageBill)
						.status("awaiting_payment")
						.deposit(deposit)
						.build();

				reservations.add(reservation);

				for (FixedBookingReservationDetailRequest fixedDetail : ws.getDetail()) {
					BadmintonCourt court = badmintonCourtRepository.findById(fixedDetail.getBadmintonCourtId())
							.orElseThrow(() -> new IllegalArgumentException("Court of branch not found"));

					ReservationDetail detail = ReservationDetail.builder()
							.id(new ReservationDetailId(court.getId(), resId))
							.badmintonCourt(court)
							.reservation(reservation)
							.startTime(fixedDetail.getStartTime())
							.rentalTime(fixedDetail.getRentalTime())
							.build();

					details.add(detail);
				}

				reservationIds.add(resId);
			}
		}

		reservationRepository.saveAll(reservations);
		reservationDetailRepository.saveAll(details);

		return reservationIds;
	}

	// API xác nhận khách đã chuyển khoản (gọi từ CheckoutPage)
	public List<ReservationResponseDTO> confirmFixedBookingPayment(List<String> reservationIds) {
		return changeStatus(reservationIds, "waiting");
	}

	// API hủy đặt cố định
	public void cancelFixedBooking(List<String> reservationIds) {
		changeStatus(reservationIds, "cancel");
	}

	// Phương thức chung đổi trạng thái
	public List<ReservationResponseDTO> changeStatus(List<String> reservationIds, String status) {
		List<Reservation> reservations = reservationRepository.findByIdIn(reservationIds);

		if (reservations.isEmpty()) {
			throw new IllegalArgumentException("Không tìm thấy đơn đặt sân nào!");
		}

		for (Reservation r : reservations) {
			r.setStatus(status);
		}

		reservationRepository.saveAll(reservations);
		return reservations.stream()
				.map(ReservationMapper::toDTO)
				.collect(Collectors.toList());
	}

	private boolean isVoucherActive(Voucher voucher) {
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
		return voucher.isAvailable()
				&& voucher.getStartDate() != null
				&& voucher.getEndDate() != null
				&& !today.isBefore(voucher.getStartDate())
				&& !today.isAfter(voucher.getEndDate());
	}
}
