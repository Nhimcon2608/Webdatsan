package com.bcb.backend.mysql.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.bcb.backend.mysql.dto.response.TemporaryRecruitmentCompactResponse;
import com.bcb.backend.mysql.mapper.TemporaryRecruitmentMapper;
import com.bcb.backend.mysql.model.Player;
import com.bcb.backend.mysql.model.TemporaryRecruitment;
import com.bcb.backend.mysql.model.TemporaryRecruitmentSaved;
import com.bcb.backend.mysql.model.TemporaryRecruitmentSavedId;
import com.bcb.backend.mysql.repository.TemporaryRecruitmentRepository;
import com.bcb.backend.mysql.repository.TemporaryRecruitmentSavedRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class TemporaryRecruitmentSavedService {

    private final TemporaryRecruitmentSavedRepository temporaryRecruitmentSavedRepository;
    private final TemporaryRecruitmentRepository temporaryRecruitmentRepository;
    private final PlayerAccountService playerAccountService;

    public TemporaryRecruitmentCompactResponse create(String accountId, String temporaryRecruitmentId) {
        TemporaryRecruitment recruitment = temporaryRecruitmentRepository.findById(temporaryRecruitmentId)
                .orElseThrow(() -> new RuntimeException("TemporaryRecruitment not found"));

        Player player = playerAccountService.getPlayerForUserAccount(accountId);

        TemporaryRecruitmentSaved savedEntity = TemporaryRecruitmentSaved.builder()
                .id(new TemporaryRecruitmentSavedId(recruitment.getId(), player.getId()))
                .temporaryRecruitment(recruitment)
                .player(player)
                .build();
        temporaryRecruitmentSavedRepository.save(savedEntity);

        return TemporaryRecruitmentMapper.toDTO(savedEntity.getTemporaryRecruitment());
    }

    public List<TemporaryRecruitmentCompactResponse> getAllTemporaryRecruitmentSavedOfPlayer(String accountId) {
        String playerId = playerAccountService.getPlayerForUserAccount(accountId).getId();

        return temporaryRecruitmentSavedRepository
                .findByPlayerId(playerId).stream()
                .map((item) -> TemporaryRecruitmentMapper.toDTO(item.getTemporaryRecruitment()))
                .toList();
    }

    public void delete(String accountId, String temporaryRecruitmentId) {

        String playerId = playerAccountService.getPlayerForUserAccount(accountId).getId();

        TemporaryRecruitmentSaved saved = temporaryRecruitmentSavedRepository
                .findByIdTemporaryRecruitmentIdAndIdPlayerId(temporaryRecruitmentId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Temporary recruitmentm not found"));

        temporaryRecruitmentSavedRepository.delete(saved);
    }
}
