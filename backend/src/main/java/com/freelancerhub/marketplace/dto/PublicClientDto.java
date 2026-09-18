package com.freelancerhub.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PublicClientDto {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String avatarUrl;
    private String companyName;
    private String industry;
    private String companyWebsite;
    private String description;
    private String location;
    private Integer totalProjectsPosted;
    private Double averageRating;
    private LocalDateTime memberSince;

    // Projects posted by this client
    private List<ProjectDto> projects;
}
