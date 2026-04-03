package com.example.freelancer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordConfirmRequest(
        @NotBlank String token,
        @Size(min = 8) String newPassword
) {}
