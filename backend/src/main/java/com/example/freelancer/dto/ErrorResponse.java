package com.example.freelancer.dto;
import java.time.Instant;
public record ErrorResponse(String message, Instant timestamp) {}
