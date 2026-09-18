package com.freelancerhub.marketplace.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ClientProfileDto {
    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String avatarUrl;

    @Size(max = 200)
    private String companyName;

    @Size(max = 100)
    private String industry;

    @Size(max = 500)
    private String companyWebsite;

    @Size(max = 2000)
    private String description;

    @Size(max = 200)
    private String location;

    private Integer totalProjectsPosted;
    private BigDecimal totalSpent;
    private Double averageRating;
}
