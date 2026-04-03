package com.example.freelancer.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record ApplyTaskRequest(@NotBlank String proposal, @DecimalMin(value="1.0") BigDecimal bidAmount) {}
