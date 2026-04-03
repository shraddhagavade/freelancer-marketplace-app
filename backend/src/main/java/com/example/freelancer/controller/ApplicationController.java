package com.example.freelancer.controller;

import com.example.freelancer.dto.ApplicationResponse;
import com.example.freelancer.dto.ApplyTaskRequest;
import com.example.freelancer.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ApplicationController {
    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping("/tasks/{id}/apply")
    @PreAuthorize("hasRole('FREELANCER')")
    public ApplicationResponse apply(@PathVariable("id") UUID taskId,
                                     @Valid @RequestBody ApplyTaskRequest req,
                                     Authentication authentication) {
        return applicationService.apply(taskId, req, authentication.getName());
    }

    @PostMapping("/applications/{id}/accept")
    @PreAuthorize("hasRole('CLIENT')")
    public ApplicationResponse accept(@PathVariable("id") UUID applicationId, Authentication authentication) {
        return applicationService.accept(applicationId, authentication.getName());
    }

    @GetMapping("/tasks/{id}/applications")
    @PreAuthorize("hasRole('CLIENT')")
    public List<ApplicationResponse> listForTask(@PathVariable("id") UUID taskId, Authentication authentication) {
        return applicationService.listForTask(taskId, authentication.getName());
    }
}
