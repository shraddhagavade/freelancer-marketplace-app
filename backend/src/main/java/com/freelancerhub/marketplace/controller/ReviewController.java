package com.freelancerhub.marketplace.controller;

import com.freelancerhub.marketplace.dto.CreateReviewRequest;
import com.freelancerhub.marketplace.dto.ReviewDto;
import com.freelancerhub.marketplace.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // CLIENT: leave a review after a project is completed
    @PostMapping("/projects/{projectId}/reviews")
    public ResponseEntity<ReviewDto> createReview(
            @PathVariable Long projectId,
            Authentication auth,
            @Valid @RequestBody CreateReviewRequest request) {
        ReviewDto review = reviewService.createReview(projectId, auth.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }

    // PUBLIC: all reviews for a freelancer (by USER id)
    @GetMapping("/freelancers/{freelancerId}/reviews")
    public ResponseEntity<List<ReviewDto>> getFreelancerReviews(@PathVariable Long freelancerId) {
        return ResponseEntity.ok(reviewService.getFreelancerReviews(freelancerId));
    }

    // PUBLIC: the review for a project (null if none)
    @GetMapping("/projects/{projectId}/review")
    public ResponseEntity<ReviewDto> getProjectReview(@PathVariable Long projectId) {
        return ResponseEntity.ok(reviewService.getProjectReview(projectId));
    }
}
