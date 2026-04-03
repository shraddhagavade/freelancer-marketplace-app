package com.example.freelancer.dto;
import jakarta.validation.constraints.*;
import java.util.UUID;
public record SendMessageRequest(@NotNull UUID taskId, @NotNull UUID receiverId, @NotBlank String content) {}
