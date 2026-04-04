package com.example.freelancer.controller;

import com.example.freelancer.dto.CreateTaskRequest;
import com.example.freelancer.dto.TaskResponse;
import com.example.freelancer.dto.UpdateMilestoneStatusRequest;
import com.example.freelancer.dto.UpdateTaskProgressRequest;
import com.example.freelancer.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public TaskResponse createTask(@Valid @RequestBody CreateTaskRequest req, Authentication authentication) {
        return taskService.createTask(req, authentication.getName());
    }

    @GetMapping
    public Page<TaskResponse> listTasks(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "10") int size,
                                        Authentication authentication) {
        return taskService.listTasks(page, size, authentication.getName());
    }

    @PatchMapping("/{id}/progress")
    @PreAuthorize("hasRole('FREELANCER')")
    public TaskResponse updateProgress(@PathVariable("id") java.util.UUID taskId,
                                       @Valid @RequestBody UpdateTaskProgressRequest req,
                                       Authentication authentication) {
        return taskService.updateProgress(taskId, req.progressPercent(), authentication.getName());
    }

    @PatchMapping("/{taskId}/milestones/{milestoneId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public TaskResponse updateMilestoneStatus(@PathVariable java.util.UUID taskId,
                                              @PathVariable java.util.UUID milestoneId,
                                              @Valid @RequestBody UpdateMilestoneStatusRequest req,
                                              Authentication authentication) {
        return taskService.updateMilestoneStatus(taskId, milestoneId, req.completed(), authentication.getName());
    }
}
