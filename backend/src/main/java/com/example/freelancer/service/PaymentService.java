package com.example.freelancer.service;

import com.example.freelancer.domain.*;
import com.example.freelancer.dto.*;
import com.example.freelancer.exception.*;
import com.example.freelancer.repository.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final TaskService taskService;
    private final UserRepository userRepository;

    public PaymentService(PaymentRepository paymentRepository, TaskService taskService, UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.taskService = taskService;
        this.userRepository = userRepository;
    }

    public PaymentResponse create(CreatePaymentRequest req, String payerEmail) {
        Task task = taskService.getTask(req.taskId());
        User payer = userRepository.findByEmail(payerEmail).orElseThrow(() -> new NotFoundException("Payer not found"));
        User payee = userRepository.findById(req.payeeId()).orElseThrow(() -> new NotFoundException("Payee not found"));

        if (!task.getClient().getId().equals(payer.getId())) {
            throw new ForbiddenException("Only task client can initiate payment");
        }

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .task(task)
                .payer(payer)
                .payee(payee)
                .amount(req.amount())
                .status(PaymentStatus.COMPLETED)
                .createdAt(Instant.now())
                .build();

        Payment saved = paymentRepository.save(payment);
        return new PaymentResponse(saved.getId(), task.getId(), payer.getId(), payee.getId(), saved.getAmount(), saved.getStatus(), saved.getCreatedAt());
    }
}
