package com.freelancerhub.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectDto {
    private Long id;
    private String title;
    private String description;
    private BigDecimal budget;
    private LocalDate deadline;
    private String status;
    private String experienceLevel;
    private String categoryName;
    private Long categoryId;
    private Set<String> skills;
    private Integer proposalCount;

    // Client info
    private Long clientId;
    private String clientName;
    private String clientAvatarUrl;

    private LocalDateTime createdAt;
}
