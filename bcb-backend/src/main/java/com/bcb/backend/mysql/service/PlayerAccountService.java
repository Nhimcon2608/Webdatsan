package com.bcb.backend.mysql.service;

import org.springframework.stereotype.Service;

import com.bcb.backend.mysql.model.Account;
import com.bcb.backend.mysql.model.Player;
import com.bcb.backend.mysql.repository.AccountRepository;
import com.bcb.backend.mysql.repository.PlayerRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlayerAccountService {

    private final AccountRepository accountRepository;
    private final PlayerRepository playerRepository;

    public Player getPlayerForUserAccount(String accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + accountId));

        if (!account.isActivated()) {
            throw new IllegalStateException("Account is not activated.");
        }

        if (!"USER".equalsIgnoreCase(account.getRole())) {
            throw new IllegalStateException("Player profile is only available for USER accounts.");
        }

        Player player = playerRepository.findByAccountId(accountId)
                .orElseGet(() -> createMissingPlayer(account));

        return syncEmailFromUsernameIfNeeded(player, account);
    }

    private Player createMissingPlayer(Account account) {
        Player player = Player.builder()
                .id(GenerationId.generateId("play"))
                .email(extractEmailFromUsername(account.getUsername()))
                .account(account)
                .build();

        Player savedPlayer = playerRepository.save(player);
        account.setPlayer(savedPlayer);
        return savedPlayer;
    }

    private Player syncEmailFromUsernameIfNeeded(Player player, Account account) {
        if (player.getEmail() != null && !player.getEmail().isBlank()) {
            return player;
        }

        String derivedEmail = extractEmailFromUsername(account.getUsername());
        if (derivedEmail == null) {
            return player;
        }

        player.setEmail(derivedEmail);
        return playerRepository.save(player);
    }

    private String extractEmailFromUsername(String username) {
        if (username == null) {
            return null;
        }

        String normalizedUsername = username.trim();
        if (normalizedUsername.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            return normalizedUsername;
        }

        return null;
    }
}
