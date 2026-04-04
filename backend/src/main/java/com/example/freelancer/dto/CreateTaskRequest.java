package com.example.freelancer.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.List;

public record CreateTaskRequest(
        @NotBlank String title,
        @NotBlank String description,
        @DecimalMin(value = "1.0", inclusive = true) BigDecimal budget,
        List<@Valid MilestoneRequest> milestones
) {}
