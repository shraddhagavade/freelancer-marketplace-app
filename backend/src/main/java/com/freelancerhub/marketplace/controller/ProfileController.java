package com.freelancerhub.marketplace.controller;

import com.freelancerhub.marketplace.dto.*;
import com.freelancerhub.marketplace.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // ===== PUBLIC: Freelancer directory with search/filter =====
    @GetMapping("/freelancers")
    public ResponseEntity<Page<FreelancerProfileDto>> browseFreelancers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String experienceLevel,
            @RequestParam(required = false) String availability,
            @RequestParam(required = false) BigDecimal maxRate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(
                profileService.searchFreelancers(keyword, experienceLevel, availability, maxRate, page, size)
        );
    }

    @GetMapping("/users/me")
    public ResponseEntity<UserProfileDto> getCurrentUser(Authentication auth) {
        UserProfileDto profile = profileService.getCurrentUserProfile(auth.getName());
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/freelancers/me")
    public ResponseEntity<FreelancerProfileDto> getMyFreelancerProfile(Authentication auth) {
        FreelancerProfileDto profile = profileService.getFreelancerProfile(auth.getName());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/freelancers/me")
    public ResponseEntity<FreelancerProfileDto> updateFreelancerProfile(
            Authentication auth,
            @Valid @RequestBody FreelancerProfileDto dto) {
        FreelancerProfileDto updated = profileService.updateFreelancerProfile(auth.getName(), dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/clients/me")
    public ResponseEntity<ClientProfileDto> getMyClientProfile(Authentication auth) {
        ClientProfileDto profile = profileService.getClientProfile(auth.getName());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/clients/me")
    public ResponseEntity<ClientProfileDto> updateClientProfile(
            Authentication auth,
            @Valid @RequestBody ClientProfileDto dto) {
        ClientProfileDto updated = profileService.updateClientProfile(auth.getName(), dto);
        return ResponseEntity.ok(updated);
    }

    // Public: view any freelancer profile
    @GetMapping("/freelancers/{id}")
    public ResponseEntity<FreelancerProfileDto> getFreelancerProfile(@PathVariable Long id) {
        FreelancerProfileDto profile = profileService.getFreelancerProfileById(id);
        return ResponseEntity.ok(profile);
    }

    // Public: view a client's public profile + their posted projects (by USER id)
    @GetMapping("/clients/{userId}/public")
    public ResponseEntity<PublicClientDto> getPublicClientProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getPublicClientProfile(userId));
    }
}
