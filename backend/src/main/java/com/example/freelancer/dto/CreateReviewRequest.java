package com.example.freelancer.dto;
import jakarta.validation.constraints.*;
import java.util.UUID;
public record CreateReviewRequest(@NotNull UUID taskId, @NotNull UUID revieweeId, @Min(1) @Max(5) Integer rating, @NotBlank String comment) {}
