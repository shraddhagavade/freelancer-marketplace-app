package com.example.freelancer.domain;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="applications", uniqueConstraints=@UniqueConstraint(name="uk_task_freelancer_application", columnNames={"task_id","freelancer_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Application {
@Id private UUID id;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="task_id", nullable=false) private Task task;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="freelancer_id", nullable=false) private User freelancer;
@Column(nullable=false, columnDefinition="TEXT") private String proposal;
@Column(name="bid_amount", nullable=false, precision=12, scale=2) private BigDecimal bidAmount;
@Enumerated(EnumType.STRING) @Column(nullable=false) private ApplicationStatus status;
@Column(name="created_at", nullable=false) private Instant createdAt;
}
