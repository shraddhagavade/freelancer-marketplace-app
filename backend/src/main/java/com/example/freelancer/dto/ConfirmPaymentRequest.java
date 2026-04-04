package com.example.freelancer.dto;

import jakarta.validation.constraints.AssertTrue;

public record ConfirmPaymentRequest(
        @AssertTrue(message = "You must confirm the release to complete payment")
        Boolean confirmRelease
) {
}
