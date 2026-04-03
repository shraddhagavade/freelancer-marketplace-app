package com.example.freelancer.repository;
import com.example.freelancer.domain.Task;
import com.example.freelancer.domain.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;
import java.util.Collection;

public interface TaskRepository extends JpaRepository<Task, UUID> {
  Page<Task> findByClient_EmailIgnoreCase(String email, Pageable pageable);
  Page<Task> findByStatusIn(Collection<TaskStatus> statuses, Pageable pageable);
}
