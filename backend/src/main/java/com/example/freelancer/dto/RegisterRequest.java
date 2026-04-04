package com.example.freelancer.dto;
import com.example.freelancer.domain.UserRole;
import jakarta.validation.constraints.*;
public record RegisterRequest(
        @NotBlank(message = "Full name cannot be blank.")
        @Size(min = 3, message = "Full name must be at least 3 characters.")
        String fullName,
        @NotBlank(message = "Email cannot be blank.")
        @Email(message = "Enter a valid email address.")
        String email,
        @NotBlank(message = "Password cannot be blank.")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$",
                message = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
        )
        String password,
        @NotNull(message = "Please choose a role.")
        UserRole role
) {}
