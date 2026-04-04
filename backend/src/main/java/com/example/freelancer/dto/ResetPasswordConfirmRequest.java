package com.example.freelancer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPasswordConfirmRequest(
        @NotBlank(message = "Reset token cannot be blank.")
        String token,
        @NotBlank(message = "Password cannot be blank.")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$",
                message = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
        )
        String newPassword
) {}
