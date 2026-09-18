package com.freelancerhub.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProposalDto {
    private Long id;
    private Long projectId;
    private String projectTitle;

    // Freelancer info
    private Long freelancerId;
    private String freelancerName;
    private String freelancerTitle;
    private String freelancerAvatarUrl;
    private Double freelancerRating;

    private String coverLetter;
    private BigDecimal proposedPrice;
    private Integer estimatedDays;
    private String status;
    private LocalDateTime createdAt;
}
