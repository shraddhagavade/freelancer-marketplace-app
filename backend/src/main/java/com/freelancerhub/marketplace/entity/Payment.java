package com.freelancerhub.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Simulated escrow payment (Level 1 — no real money movement).
 *
 * Lifecycle:
 *   HELD     -> created when a client accepts a proposal; funds are "held in escrow".
 *   RELEASED -> when the client marks the project COMPLETED; funds go to the freelancer.
 *   REFUNDED -> when the project is CANCELLED; funds return to the client.
 *
 * One payment per project (the accepted proposal's price).
 */
@Entity
@Table(name = "payments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"project_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** The client paying into escrow. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    /** The freelancer who receives the funds on release. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "freelancer_id", nullable = false)
    private User freelancer;

    /** Optional link back to the accepted proposal. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "proposal_id")
    private Proposal proposal;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.HELD;

    /** When the funds were released to the freelancer (null while HELD). */
    private LocalDateTime releasedAt;

    public enum PaymentStatus {
        HELD,
        RELEASED,
        REFUNDED
    }
}
