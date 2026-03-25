package com.bcb.backend.mysql.controller;

import com.bcb.backend.mysql.dto.request.ReservationRequestDTO;
import com.bcb.backend.mysql.dto.request.UpdateStatusDTO;
import com.bcb.backend.mysql.dto.response.ReservationResponseDTO;
import com.bcb.backend.mysql.service.ReservationService;
import com.bcb.backend.util.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/reservations")
public class ReservationController {

	@Autowired
	private ReservationService reservationService;

	@Autowired
	private JwtUtil jwtUtil;

	@GetMapping
	public List<ReservationResponseDTO> getAllReservations() {
		return reservationService.getAllReservations();
	}

	@PreAuthorize("isAuthenticated()")
	@GetMapping("user/{status}")
	public ResponseEntity<?> getReservationOfUser(HttpServletRequest httpRequest, @PathVariable String status) {
		String authHeader = httpRequest.getHeader("Authorization");

		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			String token = authHeader.substring(7);

			String accountId = jwtUtil.extractAccountId(token);
			return ResponseEntity.ok(reservationService.getAllReservationsOfUser(accountId, status));

		}
		return ResponseEntity.badRequest().body("Invalid authorization.");
	}

	@GetMapping("branch/{branchId}/{date}")
	public ResponseEntity<?> getUncanceledReservationOfBranchByDate(@PathVariable String branchId,
			@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date date) {
		return ResponseEntity.ok(reservationService.getUncanceledReservationOfBranchByDate(branchId, date));
	}

	@GetMapping("/branch/{branchId}/between")
	public ResponseEntity<?> getUncanceledReservationOfBranchBetween(
			@PathVariable String branchId,
			@RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date from,
			@RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date to
	) {
		return ResponseEntity.ok(
				reservationService.getUncanceledReservationOfBranchBetween(branchId, from, to)
		);
	}

	@GetMapping("/{id}")
	public ReservationResponseDTO getReservationById(@PathVariable String id) {
		return reservationService.getReservationById(id);
	}

	@PostMapping
	@PreAuthorize("isAuthenticated()")
	public ReservationResponseDTO createReservation(@RequestBody ReservationRequestDTO dto) {
		// reservationService.scheduleCancellation(r.getId());
		return reservationService.createReservation(dto);
	}

	@PatchMapping("/schedule-cancel/{reservationId}")
	public ResponseEntity<?> scheduleCancellation(@PathVariable String reservationId) {
		reservationService.scheduleCancellation(reservationId);
		return ResponseEntity.ok("Cancellation scheduled successfully.");
	}

	@PatchMapping("/schedule-cancel")
	public ResponseEntity<?> scheduleCancellation(@RequestBody List<String> reservationIds) {
		reservationService.scheduleCancellation(reservationIds);
		return ResponseEntity.ok("Cancellation scheduled successfully.");
	}

	@PutMapping("/{id}")
	@PreAuthorize("isAuthenticated()")
	public ReservationResponseDTO updateReservation(@PathVariable String id, @RequestBody ReservationRequestDTO dto) {
		return reservationService.updateReservation(id, dto);
	}

	@PutMapping("/cancel/{id}")
	public ReservationResponseDTO cancelReservation(@PathVariable String id) {
		return reservationService.cancelReservation(id);
	}

	@GetMapping("/recent")
	public List<ReservationResponseDTO> getRecentReservations(
			@RequestParam String branchId,
			@RequestParam(required = false) String status) {
		return reservationService.getRecentReservations(branchId, status);
	}

	@GetMapping("/branch/{branchId}")
	public List<ReservationResponseDTO> getReservationsByBranch(
			@PathVariable String branchId,
			@RequestParam(required = false) String status) {
		return reservationService.getReservationsByBranch(branchId, status);
	}

	@PutMapping("/{id}/status")
	public ReservationResponseDTO updateReservationStatus(
			@PathVariable String id,
			@RequestBody UpdateStatusDTO statusDTO) {
		return reservationService.updateStatus(id, statusDTO.getStatus());
	}

	@GetMapping("/branch/{branchId}/all")
	public List<ReservationResponseDTO> getReservationsByBranchAll(
			@PathVariable String branchId,
			@RequestParam(required = false) String status) {
		return reservationService.getReservationsByBranchAll(branchId, status);
	}

	@GetMapping("/latest")
	public List<ReservationResponseDTO> getLatestReservations(
			@RequestParam(required = false) String branchId) {
		return reservationService.getAllReservationsByBookAtDesc(branchId);
	}

	@GetMapping("/notification/{reservationId}")
	public ResponseEntity<?> sendToManager(@PathVariable String reservationId) {
		return ResponseEntity.ok(reservationService.sendToManager(reservationId));
	}

	@PutMapping("/{id}/confirm-payment")
	@PreAuthorize("hasRole('MANAGER')")
	public ResponseEntity<ReservationResponseDTO> confirmPayment(@PathVariable String id) {
		return ResponseEntity.ok(reservationService.confirmPayment(id));
	}

	@PutMapping("/{id}/reject-payment")
	@PreAuthorize("hasRole('MANAGER')")
	public ResponseEntity<ReservationResponseDTO> rejectPayment(@PathVariable String id) {
		return ResponseEntity.ok(reservationService.rejectPayment(id));
	}

}
