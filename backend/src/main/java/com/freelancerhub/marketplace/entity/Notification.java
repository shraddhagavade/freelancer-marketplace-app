package com.freelancerhub.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * An in-app notification for a user (e.g. "your proposal was accepted").
 */
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_recipient", columnList = "recipient_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    /** The user who should see this notification. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.VARCHAR)
    @Column(nullable = false, length = 40)
    private NotificationType type;

    @Column(nullable = false, length = 300)
    private String message;

    /** In-app link to navigate to when clicked (e.g. "/projects/5"). */
    @Column(length = 200)
    private String link;

    @Column(nullable = false)
    @Builder.Default
    private boolean read = false;

    public enum NotificationType {
        NEW_PROPOSAL,
        PROPOSAL_ACCEPTED,
        PROPOSAL_REJECTED,
        PAYMENT_RELEASED,
        REVIEW_RECEIVED
    }
}
