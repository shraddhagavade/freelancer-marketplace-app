package com.example.freelancer.service;

import com.example.freelancer.domain.*;
import com.example.freelancer.dto.*;
import com.example.freelancer.exception.*;
import com.example.freelancer.repository.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final TaskService taskService;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository, TaskService taskService, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.taskService = taskService;
        this.userRepository = userRepository;
    }

    public ReviewResponse create(CreateReviewRequest req, String reviewerEmail) {
        Task task = taskService.getTask(req.taskId());
        User reviewer = userRepository.findByEmail(reviewerEmail).orElseThrow(() -> new NotFoundException("Reviewer not found"));
        User reviewee = userRepository.findById(req.revieweeId()).orElseThrow(() -> new NotFoundException("Reviewee not found"));

        if (task.getStatus() != TaskStatus.COMPLETED && task.getStatus() != TaskStatus.IN_PROGRESS) {
            throw new BadRequestException("Task must be in progress or completed for reviews");
        }

        Review review = Review.builder()
                .id(UUID.randomUUID())
                .task(task)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(req.rating())
                .comment(req.comment())
                .createdAt(Instant.now())
                .build();

        Review saved = reviewRepository.save(review);
        return new ReviewResponse(saved.getId(), task.getId(), reviewer.getId(), reviewee.getId(), saved.getRating(), saved.getComment(), saved.getCreatedAt());
    }
}
