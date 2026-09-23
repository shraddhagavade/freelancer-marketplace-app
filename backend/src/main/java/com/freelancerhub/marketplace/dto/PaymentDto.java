package com.freelancerhub.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentDto {
    private Long id;
    private Long projectId;
    private String projectTitle;

    private Long clientId;
    private String clientName;

    private Long freelancerId;
    private String freelancerName;

    private BigDecimal amount;
    private String status;          // HELD, RELEASED, REFUNDED
    private LocalDateTime createdAt;
    private LocalDateTime releasedAt;
}
