package com.freelancerhub.marketplace.controller;

import com.freelancerhub.marketplace.dto.CreateProjectRequest;
import com.freelancerhub.marketplace.dto.ProjectDto;
import com.freelancerhub.marketplace.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // ===== PUBLIC: Browse open projects =====
    @GetMapping
    public ResponseEntity<Page<ProjectDto>> getProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(projectService.getOpenProjects(page, size));
    }

    // ===== PUBLIC: Search projects =====
    @GetMapping("/search")
    public ResponseEntity<Page<ProjectDto>> searchProjects(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minBudget,
            @RequestParam(required = false) BigDecimal maxBudget,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                projectService.searchProjects(keyword, categoryId, minBudget, maxBudget, page, size)
        );
    }

    // ===== PUBLIC: Get project details =====
    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    // ===== AUTHENTICATED: Create project (CLIENT only) =====
    @PostMapping
    public ResponseEntity<ProjectDto> createProject(
            Authentication auth,
            @Valid @RequestBody CreateProjectRequest request) {
        ProjectDto project = projectService.createProject(auth.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(project);
    }

    // ===== AUTHENTICATED: Get my projects =====
    @GetMapping("/my")
    public ResponseEntity<List<ProjectDto>> getMyProjects(Authentication auth) {
        return ResponseEntity.ok(projectService.getMyProjects(auth.getName()));
    }

    // ===== AUTHENTICATED: Update project status =====
    @PatchMapping("/{id}/status")
    public ResponseEntity<ProjectDto> updateStatus(
            @PathVariable Long id,
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        return ResponseEntity.ok(projectService.updateProjectStatus(id, auth.getName(), newStatus));
    }
}
