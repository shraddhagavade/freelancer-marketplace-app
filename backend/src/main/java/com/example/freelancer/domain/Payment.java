package com.example.freelancer.domain;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="payments") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment {
@Id private UUID id;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="task_id", nullable=false) private Task task;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="payer_id", nullable=false) private User payer;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="payee_id", nullable=false) private User payee;
@Column(nullable=false, precision=12, scale=2) private java.math.BigDecimal amount;
@Enumerated(EnumType.STRING) @Column(nullable=false) private PaymentStatus status;
@Column(name="created_at", nullable=false) private Instant createdAt;
}
