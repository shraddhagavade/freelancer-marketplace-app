package com.example.freelancer.service;

import com.example.freelancer.domain.User;
import com.example.freelancer.domain.PasswordResetToken;
import com.example.freelancer.dto.*;
import com.example.freelancer.exception.BadRequestException;
import com.example.freelancer.repository.PasswordResetTokenRepository;
import com.example.freelancer.repository.UserRepository;
import com.example.freelancer.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordResetEmailService passwordResetEmailService;
    private final String appBaseUrl;
    private final long passwordResetExpirationMinutes;

    public AuthService(UserRepository userRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       PasswordResetEmailService passwordResetEmailService,
                       @Value("${app.base-url}") String appBaseUrl,
                       @Value("${app.password-reset.expiration-minutes}") long passwordResetExpirationMinutes) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.passwordResetEmailService = passwordResetEmailService;
        this.appBaseUrl = appBaseUrl;
        this.passwordResetExpirationMinutes = passwordResetExpirationMinutes;
    }

    public AuthResponse register(RegisterRequest req) {
        String normalizedEmail = normalizeEmail(req.email());
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new BadRequestException("An account with this email already exists. If you already have an account, please log in.");
        }
        User user = User.builder()
                .id(UUID.randomUUID())
                .fullName(normalizeFullName(req.fullName()))
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(req.role())
                .createdAt(Instant.now())
                .build();
        userRepository.save(user);
        var principal = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .build();
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, user.getEmail(), user.getRole().name(), user.getFullName());
    }

    public AuthResponse login(LoginRequest req) {
        String normalizedEmail = normalizeEmail(req.email());
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(normalizedEmail, req.password()));
        User user = userRepository.findByEmail(normalizedEmail).orElseThrow(() -> new BadRequestException("Invalid credentials"));
        var principal = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .build();
        return new AuthResponse(jwtService.generateToken(principal), user.getEmail(), user.getRole().name(), user.getFullName());
    }

    public ErrorResponse forgotPassword(ForgotPasswordRequest req) {
        String normalizedEmail = normalizeEmail(req.email());
        userRepository.findByEmail(normalizedEmail).ifPresent(this::createAndSendPasswordResetToken);
        return new ErrorResponse("If an account exists for this email, a password reset link has been sent.", Instant.now());
    }

    public ErrorResponse resetPassword(ResetPasswordConfirmRequest req) {
        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByTokenHash(hashToken(req.token()))
                .orElseThrow(() -> new BadRequestException("This password reset link is invalid or has expired"));

        if (passwordResetToken.getUsedAt() != null || passwordResetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("This password reset link is invalid or has expired");
        }

        User user = passwordResetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);

        passwordResetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(passwordResetToken);

        return new ErrorResponse("Password reset successful. You can now log in with your new password.", Instant.now());
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeFullName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return fullName;
        }

        return java.util.Arrays.stream(fullName.trim().split("\\s+"))
                .filter(part -> !part.isBlank())
                .map(part -> part.substring(0, 1).toUpperCase(Locale.ROOT) + part.substring(1).toLowerCase(Locale.ROOT))
                .reduce((first, second) -> first + " " + second)
                .orElse(fullName.trim());
    }

    private void createAndSendPasswordResetToken(User user) {
        var activeTokens = passwordResetTokenRepository.findByUserAndUsedAtIsNull(user);
        activeTokens.stream()
                .filter(token -> token.getExpiresAt().isAfter(Instant.now()))
                .forEach(token -> token.setUsedAt(Instant.now()));
        if (!activeTokens.isEmpty()) {
            passwordResetTokenRepository.saveAll(activeTokens);
        }

        String rawToken = UUID.randomUUID() + "-" + UUID.randomUUID();
        PasswordResetToken token = PasswordResetToken.builder()
                .id(UUID.randomUUID())
                .tokenHash(hashToken(rawToken))
                .user(user)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(passwordResetExpirationMinutes * 60))
                .build();
        passwordResetTokenRepository.save(token);

        String resetUrl = appBaseUrl + "/?resetToken=" + rawToken;
        passwordResetEmailService.sendPasswordResetEmail(user, resetUrl);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte current : bytes) {
                builder.append(String.format("%02x", current));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Token hashing is unavailable");
        }
    }
}
