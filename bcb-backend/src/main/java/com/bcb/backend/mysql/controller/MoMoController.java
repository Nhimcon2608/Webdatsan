package com.bcb.backend.mysql.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.bcb.backend.mysql.dto.request.PaymentRequest;
import com.bcb.backend.mysql.model.PaymentSession;
import com.bcb.backend.mysql.service.FixedBookingService;
import com.bcb.backend.mysql.service.MomoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/payment/momo")
@RequiredArgsConstructor
public class MoMoController {

    private final MomoService momoService;
    private final FixedBookingService fixedBookingService;

    @PostMapping("/create")
    public ResponseEntity<?> createPayment(@RequestBody PaymentRequest paymentRequest) {
        return ResponseEntity.ok(momoService.createPayment(paymentRequest));
    }

    @PostMapping("/demo/confirm")
    public ResponseEntity<Void> confirmDemoPayment(@RequestBody Map<String, Object> payload) {
        String orderId = payload.get("orderId") == null ? null : payload.get("orderId").toString();
        int resultCode = payload.get("resultCode") == null ? -1 : Integer.parseInt(payload.get("resultCode").toString());

        if (orderId == null || orderId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order ID is required");
        }

        PaymentSession session = momoService.getPaymentSession(orderId);
        if (!momoService.isValidPaymentCallback(orderId, session)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment session not found");
        }

        if ("SUCCESS".equals(session.getStatus()) || "FAILED".equals(session.getStatus())) {
            return ResponseEntity.noContent().build();
        }

        if (resultCode == 0) {
            fixedBookingService.changeStatus(session.getReservationIds(), "waiting");
            session.setStatus("SUCCESS");
        } else {
            fixedBookingService.changeStatus(session.getReservationIds(), "cancel");
            session.setStatus("FAILED");
        }

        momoService.savePaymentSession(orderId, session);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resIds-of/{orderId}")
    public ResponseEntity<List<String>> getResIdsByOrderId(@PathVariable String orderId) {
        PaymentSession session = momoService.getPaymentSession(orderId);

        if (session == null) {
            return ResponseEntity.ok(null);
        }

        return ResponseEntity.ok(session.getReservationIds());
    }
}
