package com.example.freelancer.dto;
import com.example.freelancer.domain.PaymentMethod;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;
public record CreatePaymentRequest(@NotNull UUID taskId, @NotNull @DecimalMin(value="1.0") BigDecimal amount, @NotNull PaymentMethod paymentMethod) {}
