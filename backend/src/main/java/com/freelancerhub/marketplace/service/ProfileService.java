package com.freelancerhub.marketplace.service;

import com.freelancerhub.marketplace.dto.*;
import com.freelancerhub.marketplace.entity.*;
import com.freelancerhub.marketplace.exception.BadRequestException;
import com.freelancerhub.marketplace.exception.ResourceNotFoundException;
import com.freelancerhub.marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserRepository userRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final SkillRepository skillRepository;
    private final ProjectRepository projectRepository;

    public UserProfileDto getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        String role = user.getRoles().stream()
                .findFirst()
                .map(r -> r.getName().name())
                .orElse("CLIENT");

        return UserProfileDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .email(user.getEmail())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .location(user.getLocation())
                .role(role)
                .build();
    }

    @Transactional
    public FreelancerProfileDto getFreelancerProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        FreelancerProfile profile = freelancerProfileRepository.findByUserId(user.getId())
                .orElse(null);

        if (profile == null) {
            // Auto-create empty profile
            profile = FreelancerProfile.builder().user(user).build();
            freelancerProfileRepository.save(profile);
        }

        return mapToFreelancerDto(profile);
    }

    @Transactional
    public FreelancerProfileDto updateFreelancerProfile(String email, FreelancerProfileDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        FreelancerProfile profile = freelancerProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> FreelancerProfile.builder().user(user).build());

        // Update fields
        if (dto.getTitle() != null) profile.setTitle(dto.getTitle());
        if (dto.getOverview() != null) profile.setOverview(dto.getOverview());
        if (dto.getHourlyRate() != null) profile.setHourlyRate(dto.getHourlyRate());
        if (dto.getYearsOfExperience() != null) profile.setYearsOfExperience(dto.getYearsOfExperience());
        if (dto.getPortfolioUrl() != null) profile.setPortfolioUrl(dto.getPortfolioUrl());
        if (dto.getLinkedinUrl() != null) profile.setLinkedinUrl(dto.getLinkedinUrl());
        if (dto.getGithubUrl() != null) profile.setGithubUrl(dto.getGithubUrl());

        if (dto.getExperienceLevel() != null) {
            profile.setExperienceLevel(FreelancerProfile.ExperienceLevel.valueOf(dto.getExperienceLevel()));
        }
        if (dto.getAvailability() != null) {
            profile.setAvailability(FreelancerProfile.Availability.valueOf(dto.getAvailability()));
        }

        // Update skills
        if (dto.getSkills() != null) {
            Set<Skill> skills = new HashSet<>();
            for (String skillName : dto.getSkills()) {
                Skill skill = skillRepository.findByName(skillName)
                        .orElseGet(() -> {
                            Skill newSkill = Skill.builder().name(skillName).build();
                            return skillRepository.save(newSkill);
                        });
                skills.add(skill);
            }
            profile.setSkills(skills);
        }

        // Update user fields
        if (dto.getFirstName() != null) user.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) user.setLastName(dto.getLastName());
        if (dto.getAvatarUrl() != null) user.setAvatarUrl(dto.getAvatarUrl());
        userRepository.save(user);

        freelancerProfileRepository.save(profile);
        log.info("Updated freelancer profile for user: {}", email);

        return mapToFreelancerDto(profile);
    }

    @Transactional
    public ClientProfileDto getClientProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        ClientProfile profile = clientProfileRepository.findByUserId(user.getId())
                .orElse(null);

        if (profile == null) {
            profile = ClientProfile.builder().user(user).build();
            clientProfileRepository.save(profile);
        }

        return mapToClientDto(profile);
    }

    @Transactional
    public ClientProfileDto updateClientProfile(String email, ClientProfileDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        ClientProfile profile = clientProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> ClientProfile.builder().user(user).build());

        if (dto.getCompanyName() != null) profile.setCompanyName(dto.getCompanyName());
        if (dto.getIndustry() != null) profile.setIndustry(dto.getIndustry());
        if (dto.getCompanyWebsite() != null) profile.setCompanyWebsite(dto.getCompanyWebsite());
        if (dto.getDescription() != null) profile.setDescription(dto.getDescription());
        if (dto.getLocation() != null) profile.setLocation(dto.getLocation());
        if (dto.getAvatarUrl() != null) user.setAvatarUrl(dto.getAvatarUrl());

        if (dto.getFirstName() != null) user.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) user.setLastName(dto.getLastName());
        userRepository.save(user);

        clientProfileRepository.save(profile);
        log.info("Updated client profile for user: {}", email);

        return mapToClientDto(profile);
    }

    @Transactional(readOnly = true)
    public FreelancerProfileDto getFreelancerProfileById(Long profileId) {
        FreelancerProfile profile = freelancerProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("FreelancerProfile", "id", profileId));
        return mapToFreelancerDto(profile);
    }

    /**
     * Public client profile by USER id, including their posted projects.
     * Used by freelancers viewing "About the Client".
     */
    @Transactional(readOnly = true)
    public PublicClientDto getPublicClientProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Verify this user is actually a client
        boolean isClient = user.getRoles().stream()
                .anyMatch(r -> r.getName() == Role.RoleName.CLIENT);
        if (!isClient) {
            throw new ResourceNotFoundException("Client", "id", userId);
        }

        ClientProfile profile = clientProfileRepository.findByUserId(userId).orElse(null);

        // Their posted projects (most recent first)
        List<ProjectDto> projects = projectRepository.findByClientId(userId).stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(this::mapProjectToDto)
                .collect(Collectors.toList());

        return PublicClientDto.builder()
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .companyName(profile != null ? profile.getCompanyName() : null)
                .industry(profile != null ? profile.getIndustry() : null)
                .companyWebsite(profile != null ? profile.getCompanyWebsite() : null)
                .description(profile != null ? profile.getDescription() : null)
                .location(profile != null ? profile.getLocation() : null)
                .totalProjectsPosted(profile != null ? profile.getTotalProjectsPosted() : projects.size())
                .averageRating(profile != null ? profile.getAverageRating() : null)
                .memberSince(user.getCreatedAt())
                .projects(projects)
                .build();
    }

    private ProjectDto mapProjectToDto(Project project) {
        return ProjectDto.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .budget(project.getBudget())
                .deadline(project.getDeadline())
                .status(project.getStatus() != null ? project.getStatus().name() : null)
                .experienceLevel(project.getExperienceLevel() != null ? project.getExperienceLevel().name() : null)
                .categoryName(project.getCategory() != null ? project.getCategory().getName() : null)
                .categoryId(project.getCategory() != null ? project.getCategory().getId() : null)
                .skills(project.getSkills().stream().map(Skill::getName).collect(Collectors.toSet()))
                .proposalCount(project.getProposalCount())
                .clientId(project.getClient().getId())
                .clientName(project.getClient().getFirstName() + " " + project.getClient().getLastName())
                .createdAt(project.getCreatedAt())
                .build();
    }

    /**
     * Public freelancer directory with search + filters.
     */
    @Transactional(readOnly = true)
    public Page<FreelancerProfileDto> searchFreelancers(String keyword, String experienceLevel,
                                                        String availability, BigDecimal maxRate,
                                                        int page, int size) {
        // Validate enum inputs; pass as strings for the native query
        String expLevel = null;
        if (experienceLevel != null && !experienceLevel.isBlank()) {
            try {
                expLevel = FreelancerProfile.ExperienceLevel.valueOf(experienceLevel.toUpperCase()).name();
            } catch (IllegalArgumentException ignored) { }
        }

        String avail = null;
        if (availability != null && !availability.isBlank()) {
            try {
                avail = FreelancerProfile.Availability.valueOf(availability.toUpperCase()).name();
            } catch (IllegalArgumentException ignored) { }
        }

        String kw = (keyword != null && !keyword.isBlank()) ? keyword : null;

        // Native query already orders by updated_at desc
        Pageable pageable = PageRequest.of(page, size);
        return freelancerProfileRepository
                .searchFreelancers(kw, expLevel, avail, maxRate, pageable)
                .map(this::mapToFreelancerDto);
    }

    // ===== Mappers =====

    private FreelancerProfileDto mapToFreelancerDto(FreelancerProfile profile) {
        User user = profile.getUser();
        return FreelancerProfileDto.builder()
                .id(profile.getId())
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .title(profile.getTitle())
                .overview(profile.getOverview())
                .hourlyRate(profile.getHourlyRate())
                .experienceLevel(profile.getExperienceLevel() != null ? profile.getExperienceLevel().name() : null)
                .availability(profile.getAvailability() != null ? profile.getAvailability().name() : null)
                .yearsOfExperience(profile.getYearsOfExperience())
                .portfolioUrl(profile.getPortfolioUrl())
                .linkedinUrl(profile.getLinkedinUrl())
                .githubUrl(profile.getGithubUrl())
                .skills(profile.getSkills().stream().map(Skill::getName).collect(Collectors.toSet()))
                .averageRating(profile.getAverageRating())
                .totalProjects(profile.getTotalProjects())
                .completedProjects(profile.getCompletedProjects())
                .build();
    }

    private ClientProfileDto mapToClientDto(ClientProfile profile) {
        User user = profile.getUser();
        return ClientProfileDto.builder()
                .id(profile.getId())
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .companyName(profile.getCompanyName())
                .industry(profile.getIndustry())
                .companyWebsite(profile.getCompanyWebsite())
                .description(profile.getDescription())
                .location(profile.getLocation())
                .totalProjectsPosted(profile.getTotalProjectsPosted())
                .totalSpent(profile.getTotalSpent())
                .averageRating(profile.getAverageRating())
                .build();
    }
}
