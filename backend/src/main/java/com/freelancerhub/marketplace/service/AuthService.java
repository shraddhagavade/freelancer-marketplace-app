package com.freelancerhub.marketplace.service;

import com.freelancerhub.marketplace.dto.AuthResponse;
import com.freelancerhub.marketplace.dto.LoginRequest;
import com.freelancerhub.marketplace.dto.RegisterRequest;
import com.freelancerhub.marketplace.entity.Role;
import com.freelancerhub.marketplace.entity.User;
import com.freelancerhub.marketplace.exception.BadRequestException;
import com.freelancerhub.marketplace.exception.DuplicateResourceException;
import com.freelancerhub.marketplace.repository.RoleRepository;
import com.freelancerhub.marketplace.repository.UserRepository;
import com.freelancerhub.marketplace.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check for duplicates
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        // Parse and validate role
        Role.RoleName roleName;
        try {
            roleName = Role.RoleName.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.getRole() + ". Must be CLIENT or FREELANCER");
        }

        if (roleName == Role.RoleName.ADMIN) {
            throw new BadRequestException("Cannot self-register as ADMIN");
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new BadRequestException("Role not found: " + roleName));

        // Generate username from email
        String username = request.getEmail().split("@")[0];
        if (userRepository.existsByUsername(username)) {
            username = username + System.currentTimeMillis() % 10000;
        }

        // Create user
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .username(username)
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(Set.of(role))
                .active(true)
                .build();

        userRepository.save(user);
        log.info("User registered: {} with role {}", user.getEmail(), roleName);

        // Generate JWT
        String token = jwtUtil.generateToken(user.getEmail(), roleName.name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(roleName.name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Authenticate via Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Fetch user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        String role = user.getRoles().stream()
                .findFirst()
                .map(r -> r.getName().name())
                .orElse("CLIENT");

        // Generate JWT
        String token = jwtUtil.generateToken(user.getEmail(), role);

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(role)
                .build();
    }
}
