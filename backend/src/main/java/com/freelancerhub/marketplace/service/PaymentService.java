package com.freelancerhub.marketplace.service;

import com.freelancerhub.marketplace.dto.PaymentDto;
import com.freelancerhub.marketplace.entity.ClientProfile;
import com.freelancerhub.marketplace.entity.FreelancerProfile;
import com.freelancerhub.marketplace.entity.Payment;
import com.freelancerhub.marketplace.entity.Project;
import com.freelancerhub.marketplace.entity.Proposal;
import com.freelancerhub.marketplace.entity.User;
import com.freelancerhub.marketplace.exception.ResourceNotFoundException;
import com.freelancerhub.marketplace.repository.ClientProfileRepository;
import com.freelancerhub.marketplace.repository.FreelancerProfileRepository;
import com.freelancerhub.marketplace.repository.PaymentRepository;
import com.freelancerhub.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Simulated escrow (Level 1). No real money moves; we record the intent
 * and status transitions so the UI can show a realistic payment flow.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;

    /**
     * Called when a client accepts a proposal. Creates (or reuses) a HELD escrow
     * record for the project using the accepted proposal's price.
     * Safe to call within an existing transaction (accept flow).
     */
    @Transactional
    public void holdEscrow(Project project, Proposal acceptedProposal) {
        // One payment per project; if one already exists, don't duplicate.
        if (paymentRepository.findByProjectId(project.getId()).isPresent()) {
            return;
        }

        Payment payment = Payment.builder()
                .project(project)
                .client(project.getClient())
                .freelancer(acceptedProposal.getFreelancer())
                .proposal(acceptedProposal)
                .amount(acceptedProposal.getProposedPrice())
                .status(Payment.PaymentStatus.HELD)
                .build();

        paymentRepository.save(payment);
        log.info("Escrow HELD for project '{}' amount {}", project.getTitle(), payment.getAmount());
    }

    /**
     * Called when the client marks the project COMPLETED. Releases the held
     * funds to the freelancer and updates denormalized stats.
     */
    @Transactional
    public void releaseEscrow(Project project) {
        paymentRepository.findByProjectId(project.getId()).ifPresent(payment -> {
            if (payment.getStatus() != Payment.PaymentStatus.HELD) {
                return; // already released/refunded — nothing to do
            }
            payment.setStatus(Payment.PaymentStatus.RELEASED);
            payment.setReleasedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Update client's total spent
            clientProfileRepository.findByUserId(payment.getClient().getId()).ifPresent(cp -> {
                BigDecimal current = cp.getTotalSpent() != null ? cp.getTotalSpent() : BigDecimal.ZERO;
                cp.setTotalSpent(current.add(payment.getAmount()));
                clientProfileRepository.save(cp);
            });

            // Update freelancer's completed-projects counter
            freelancerProfileRepository.findByUserId(payment.getFreelancer().getId()).ifPresent(fp -> {
                int completed = fp.getCompletedProjects() != null ? fp.getCompletedProjects() : 0;
                fp.setCompletedProjects(completed + 1);
                freelancerProfileRepository.save(fp);
            });

            log.info("Escrow RELEASED for project '{}' amount {} to freelancer {}",
                    project.getTitle(), payment.getAmount(), payment.getFreelancer().getEmail());
        });
    }

    /**
     * Called when the project is CANCELLED. Returns held funds to the client.
     */
    @Transactional
    public void refundEscrow(Project project) {
        paymentRepository.findByProjectId(project.getId()).ifPresent(payment -> {
            if (payment.getStatus() != Payment.PaymentStatus.HELD) {
                return;
            }
            payment.setStatus(Payment.PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
            log.info("Escrow REFUNDED for project '{}' amount {}", project.getTitle(), payment.getAmount());
        });
    }

    // ===== Read APIs =====

    /** Payments where the current user is the paying client. */
    public List<PaymentDto> getClientPayments(String email) {
        User user = findUser(email);
        return paymentRepository.findByClientId(user.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /** Payments where the current user is the receiving freelancer. */
    public List<PaymentDto> getFreelancerPayments(String email) {
        User user = findUser(email);
        return paymentRepository.findByFreelancerId(user.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /** Single payment for a project (used on the project details page). */
    public PaymentDto getProjectPayment(Long projectId) {
        return paymentRepository.findByProjectId(projectId)
                .map(this::mapToDto)
                .orElse(null);
    }

    /**
     * A small summary for the dashboard: totals for the current user in both roles.
     * Keys: heldAsClient, spentAsClient, pendingAsFreelancer, earnedAsFreelancer.
     */
    public Map<String, BigDecimal> getSummary(String email) {
        User user = findUser(email);
        Map<String, BigDecimal> summary = new HashMap<>();

        List<Payment> asClient = paymentRepository.findByClientId(user.getId());
        summary.put("heldAsClient", sum(asClient, Payment.PaymentStatus.HELD));
        summary.put("spentAsClient", sum(asClient, Payment.PaymentStatus.RELEASED));

        List<Payment> asFreelancer = paymentRepository.findByFreelancerId(user.getId());
        summary.put("pendingAsFreelancer", sum(asFreelancer, Payment.PaymentStatus.HELD));
        summary.put("earnedAsFreelancer", sum(asFreelancer, Payment.PaymentStatus.RELEASED));

        return summary;
    }

    private BigDecimal sum(List<Payment> payments, Payment.PaymentStatus status) {
        return payments.stream()
                .filter(p -> p.getStatus() == status)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private PaymentDto mapToDto(Payment p) {
        return PaymentDto.builder()
                .id(p.getId())
                .projectId(p.getProject().getId())
                .projectTitle(p.getProject().getTitle())
                .clientId(p.getClient().getId())
                .clientName(p.getClient().getFirstName() + " " + p.getClient().getLastName())
                .freelancerId(p.getFreelancer().getId())
                .freelancerName(p.getFreelancer().getFirstName() + " " + p.getFreelancer().getLastName())
                .amount(p.getAmount())
                .status(p.getStatus().name())
                .createdAt(p.getCreatedAt())
                .releasedAt(p.getReleasedAt())
                .build();
    }
}
