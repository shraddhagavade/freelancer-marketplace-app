package com.example.freelancer.service;

import com.example.freelancer.domain.Task;
import com.example.freelancer.domain.TaskStatus;
import com.example.freelancer.domain.User;
import com.example.freelancer.domain.UserRole;
import com.example.freelancer.repository.ApplicationRepository;
import com.example.freelancer.repository.TaskRepository;
import com.example.freelancer.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks
    private TaskService taskService;

    @Test
    void listTasksReturnsClientOwnedTasks() {
        User client = User.builder()
                .id(UUID.randomUUID())
                .fullName("Client Demo")
                .email("client@example.com")
                .passwordHash("hash")
                .role(UserRole.CLIENT)
                .createdAt(Instant.now())
                .build();

        Task task = Task.builder()
                .id(UUID.randomUUID())
                .title("Landing page refresh")
                .description("Refresh the hero and call-to-action sections.")
                .budget(new BigDecimal("25000.00"))
                .status(TaskStatus.OPEN)
                .progressPercent(0)
                .client(client)
                .createdAt(Instant.now())
                .build();

        when(userRepository.findByEmail("client@example.com")).thenReturn(Optional.of(client));
        when(taskRepository.findByClient_EmailIgnoreCase(eq("client@example.com"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(task)));

        Page<?> result = taskService.listTasks(0, 10, "client@example.com");

        assertThat(result.getContent()).hasSize(1);
        verify(taskRepository).findByClient_EmailIgnoreCase(eq("client@example.com"), any(Pageable.class));
    }
}
