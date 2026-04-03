package com.example.freelancer.controller;

import com.example.freelancer.dto.CreatePaymentRequest;
import com.example.freelancer.dto.PaymentResponse;
import com.example.freelancer.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public PaymentResponse create(@Valid @RequestBody CreatePaymentRequest req, Authentication authentication) {
        return paymentService.create(req, authentication.getName());
    }
}
