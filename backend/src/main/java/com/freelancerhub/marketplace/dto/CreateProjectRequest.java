package com.freelancerhub.marketplace.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

@Data
public class CreateProjectRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 5000)
    private String description;

    @NotNull(message = "Budget is required")
    @DecimalMin(value = "5.0", message = "Budget must be at least $5")
    private BigDecimal budget;

    private LocalDate deadline;

    private String experienceLevel; // ENTRY, INTERMEDIATE, EXPERT

    private Long categoryId;

    private Set<String> skills;
}
