package com.bcb.backend.mysql.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bcb.backend.mysql.dto.request.ReviewRequeset;
import com.bcb.backend.mysql.dto.response.ReviewResponse;
import com.bcb.backend.mysql.mapper.ReviewMapper;
import com.bcb.backend.mysql.model.Account;
import com.bcb.backend.mysql.model.Review;
import com.bcb.backend.mysql.repository.AccountRepository;
import com.bcb.backend.mysql.repository.BranchRepository;
import com.bcb.backend.mysql.repository.PlayerRepository;
import com.bcb.backend.mysql.repository.ReviewRepository;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepo;
    private final AccountRepository accountRepo;
    private final PlayerRepository playerRepo;
    private final BranchRepository branchRepo;

    public ReviewService(ReviewRepository reviewRepo, AccountRepository accountRepo, PlayerRepository playerRepo,
            BranchRepository branchRepo) {
        this.reviewRepo = reviewRepo;
        this.accountRepo = accountRepo;
        this.playerRepo = playerRepo;
        this.branchRepo = branchRepo;
    }

    public List<ReviewResponse> getAllReviewsOfBranch(String branchId) {

        List<Review> reviews = reviewRepo.findAll().stream()
                .filter(r -> r.getBranch().getId().equals(branchId))
                .collect(Collectors.toList());

        return reviews.stream().map(r -> {
            ReviewResponse response = ReviewMapper.toDTO(r);

            Account account = accountRepo.findById(r.getPlayer().getAccount().getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Account not found for ID: " + r.getPlayer().getAccount().getId()));
            response.setAccountId(account.getId());
            response.setUsername(account.getUsername());
            response.setImagePath(account.getImagePath());

            return response;
        }).collect(Collectors.toList());

    }

    public List<ReviewResponse> getAllReviewsofUser(String accountId) {

        List<Review> reviews = reviewRepo.findAll().stream()
                .filter(r -> r.getPlayer().getAccount().getId().equals(accountId))
                .collect(Collectors.toList());

        return reviews.stream().map(r -> {

            ReviewResponse response = ReviewMapper.toDTO(r);

            Account account = accountRepo.findById(accountId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Account not found for ID: " + accountId));

            response.setAccountId(account.getId());
            response.setUsername(account.getUsername());
            response.setImagePath(account.getImagePath());
            return response;

        }).collect(Collectors.toList());

    }

    public ReviewResponse createReview(ReviewRequeset request) {

        String id = GenerationId.generateId("revi");

        Review review = Review.builder()
                .id(id)
                .raringLevel(request.getRatingLevel())
                .content(request.getContent() == null ? "" : request.getContent())
                .player(playerRepo.findById(request.getPlayerId()).orElseThrow(
                        () -> new IllegalArgumentException("Player not found with id " + request.getPlayerId())))
                .branch(branchRepo.findById(request.getBranchId()).orElseThrow(
                        () -> new IllegalArgumentException("Branch not found with id " + request.getBranchId())))
                .build();

        review = reviewRepo.save(review);

        return ReviewResponse.builder()
                .id(id)
                .createAt(review.getCreateAt())
                .ratingLevel(review.getRaringLevel())
                .content(review.getContent())
                .build();
    }

    public ReviewResponse updateReview(String id, ReviewRequeset request) {

        Review review = reviewRepo.findById(id).orElse(null);

        if (review == null) {
            return null;
        }

        if (request.getContent() != null && !request.getContent().isEmpty()) {
            review.setContent(request.getContent());
        } else if (review.getContent() == null) {
            review.setContent("");
        }

        review.setRaringLevel(request.getRatingLevel());

        review = reviewRepo.save(review);

        return ReviewResponse.builder()
                .id(id)
                .createAt(review.getCreateAt())
                .ratingLevel(review.getRaringLevel())
                .content(review.getContent())
                .build();
    }

}
