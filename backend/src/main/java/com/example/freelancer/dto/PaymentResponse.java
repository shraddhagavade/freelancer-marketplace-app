package com.example.freelancer.dto;
import com.example.freelancer.domain.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
public record PaymentResponse(UUID id, UUID taskId, UUID payerId, UUID payeeId, BigDecimal amount, PaymentStatus status, Instant createdAt) {}
