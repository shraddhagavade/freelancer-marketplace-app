package com.freelancerhub.marketplace.controller;

import com.freelancerhub.marketplace.dto.PaymentDto;
import com.freelancerhub.marketplace.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // Payments where the current user paid (as client)
    @GetMapping("/client")
    public ResponseEntity<List<PaymentDto>> myClientPayments(Authentication auth) {
        return ResponseEntity.ok(paymentService.getClientPayments(auth.getName()));
    }

    // Payments where the current user is the payee (as freelancer)
    @GetMapping("/freelancer")
    public ResponseEntity<List<PaymentDto>> myFreelancerPayments(Authentication auth) {
        return ResponseEntity.ok(paymentService.getFreelancerPayments(auth.getName()));
    }

    // Totals for the dashboard
    @GetMapping("/summary")
    public ResponseEntity<Map<String, BigDecimal>> summary(Authentication auth) {
        return ResponseEntity.ok(paymentService.getSummary(auth.getName()));
    }

    // Escrow status for a single project (public read is fine for viewing status)
    @GetMapping("/project/{projectId}")
    public ResponseEntity<PaymentDto> projectPayment(@PathVariable Long projectId) {
        return ResponseEntity.ok(paymentService.getProjectPayment(projectId));
    }
}
