package com.example.freelancer.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record MilestoneRequest(
        @NotBlank(message = "Milestone title cannot be blank.")
        String title,
        LocalDate dueDate
) {}
