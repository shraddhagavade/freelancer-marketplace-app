package com.example.freelancer.service;

import com.example.freelancer.domain.*;
import com.example.freelancer.dto.*;
import com.example.freelancer.exception.*;
import com.example.freelancer.repository.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository, ApplicationRepository applicationRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
    }

    public TaskResponse createTask(CreateTaskRequest req, String email) {
        User client = userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        if (client.getRole() != UserRole.CLIENT) throw new ForbiddenException("Only clients can post tasks");

        Task task = Task.builder()
                .id(UUID.randomUUID())
                .title(req.title())
                .description(req.description())
                .budget(req.budget())
                .status(TaskStatus.OPEN)
                .progressPercent(0)
                .client(client)
                .createdAt(Instant.now())
                .build();

        Task saved = taskRepository.save(task);
        return toResponse(saved);
    }

    public Page<TaskResponse> listTasks(int page, int size, String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Task> tasks = user.getRole() == UserRole.CLIENT
                ? taskRepository.findByClient_EmailIgnoreCase(user.getEmail(), pageable)
                : taskRepository.findByStatusIn(List.of(TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED), pageable);

        return tasks.map(this::toResponse);
    }

    public Task getTask(UUID taskId) {
        return taskRepository.findById(taskId).orElseThrow(() -> new NotFoundException("Task not found"));
    }

    public TaskResponse updateProgress(UUID taskId, Integer progressPercent, String email) {
        Task task = getTask(taskId);
        Application acceptedApplication = applicationRepository.findByTaskAndStatus(task, ApplicationStatus.ACCEPTED)
                .orElseThrow(() -> new BadRequestException("Task does not have an accepted freelancer"));

        if (!acceptedApplication.getFreelancer().getEmail().equalsIgnoreCase(email)) {
            throw new ForbiddenException("Only the accepted freelancer can update task progress");
        }

        task.setProgressPercent(progressPercent);
        task.setStatus(progressPercent >= 100 ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS);
        Task saved = taskRepository.save(task);
        return toResponse(saved);
    }

    private TaskResponse toResponse(Task task) {
        Optional<Application> acceptedApplication = applicationRepository.findByTaskAndStatus(task, ApplicationStatus.ACCEPTED);
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getBudget(),
                task.getStatus(),
                task.getProgressPercent(),
                task.getClient().getId(),
                task.getClient().getFullName(),
                acceptedApplication.map(app -> app.getFreelancer().getId()).orElse(null),
                acceptedApplication.map(app -> app.getFreelancer().getFullName()).orElse(null),
                acceptedApplication.map(app -> app.getFreelancer().getEmail()).orElse(null),
                task.getCreatedAt()
        );
    }
}
