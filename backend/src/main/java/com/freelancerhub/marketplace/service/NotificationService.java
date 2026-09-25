package com.freelancerhub.marketplace.service;

import com.freelancerhub.marketplace.dto.NotificationDto;
import com.freelancerhub.marketplace.entity.Notification;
import com.freelancerhub.marketplace.entity.User;
import com.freelancerhub.marketplace.exception.ResourceNotFoundException;
import com.freelancerhub.marketplace.repository.NotificationRepository;
import com.freelancerhub.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Create a notification for a recipient. Best-effort: runs in its OWN
     * transaction (REQUIRES_NEW) so a notification failure can never roll back
     * or poison the caller's transaction (e.g. sending a message).
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void notify(User recipient, Notification.NotificationType type, String message, String link) {
        try {
            Notification n = Notification.builder()
                    .recipient(recipient)
                    .type(type)
                    .message(message)
                    .link(link)
                    .read(false)
                    .build();
            notificationRepository.save(n);
        } catch (Exception e) {
            // Notifications should never break the main flow
            log.warn("Failed to create notification for user {}: {}", recipient.getEmail(), e.getMessage());
        }
    }

    public List<NotificationDto> getMyNotifications(String email, int limit) {
        User user = findUser(email);
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, limit))
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(String email) {
        User user = findUser(email);
        return notificationRepository.countByRecipientIdAndReadFalse(user.getId());
    }

    @Transactional
    public void markRead(Long id, String email) {
        User user = findUser(email);
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getRecipient().getId().equals(user.getId())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllRead(String email) {
        User user = findUser(email);
        notificationRepository.markAllReadForRecipient(user.getId());
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private NotificationDto mapToDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType().name())
                .message(n.getMessage())
                .link(n.getLink())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
