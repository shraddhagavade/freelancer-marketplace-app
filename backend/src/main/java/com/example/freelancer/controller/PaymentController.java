package com.example.freelancer.controller;

import com.example.freelancer.dto.CreatePaymentRequest;
import com.example.freelancer.dto.ConfirmPaymentRequest;
import com.example.freelancer.dto.PaymentResponse;
import com.example.freelancer.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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

    @PatchMapping("/{paymentId}/confirm")
    @PreAuthorize("hasRole('CLIENT')")
    public PaymentResponse confirm(@PathVariable java.util.UUID paymentId, @Valid @RequestBody ConfirmPaymentRequest req, Authentication authentication) {
        return paymentService.confirm(paymentId, req, authentication.getName());
    }

    @GetMapping
    public List<PaymentResponse> list(Authentication authentication) {
        return paymentService.listForUser(authentication.getName());
    }
}
