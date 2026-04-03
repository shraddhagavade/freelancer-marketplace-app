package com.example.freelancer.service;

import com.example.freelancer.domain.*;
import com.example.freelancer.dto.*;
import com.example.freelancer.exception.*;
import com.example.freelancer.repository.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final TaskService taskService;
    private final ApplicationRepository applicationRepository;

    public MessageService(MessageRepository messageRepository, UserRepository userRepository, TaskService taskService, ApplicationRepository applicationRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.taskService = taskService;
        this.applicationRepository = applicationRepository;
    }

    public MessageResponse send(SendMessageRequest req, String senderEmail) {
        Task task = taskService.getTask(req.taskId());
        User sender = userRepository.findByEmail(senderEmail).orElseThrow(() -> new NotFoundException("Sender not found"));
        User receiver = userRepository.findById(req.receiverId()).orElseThrow(() -> new NotFoundException("Receiver not found"));

        validateMessagingParticipants(task, sender, receiver);

        Message message = Message.builder()
                .id(UUID.randomUUID())
                .task(task)
                .sender(sender)
                .receiver(receiver)
                .content(req.content())
                .createdAt(Instant.now())
                .build();

        Message saved = messageRepository.save(message);
        return toResponse(saved);
    }

    public List<MessageResponse> listForTask(UUID taskId, String requesterEmail) {
        Task task = taskService.getTask(taskId);
        User requester = userRepository.findByEmail(requesterEmail).orElseThrow(() -> new NotFoundException("User not found"));
        validateTaskParticipant(task, requester);

        return messageRepository.findByTaskOrderByCreatedAtAsc(task).stream()
                .map(this::toResponse)
                .toList();
    }

    private void validateMessagingParticipants(Task task, User sender, User receiver) {
        validateTaskParticipant(task, sender);
        validateTaskParticipant(task, receiver);

        boolean senderIsClient = task.getClient().getId().equals(sender.getId());
        boolean receiverIsClient = task.getClient().getId().equals(receiver.getId());
        if (senderIsClient == receiverIsClient) {
            throw new ForbiddenException("Messages are only allowed between the task client and accepted freelancer");
        }
    }

    private void validateTaskParticipant(Task task, User user) {
        boolean isClient = task.getClient().getId().equals(user.getId());
        boolean isAcceptedFreelancer = applicationRepository.findByTaskAndStatus(task, ApplicationStatus.ACCEPTED)
                .map(application -> application.getFreelancer().getId().equals(user.getId()))
                .orElse(false);

        if (!isClient && !isAcceptedFreelancer) {
            throw new ForbiddenException("Only the task client and accepted freelancer can access these messages");
        }
    }

    private MessageResponse toResponse(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getTask().getId(),
                message.getSender().getId(),
                message.getSender().getFullName(),
                message.getReceiver().getId(),
                message.getReceiver().getFullName(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
