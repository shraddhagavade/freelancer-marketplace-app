package com.freelancerhub.marketplace.service;

import com.freelancerhub.marketplace.dto.CreateProjectRequest;
import com.freelancerhub.marketplace.dto.ProjectDto;
import com.freelancerhub.marketplace.entity.*;
import com.freelancerhub.marketplace.exception.BadRequestException;
import com.freelancerhub.marketplace.exception.ResourceNotFoundException;
import com.freelancerhub.marketplace.repository.CategoryRepository;
import com.freelancerhub.marketplace.repository.ClientProfileRepository;
import com.freelancerhub.marketplace.repository.ProjectRepository;
import com.freelancerhub.marketplace.repository.SkillRepository;
import com.freelancerhub.marketplace.repository.UserRepository;
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
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SkillRepository skillRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final PaymentService paymentService;

    @Transactional
    public ProjectDto createProject(String clientEmail, CreateProjectRequest request) {
        User client = userRepository.findByEmail(clientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", clientEmail));

        // Verify user is a CLIENT
        boolean isClient = client.getRoles().stream()
                .anyMatch(r -> r.getName() == Role.RoleName.CLIENT);
        if (!isClient) {
            throw new BadRequestException("Only clients can create projects");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        }

        // Resolve skills
        Set<Skill> skills = new HashSet<>();
        if (request.getSkills() != null) {
            for (String skillName : request.getSkills()) {
                Skill skill = skillRepository.findByName(skillName)
                        .orElseGet(() -> skillRepository.save(Skill.builder().name(skillName).build()));
                skills.add(skill);
            }
        }

        Project.ExperienceLevel expLevel = null;
        if (request.getExperienceLevel() != null && !request.getExperienceLevel().isBlank()) {
            try {
                expLevel = Project.ExperienceLevel.valueOf(request.getExperienceLevel().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid experience level: " + request.getExperienceLevel()
                        + ". Must be ENTRY, INTERMEDIATE, or EXPERT");
            }
        }

        Project project = Project.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .budget(request.getBudget())
                .deadline(request.getDeadline())
                .status(Project.ProjectStatus.OPEN)
                .experienceLevel(expLevel)
                .client(client)
                .category(category)
                .skills(skills)
                .proposalCount(0)
                .build();

        projectRepository.save(project);

        // Increment the client's posted-project counter (denormalized stat)
        clientProfileRepository.findByUserId(client.getId()).ifPresent(cp -> {
            int current = cp.getTotalProjectsPosted() != null ? cp.getTotalProjectsPosted() : 0;
            cp.setTotalProjectsPosted(current + 1);
            clientProfileRepository.save(cp);
        });

        log.info("Project created: '{}' by client {}", project.getTitle(), clientEmail);

        return mapToDto(project);
    }

    public ProjectDto getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
        return mapToDto(project);
    }

    public Page<ProjectDto> getOpenProjects(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return projectRepository.findByStatus(Project.ProjectStatus.OPEN, pageable)
                .map(this::mapToDto);
    }

    public Page<ProjectDto> searchProjects(String keyword, Long categoryId,
                                           BigDecimal minBudget, BigDecimal maxBudget,
                                           int page, int size) {
        // Native query handles ordering; no Sort in Pageable to avoid conflicts.
        Pageable pageable = PageRequest.of(page, size);
        String keywordParam = (keyword != null && !keyword.isBlank()) ? keyword : null;
        return projectRepository.searchProjects(
                Project.ProjectStatus.OPEN.name(), keywordParam, categoryId, minBudget, maxBudget, pageable
        ).map(this::mapToDto);
    }

    public List<ProjectDto> getMyProjects(String clientEmail) {
        User client = userRepository.findByEmail(clientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", clientEmail));
        return projectRepository.findByClientId(client.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectDto updateProjectStatus(Long projectId, String clientEmail, String newStatus) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        if (!project.getClient().getEmail().equals(clientEmail)) {
            throw new BadRequestException("You can only update your own projects");
        }

        // Validate the status value to avoid a 500 on bad input
        Project.ProjectStatus target;
        try {
            target = Project.ProjectStatus.valueOf(newStatus);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BadRequestException("Invalid status: " + newStatus
                    + ". Must be one of OPEN, IN_PROGRESS, COMPLETED, CANCELLED");
        }

        project.setStatus(target);
        projectRepository.save(project);
        log.info("Project {} status updated to {}", projectId, target);

        // Escrow transitions (simulated): release on completion, refund on cancellation
        if (target == Project.ProjectStatus.COMPLETED) {
            paymentService.releaseEscrow(project);
        } else if (target == Project.ProjectStatus.CANCELLED) {
            paymentService.refundEscrow(project);
        }

        return mapToDto(project);
    }

    private ProjectDto mapToDto(Project project) {
        return ProjectDto.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .budget(project.getBudget())
                .deadline(project.getDeadline())
                .status(project.getStatus().name())
                .experienceLevel(project.getExperienceLevel() != null ? project.getExperienceLevel().name() : null)
                .categoryName(project.getCategory() != null ? project.getCategory().getName() : null)
                .categoryId(project.getCategory() != null ? project.getCategory().getId() : null)
                .skills(project.getSkills().stream().map(Skill::getName).collect(Collectors.toSet()))
                .proposalCount(project.getProposalCount())
                .clientId(project.getClient().getId())
                .clientName(project.getClient().getFirstName() + " " + project.getClient().getLastName())
                .clientAvatarUrl(project.getClient().getAvatarUrl())
                .createdAt(project.getCreatedAt())
                .build();
    }
}
