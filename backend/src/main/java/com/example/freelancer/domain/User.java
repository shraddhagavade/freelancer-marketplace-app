package com.example.freelancer.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="users") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
@Id private UUID id;
@Column(name="full_name", nullable=false) private String fullName;
@Column(nullable=false, unique=true) private String email;
@Column(name="password_hash", nullable=false) private String passwordHash;
@Enumerated(EnumType.STRING) @Column(nullable=false) private UserRole role;
@Column(name="created_at", nullable=false) private Instant createdAt;
}
