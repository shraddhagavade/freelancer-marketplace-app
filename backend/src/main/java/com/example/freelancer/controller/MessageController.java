package com.example.freelancer.controller;

import com.example.freelancer.dto.MessageResponse;
import com.example.freelancer.dto.SendMessageRequest;
import com.example.freelancer.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    public MessageResponse send(@Valid @RequestBody SendMessageRequest req, Authentication authentication) {
        return messageService.send(req, authentication.getName());
    }

    @GetMapping("/task/{taskId}")
    public List<MessageResponse> listForTask(@PathVariable UUID taskId, Authentication authentication) {
        return messageService.listForTask(taskId, authentication.getName());
    }
}
