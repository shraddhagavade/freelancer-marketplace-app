package com.example.freelancer.repository;

import com.example.freelancer.domain.Task;
import com.example.freelancer.domain.TaskMilestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskMilestoneRepository extends JpaRepository<TaskMilestone, UUID> {
    List<TaskMilestone> findByTaskOrderBySortOrderAsc(Task task);
    Optional<TaskMilestone> findByIdAndTask(UUID id, Task task);
}
