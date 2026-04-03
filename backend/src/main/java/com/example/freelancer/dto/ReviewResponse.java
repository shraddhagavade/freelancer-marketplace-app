package com.example.freelancer.dto;
import java.time.Instant;
import java.util.UUID;
public record ReviewResponse(UUID id, UUID taskId, UUID reviewerId, UUID revieweeId, Integer rating, String comment, Instant createdAt) {}
