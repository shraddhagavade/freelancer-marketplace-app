package com.example.freelancer.repository;
import com.example.freelancer.domain.Message;
import com.example.freelancer.domain.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findByTaskOrderByCreatedAtAsc(Task task);
}
