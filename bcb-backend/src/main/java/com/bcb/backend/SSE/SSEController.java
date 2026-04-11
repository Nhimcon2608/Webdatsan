package com.bcb.backend.SSE;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.bcb.backend.mysql.service.AccountService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/sse")
@RequiredArgsConstructor
public class SSEController {

    private final SSEService sseService;
    private final AccountService accountService;

    @GetMapping("/subscribe/{userId}")
    public SseEmitter subscribe(@PathVariable String userId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn cần đăng nhập để nhận thông báo");
        }

        String accountId = accountService.getIdByUsername(authentication.getName());
        if (!accountId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không thể đăng ký thông báo cho tài khoản khác");
        }

        return sseService.subscribe(userId);
    }
}

