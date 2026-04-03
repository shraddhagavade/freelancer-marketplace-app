package com.example.freelancer.repository;
import com.example.freelancer.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ApplicationRepository extends JpaRepository<Application, UUID> {
  boolean existsByTaskAndFreelancer(Task task, User freelancer);
  List<Application> findByTask(Task task);
  Optional<Application> findByTaskAndStatus(Task task, ApplicationStatus status);
}
