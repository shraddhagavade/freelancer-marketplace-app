package com.example.freelancer.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;
public record CreatePaymentRequest(@NotNull UUID taskId, @NotNull UUID payeeId, @DecimalMin(value="1.0") BigDecimal amount) {}
