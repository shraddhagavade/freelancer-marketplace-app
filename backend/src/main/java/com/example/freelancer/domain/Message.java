package com.example.freelancer.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="messages") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {
@Id private UUID id;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="task_id", nullable=false) private Task task;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="sender_id", nullable=false) private User sender;
@ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="receiver_id", nullable=false) private User receiver;
@Column(nullable=false, columnDefinition="TEXT") private String content;
@Column(name="created_at", nullable=false) private Instant createdAt;
}
