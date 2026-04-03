package com.example.freelancer.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="reviews") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {
@Id private UUID id;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="task_id", nullable=false) private Task task;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="reviewer_id", nullable=false) private User reviewer;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="reviewee_id", nullable=false) private User reviewee;
@Column(nullable=false) private Integer rating;
@Column(nullable=false, columnDefinition="TEXT") private String comment;
@Column(name="created_at", nullable=false) private Instant createdAt;
}
