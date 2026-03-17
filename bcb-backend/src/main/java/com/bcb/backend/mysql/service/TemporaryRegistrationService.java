package com.bcb.backend.mysql.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.bcb.backend.mysql.dto.response.TemporaryRecruitmentCompactResponse;
import com.bcb.backend.mysql.mapper.TemporaryRecruitmentMapper;
import com.bcb.backend.mysql.model.Player;
import com.bcb.backend.mysql.model.TemporaryRecruitment;
import com.bcb.backend.mysql.model.TemporaryRegistration;
import com.bcb.backend.mysql.model.TemporaryRegistrationId;
import com.bcb.backend.mysql.repository.TemporaryRecruitmentRepository;
import com.bcb.backend.mysql.repository.TemporaryRegistrationRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class TemporaryRegistrationService {

    private final TemporaryRegistrationRepository temporaryRegistrationRepository;
    private final TemporaryRecruitmentRepository temporaryRecruitmentRepository;
    private final PlayerAccountService playerAccountService;

    public TemporaryRecruitmentCompactResponse create(String accountId, String temporaryRecruitmentId) {
        TemporaryRecruitment recruitment = temporaryRecruitmentRepository.findById(temporaryRecruitmentId)
                .orElseThrow(() -> new IllegalArgumentException("TemporaryRecruitment not found"));

        Player player = playerAccountService.getPlayerForUserAccount(accountId);

        if (recruitment.getReservation().getPlayer().getId().equals(player.getId())) {
            throw new IllegalArgumentException("Unable to register");
        }

        TemporaryRegistration savedEntity = TemporaryRegistration.builder()
                .id(new TemporaryRegistrationId(recruitment.getId(), player.getId()))
                .temporaryRecruitment(recruitment)
                .player(player)
                .build();
        temporaryRegistrationRepository.save(savedEntity);

        return TemporaryRecruitmentMapper.toDTO(savedEntity.getTemporaryRecruitment());
    }

    public List<TemporaryRecruitmentCompactResponse> getAllTemporaryRecruitmentSavedOfPlayer(String accountId) {
        String playerId = playerAccountService.getPlayerForUserAccount(accountId).getId();

        return temporaryRegistrationRepository
                .findByPlayerId(playerId).stream()
                .map((item) -> TemporaryRecruitmentMapper.toDTO(item.getTemporaryRecruitment()))
                .toList();
    }

    public void delete(String accountId, String temporaryRecruitmentId) {

        String playerId = playerAccountService.getPlayerForUserAccount(accountId).getId();

        TemporaryRegistration saved = temporaryRegistrationRepository
                .findByIdTemporaryRecruitmentIdAndIdPlayerId(temporaryRecruitmentId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Temporary recruitmentm not found"));

        temporaryRegistrationRepository.delete(saved);
    }
}
