package com.example.freelancer.domain;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="tasks") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Task {
@Id private UUID id;
@Column(nullable=false) private String title;
@Column(nullable=false, columnDefinition="TEXT") private String description;
@Column(nullable=false, precision=12, scale=2) private BigDecimal budget;
@Enumerated(EnumType.STRING) @Column(nullable=false) private TaskStatus status;
@Column(name="progress_percent", nullable=false) private Integer progressPercent;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="client_id", nullable=false) private User client;
@Column(name="created_at", nullable=false) private Instant createdAt;
}
