package com.example.freelancer.dto;
import com.example.freelancer.domain.UserRole;
import jakarta.validation.constraints.*;
public record RegisterRequest(@NotBlank String fullName,@Email @NotBlank String email,@Size(min = 8) String password,@NotNull UserRole role) {}
