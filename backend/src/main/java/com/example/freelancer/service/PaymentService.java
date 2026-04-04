package com.example.freelancer.service;

import com.example.freelancer.domain.*;
import com.example.freelancer.dto.*;
import com.example.freelancer.exception.*;
import com.example.freelancer.repository.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final TaskService taskService;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;

    public PaymentService(PaymentRepository paymentRepository, TaskService taskService, UserRepository userRepository, ApplicationRepository applicationRepository) {
        this.paymentRepository = paymentRepository;
        this.taskService = taskService;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
    }

    public PaymentResponse create(CreatePaymentRequest req, String payerEmail) {
        Task task = taskService.getTask(req.taskId());
        User payer = userRepository.findByEmail(payerEmail).orElseThrow(() -> new NotFoundException("Payer not found"));
        Application acceptedApplication = applicationRepository.findByTaskAndStatus(task, ApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new BadRequestException("Task does not have an accepted freelancer"));
        User payee = acceptedApplication.getFreelancer();

        if (!task.getClient().getId().equals(payer.getId())) {
            throw new ForbiddenException("Only task client can initiate payment");
        }

        if (task.getStatus() != TaskStatus.COMPLETED) {
            throw new BadRequestException("Payment can be prepared only after the task is marked completed");
        }

        paymentRepository.findTopByTaskOrderByCreatedAtDesc(task).ifPresent(existingPayment -> {
            if (existingPayment.getStatus() == PaymentStatus.COMPLETED) {
                throw new BadRequestException("Payment has already been released for this task");
            }
            if (existingPayment.getStatus() == PaymentStatus.INITIATED) {
                throw new BadRequestException("A payment release is already waiting for verification on this task");
            }
        });

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .task(task)
                .payer(payer)
                .payee(payee)
                .amount(req.amount())
                .paymentMethod(req.paymentMethod())
                .transactionReference(buildTransactionReference())
                .status(PaymentStatus.INITIATED)
                .createdAt(Instant.now())
                .build();

        Payment saved = paymentRepository.save(payment);
        return toResponse(saved);
    }

    public PaymentResponse confirm(UUID paymentId, ConfirmPaymentRequest req, String payerEmail) {
        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> new NotFoundException("Payment not found"));

        if (!payment.getPayer().getEmail().equalsIgnoreCase(payerEmail)) {
            throw new ForbiddenException("Only the task client can release this payment");
        }

        if (payment.getTask().getStatus() != TaskStatus.COMPLETED) {
            throw new BadRequestException("Task must remain completed before payment can be released");
        }

        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            throw new BadRequestException("Payment is already released");
        }

        payment.setVerifiedAt(Instant.now());
        payment.setReleasedAt(Instant.now());
        payment.setStatus(PaymentStatus.COMPLETED);
        Payment saved = paymentRepository.save(payment);
        return toResponse(saved);
    }

    public List<PaymentResponse> listForUser(String email) {
        return paymentRepository.findByPayer_EmailIgnoreCaseOrPayee_EmailIgnoreCaseOrderByCreatedAtDesc(email, email)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getTask().getId(),
                payment.getPayer().getId(),
                payment.getPayer().getFullName(),
                payment.getPayee().getId(),
                payment.getPayee().getFullName(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getTransactionReference(),
                payment.getStatus(),
                payment.getCreatedAt(),
                payment.getVerifiedAt(),
                payment.getReleasedAt()
        );
    }

    private String buildTransactionReference() {
        return "FMA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
