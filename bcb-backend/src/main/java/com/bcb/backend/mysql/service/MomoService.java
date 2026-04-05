package com.bcb.backend.mysql.service;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.bcb.backend.mysql.dto.request.PaymentRequest;
import com.bcb.backend.mysql.model.PaymentSession;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MomoService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${MOMO_REDIRECT_URL}")
    private String redirectUrl;

    public Map<String, Object> createPayment(PaymentRequest req) {
        List<String> reservationIds = req.getResIds();

        if (reservationIds == null || reservationIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reservation IDs are required");
        }

        if (isBlank(req.getAmount())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount is required");
        }

        if (isBlank(req.getOrderInfo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order info is required");
        }

        String paymentSessionId = "PAY_" + UUID.randomUUID();

        PaymentSession session = new PaymentSession(
                paymentSessionId,
                reservationIds,
                req.getAmount(),
                "PENDING",
                System.currentTimeMillis());

        redisTemplate.opsForValue().set(
                "payment:" + paymentSessionId,
                session,
                15,
                TimeUnit.MINUTES);

        Map<String, Object> result = new HashMap<>();
        result.put("orderId", paymentSessionId);
        result.put("resultCode", 0);
        result.put("message", "Demo payment initialized");
        result.put("payUrl", buildDemoPayUrl(paymentSessionId));
        return result;
    }

    public PaymentSession getPaymentSession(String orderId) {
        return (PaymentSession) redisTemplate.opsForValue().get("payment:" + orderId);
    }

    public void savePaymentSession(String orderId, PaymentSession session) {
        Long ttlSeconds = redisTemplate.getExpire("payment:" + orderId, TimeUnit.SECONDS);
        if (ttlSeconds != null && ttlSeconds > 0) {
            redisTemplate.opsForValue().set("payment:" + orderId, session, ttlSeconds, TimeUnit.SECONDS);
        } else {
            redisTemplate.opsForValue().set("payment:" + orderId, session);
        }
    }

    public boolean isValidPaymentCallback(String orderId, PaymentSession session) {
        return session != null && session.getPaymentSessionId().equals(orderId);
    }

    private String buildDemoPayUrl(String orderId) {
        try {
            URI redirectUri = URI.create(redirectUrl);
            String origin = redirectUri.getScheme() + "://" + redirectUri.getAuthority();
            return origin + "/demo-payment?orderId=" + orderId;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid MOMO_REDIRECT_URL", ex);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
