package com.freelancerhub.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "proposals", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"project_id", "freelancer_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Proposal extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "freelancer_id", nullable = false)
    private User freelancer;

    @Column(nullable = false, length = 3000)
    private String coverLetter;

    @Column(nullable = false)
    private BigDecimal proposedPrice;

    @Column(nullable = false)
    private Integer estimatedDays;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ProposalStatus status = ProposalStatus.SUBMITTED;

    public enum ProposalStatus {
        SUBMITTED,
        SHORTLISTED,
        ACCEPTED,
        REJECTED,
        WITHDRAWN
    }
}
