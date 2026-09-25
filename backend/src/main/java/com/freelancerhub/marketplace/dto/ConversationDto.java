package com.freelancerhub.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A summary row in the conversation list (the "other" user + last message). */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConversationDto {
    private Long otherUserId;
    private String otherUserName;
    private String otherUserAvatarUrl;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
}
