package com.freelancerhub.marketplace.controller;

import com.freelancerhub.marketplace.dto.PaymentDto;
import com.freelancerhub.marketplace.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${paypal.frontend-return-base:http://localhost:5173}")
    private String frontendReturnBase;

    // Is real PayPal enabled? The frontend uses this to decide the "Pay" UX.
    @GetMapping("/paypal/enabled")
    public ResponseEntity<Map<String, Boolean>> paypalEnabled() {
        return ResponseEntity.ok(Map.of("enabled", paymentService.isPayPalEnabled()));
    }

    // CLIENT: start PayPal checkout for a project's accepted proposal.
    // Returns the approval URL to redirect the client to.
    @PostMapping("/paypal/create/{projectId}")
    public ResponseEntity<Map<String, String>> createPayPalOrder(
            @PathVariable Long projectId, Authentication auth) {
        String approvalUrl = paymentService.initiatePayPalPayment(projectId, auth.getName(), frontendReturnBase);
        return ResponseEntity.ok(Map.of("approvalUrl", approvalUrl));
    }

    // CLIENT: capture the payment after returning from PayPal approval.
    @PostMapping("/paypal/capture/{projectId}")
    public ResponseEntity<PaymentDto> capturePayPalOrder(
            @PathVariable Long projectId, Authentication auth) {
        return ResponseEntity.ok(paymentService.capturePayPalPayment(projectId, auth.getName()));
    }

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
