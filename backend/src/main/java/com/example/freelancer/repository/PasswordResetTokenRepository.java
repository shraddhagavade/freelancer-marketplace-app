package com.example.freelancer.repository;

import com.example.freelancer.domain.PasswordResetToken;
import com.example.freelancer.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);
    List<PasswordResetToken> findByUserAndUsedAtIsNull(User user);
}
