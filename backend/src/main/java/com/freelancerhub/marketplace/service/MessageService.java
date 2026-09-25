package com.freelancerhub.marketplace.service;

import com.freelancerhub.marketplace.dto.ConversationDto;
import com.freelancerhub.marketplace.dto.MessageDto;
import com.freelancerhub.marketplace.dto.SendMessageRequest;
import com.freelancerhub.marketplace.entity.Message;
import com.freelancerhub.marketplace.entity.Notification;
import com.freelancerhub.marketplace.entity.User;
import com.freelancerhub.marketplace.exception.BadRequestException;
import com.freelancerhub.marketplace.exception.ResourceNotFoundException;
import com.freelancerhub.marketplace.repository.MessageRepository;
import com.freelancerhub.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public MessageDto send(String senderEmail, SendMessageRequest request) {
        User sender = findByEmail(senderEmail);
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getRecipientId()));

        if (sender.getId().equals(recipient.getId())) {
            throw new BadRequestException("You cannot message yourself");
        }

        Message message = Message.builder()
                .sender(sender)
                .recipient(recipient)
                .content(request.getContent())
                .read(false)
                .build();
        messageRepository.save(message);

        // Notify the recipient about the new message
        notificationService.notify(
                recipient,
                Notification.NotificationType.NEW_MESSAGE,
                "New message from " + sender.getFirstName() + " " + sender.getLastName(),
                "/messages?with=" + sender.getId());

        return mapToDto(message, sender.getId());
    }

    /** The current user's conversations, most recent first. */
    public List<ConversationDto> getConversations(String email) {
        User me = findByEmail(email);
        List<Message> all = messageRepository.findAllForUser(me.getId()); // newest first

        // Group by the "other" user, keeping the newest message per conversation
        Map<Long, ConversationDto> byOther = new LinkedHashMap<>();
        Map<Long, Long> unreadByOther = new java.util.HashMap<>();

        for (Message m : all) {
            boolean iAmSender = m.getSender().getId().equals(me.getId());
            User other = iAmSender ? m.getRecipient() : m.getSender();
            Long otherId = other.getId();

            // Count unread messages sent TO me
            if (!iAmSender && !m.isRead()) {
                unreadByOther.merge(otherId, 1L, Long::sum);
            }

            // First time we see this other user = newest message (list is newest-first)
            if (!byOther.containsKey(otherId)) {
                byOther.put(otherId, ConversationDto.builder()
                        .otherUserId(otherId)
                        .otherUserName(other.getFirstName() + " " + other.getLastName())
                        .otherUserAvatarUrl(other.getAvatarUrl())
                        .lastMessage(m.getContent())
                        .lastMessageAt(m.getCreatedAt())
                        .unreadCount(0)
                        .build());
            }
        }

        List<ConversationDto> result = new ArrayList<>(byOther.values());
        result.forEach(c -> c.setUnreadCount(unreadByOther.getOrDefault(c.getOtherUserId(), 0L)));
        return result;
    }

    /** The thread between the current user and another user; marks incoming messages read. */
    @Transactional
    public List<MessageDto> getThread(String email, Long otherUserId) {
        User me = findByEmail(email);
        userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", otherUserId));

        List<Message> messages = messageRepository.findConversation(me.getId(), otherUserId);

        // Mark messages sent to me as read
        messageRepository.markThreadRead(me.getId(), otherUserId);

        return messages.stream()
                .map(m -> mapToDto(m, me.getId()))
                .collect(Collectors.toList());
    }

    public long getUnreadCount(String email) {
        User me = findByEmail(email);
        return messageRepository.countByRecipientIdAndReadFalse(me.getId());
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private MessageDto mapToDto(Message m, Long meId) {
        return MessageDto.builder()
                .id(m.getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getFirstName() + " " + m.getSender().getLastName())
                .recipientId(m.getRecipient().getId())
                .content(m.getContent())
                .read(m.isRead())
                .mine(m.getSender().getId().equals(meId))
                .createdAt(m.getCreatedAt())
                .build();
    }
}
