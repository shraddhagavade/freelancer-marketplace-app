package com.example.freelancer.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record CreateTaskRequest(@NotBlank String title,@NotBlank String description,@DecimalMin(value = "1.0", inclusive = true) BigDecimal budget) {}
