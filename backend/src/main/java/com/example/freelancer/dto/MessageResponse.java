package com.example.freelancer.dto;
import java.time.Instant;
import java.util.UUID;
public record MessageResponse(
        UUID id,
        UUID taskId,
        UUID senderId,
        String senderName,
        UUID receiverId,
        String receiverName,
        String content,
        Instant createdAt
) {}
