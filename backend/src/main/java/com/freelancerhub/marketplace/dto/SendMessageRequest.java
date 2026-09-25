package com.freelancerhub.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotNull(message = "Recipient is required")
    private Long recipientId;

    @NotBlank(message = "Message cannot be empty")
    @Size(max = 4000, message = "Message is too long")
    private String content;
}
