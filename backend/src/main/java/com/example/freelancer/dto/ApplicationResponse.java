package com.example.freelancer.dto;
import com.example.freelancer.domain.ApplicationStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
public record ApplicationResponse(
        UUID id,
        UUID taskId,
        UUID freelancerId,
        String freelancerName,
        String proposal,
        BigDecimal bidAmount,
        ApplicationStatus status,
        Instant createdAt
) {}
