package com.freelancerhub.marketplace.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FreelancerProfileDto {
    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String avatarUrl;

    @Size(max = 200)
    private String title;

    @Size(max = 2000)
    private String overview;

    private BigDecimal hourlyRate;
    private String experienceLevel;
    private String availability;
    private Integer yearsOfExperience;
    private String portfolioUrl;
    private String linkedinUrl;
    private String githubUrl;
    private Set<String> skills;
    private Double averageRating;
    private Integer totalProjects;
    private Integer completedProjects;
}
