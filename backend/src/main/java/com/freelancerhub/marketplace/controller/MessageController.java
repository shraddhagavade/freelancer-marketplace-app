package com.freelancerhub.marketplace.controller;

import com.freelancerhub.marketplace.dto.ConversationDto;
import com.freelancerhub.marketplace.dto.MessageDto;
import com.freelancerhub.marketplace.dto.SendMessageRequest;
import com.freelancerhub.marketplace.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    // Send a message
    @PostMapping
    public ResponseEntity<MessageDto> send(Authentication auth, @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.ok(messageService.send(auth.getName(), request));
    }

    // My conversation list
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto>> conversations(Authentication auth) {
        return ResponseEntity.ok(messageService.getConversations(auth.getName()));
    }

    // The thread with a specific user
    @GetMapping("/thread/{otherUserId}")
    public ResponseEntity<List<MessageDto>> thread(@PathVariable Long otherUserId, Authentication auth) {
        return ResponseEntity.ok(messageService.getThread(auth.getName(), otherUserId));
    }

    // Total unread messages
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(Authentication auth) {
        return ResponseEntity.ok(Map.of("count", messageService.getUnreadCount(auth.getName())));
    }
}
