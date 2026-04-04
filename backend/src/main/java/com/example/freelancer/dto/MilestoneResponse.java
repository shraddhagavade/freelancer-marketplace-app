package com.example.freelancer.dto;

import com.example.freelancer.domain.MilestoneStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MilestoneResponse(
        UUID id,
        String title,
        LocalDate dueDate,
        MilestoneStatus status,
        Integer sortOrder,
        Instant completedAt
) {}
