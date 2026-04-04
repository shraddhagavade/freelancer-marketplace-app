package com.example.freelancer.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateMilestoneStatusRequest(
        @NotNull(message = "Completed state is required.")
        Boolean completed
) {}
