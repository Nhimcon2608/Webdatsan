package com.bcb.backend.mysql.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.bcb.backend.mysql.dto.request.AccountRequest;
import com.bcb.backend.mysql.dto.request.ChangePasswordRequest;
import com.bcb.backend.mysql.dto.request.ChangeRoleRequets;
import com.bcb.backend.mysql.service.AccountService;

@RestController
@RequestMapping("/accounts")
public class AccountController {

	private final AccountService accountService;

	public AccountController(AccountService accountService) {
		this.accountService = accountService;
	}

	@PreAuthorize("hasAuthority('ADMIN')")
	@GetMapping
	public ResponseEntity<?> getAllAccounts() {
		return ResponseEntity.ok(accountService.getAllAccounts());
	}

	@PreAuthorize("isAuthenticated()")
	@GetMapping("/me")
	public ResponseEntity<?> getAccountByUsername() {

		Map<String, String> accountContext = extractAuthenticatedAccount();

		if (accountContext != null) {
			String username = accountContext.get("username");

			return ResponseEntity.ok(accountService.getAccountByUserName(username));
		}
		return ResponseEntity.badRequest().body("Invalid authorization.");
	}

	@PreAuthorize("isAuthenticated()")
	@PutMapping("/upload-image")
	public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file)
			throws IOException {

		Map<String, String> accountContext = extractAuthenticatedAccount();

		if (accountContext != null) {
			return ResponseEntity.ok(accountService.uploadImage(accountContext.get("id"), file));
		}
		return ResponseEntity.badRequest().body("Invalid authorization.");
	}

	@PreAuthorize("isAuthenticated()")
	@PatchMapping("/change-password")
	public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest changePasswordRequest) {

		Map<String, String> accountContext = extractAuthenticatedAccount();

		if (accountContext != null) {

			String id = accountContext.get("id");

			try {
				accountService.changePassword(id, changePasswordRequest);
			} catch (Exception e) {
				throw e;
			}

			return ResponseEntity.ok("Password changed successfully.");
		}

		return ResponseEntity.badRequest().body("Invalid authorization.");
	}

	// @PreAuthorize("hasRole('ADMIN')")
	@PostMapping("/manager/register")
	public ResponseEntity<?> createManagerAccount(@RequestBody AccountRequest request) {
		return ResponseEntity.ok(accountService.registerManagerAccount(request));
	}

	// only admin
	@PreAuthorize("hasAuthority('ADMIN')")
	@PatchMapping("/change-role")
	public ResponseEntity<?> changeRole(@RequestBody ChangeRoleRequets requets) {
		return ResponseEntity.ok(accountService.changeRole(requets.getId(), requets.getRole()));
	}

	private Map<String, String> extractAuthenticatedAccount() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		if (authentication == null || !authentication.isAuthenticated()) {
			return null;
		}

		String username = authentication.getName();
		if (username == null || "anonymousUser".equals(username)) {
			return null;
		}

		Map<String, String> accountContext = new HashMap<>();
		accountContext.put("id", accountService.getIdByUsername(username));
		accountContext.put("username", username);
		return accountContext;
	}

}
