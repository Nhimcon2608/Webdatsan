package com.bcb.backend.mysql.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bcb.backend.mysql.dto.request.PlayerRequest;
import com.bcb.backend.mysql.dto.response.PlayerResponse;
import com.bcb.backend.mysql.mapper.PlayerMapper;
import com.bcb.backend.mysql.model.Player;
import com.bcb.backend.mysql.repository.PlayerRepository;

@Service
public class PlayerService {

    private final PlayerRepository playerRepo;
    private final PlayerAccountService playerAccountService;

    public PlayerService(PlayerRepository playerRepo, PlayerAccountService playerAccountService) {
        this.playerRepo = playerRepo;
        this.playerAccountService = playerAccountService;
    }

    public List<PlayerResponse> getAllPlayer() {
        return playerRepo.findAll().stream().map(PlayerMapper::toDTO).collect(Collectors.toList());
    }

    public PlayerResponse getPlayerByAccountId(String accountId) {
        return PlayerMapper.toDTO(playerAccountService.getPlayerForUserAccount(accountId));
    }

    public String getPlayerIdByAccountId(String accountId) {
        return playerAccountService.getPlayerForUserAccount(accountId).getId();
    }

    public PlayerResponse updatePlayerInfor(String id, PlayerRequest playerRequest) {

        Player player = playerRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Player not found with id: " + id));

        player.setFullName(playerRequest.getFullName());
        player.setDob(playerRequest.getDob());
        player.setGender(playerRequest.getGender());
        player.setEmail(playerRequest.getEmail());

        return PlayerMapper.toDTO(playerRepo.save(player));
    }

}
