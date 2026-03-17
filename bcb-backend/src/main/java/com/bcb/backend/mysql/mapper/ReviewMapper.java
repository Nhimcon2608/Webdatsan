package com.bcb.backend.mysql.mapper;

import com.bcb.backend.mysql.dto.response.ReviewResponse;
import com.bcb.backend.mysql.model.Review;

public class ReviewMapper {
    
    public static ReviewResponse toDTO(Review entity) {
        
        return ReviewResponse.builder()
                .id(entity.getId())
                .createAt(entity.getCreateAt())
                .ratingLevel(entity.getRaringLevel())
                .content(entity.getContent() == null ? "" : entity.getContent())
                .branchId(entity.getBranch().getId())
                .build();

    }
}
