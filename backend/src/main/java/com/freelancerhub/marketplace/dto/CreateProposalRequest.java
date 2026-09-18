package com.freelancerhub.marketplace.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateProposalRequest {

    @NotBlank(message = "Cover letter is required")
    @Size(max = 3000)
    private String coverLetter;

    @NotNull(message = "Proposed price is required")
    @DecimalMin(value = "1.0", message = "Price must be at least $1")
    private BigDecimal proposedPrice;

    @NotNull(message = "Estimated days is required")
    @Min(value = 1, message = "Minimum 1 day")
    private Integer estimatedDays;
}
