package com.freelancerhub.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewDto {
    private Long id;
    private Long projectId;
    private String projectTitle;

    private Long reviewerId;
    private String reviewerName;
    private String reviewerAvatarUrl;

    private Long freelancerId;

    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
