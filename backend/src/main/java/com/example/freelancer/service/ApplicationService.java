package com.example.freelancer.service;

import com.example.freelancer.domain.*;
import com.example.freelancer.dto.*;
import com.example.freelancer.exception.*;
import com.example.freelancer.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final TaskService taskService;
    private final UserRepository userRepository;

    public ApplicationService(ApplicationRepository applicationRepository, TaskService taskService, UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.taskService = taskService;
        this.userRepository = userRepository;
    }

    public ApplicationResponse apply(UUID taskId, ApplyTaskRequest req, String email) {
        User freelancer = userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        if (freelancer.getRole() != UserRole.FREELANCER) throw new ForbiddenException("Only freelancers can apply");

        Task task = taskService.getTask(taskId);
        if (task.getStatus() != TaskStatus.OPEN) throw new BadRequestException("Task is not open");
        if (applicationRepository.existsByTaskAndFreelancer(task, freelancer)) throw new BadRequestException("Already applied");

        Application application = Application.builder()
                .id(UUID.randomUUID())
                .task(task)
                .freelancer(freelancer)
                .proposal(req.proposal())
                .bidAmount(req.bidAmount())
                .status(ApplicationStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        return toResponse(applicationRepository.save(application));
    }

    @Transactional
    public ApplicationResponse accept(UUID applicationId, String email) {
        Application selected = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NotFoundException("Application not found"));

        if (!selected.getTask().getClient().getEmail().equalsIgnoreCase(email)) {
            throw new ForbiddenException("Only task owner can accept application");
        }

        List<Application> applications = applicationRepository.findByTask(selected.getTask());
        for (Application app : applications) {
            app.setStatus(app.getId().equals(applicationId) ? ApplicationStatus.ACCEPTED : ApplicationStatus.REJECTED);
        }
        selected.getTask().setStatus(TaskStatus.IN_PROGRESS);
        return toResponse(selected);
    }

    public List<ApplicationResponse> listForTask(UUID taskId, String email) {
        Task task = taskService.getTask(taskId);
        if (!task.getClient().getEmail().equalsIgnoreCase(email)) {
            throw new ForbiddenException("Only task owner can view applications");
        }
        return applicationRepository.findByTask(task).stream()
                .map(this::toResponse)
                .toList();
    }

    private ApplicationResponse toResponse(Application app) {
        return new ApplicationResponse(
                app.getId(),
                app.getTask().getId(),
                app.getFreelancer().getId(),
                app.getFreelancer().getFullName(),
                app.getProposal(),
                app.getBidAmount(),
                app.getStatus(),
                app.getCreatedAt()
        );
    }
}
