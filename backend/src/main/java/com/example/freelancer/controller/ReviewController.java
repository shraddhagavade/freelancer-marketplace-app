package com.example.freelancer.controller;

import com.example.freelancer.dto.CreateReviewRequest;
import com.example.freelancer.dto.ReviewResponse;
import com.example.freelancer.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ReviewResponse create(@Valid @RequestBody CreateReviewRequest req, Authentication authentication) {
        return reviewService.create(req, authentication.getName());
    }
}
