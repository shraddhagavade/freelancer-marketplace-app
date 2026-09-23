package com.freelancerhub.marketplace.service;

import com.freelancerhub.marketplace.dto.CreateReviewRequest;
import com.freelancerhub.marketplace.dto.ReviewDto;
import com.freelancerhub.marketplace.entity.Project;
import com.freelancerhub.marketplace.entity.Proposal;
import com.freelancerhub.marketplace.entity.Review;
import com.freelancerhub.marketplace.entity.User;
import com.freelancerhub.marketplace.exception.BadRequestException;
import com.freelancerhub.marketplace.exception.DuplicateResourceException;
import com.freelancerhub.marketplace.exception.ResourceNotFoundException;
import com.freelancerhub.marketplace.repository.FreelancerProfileRepository;
import com.freelancerhub.marketplace.repository.ProjectRepository;
import com.freelancerhub.marketplace.repository.ProposalRepository;
import com.freelancerhub.marketplace.repository.ReviewRepository;
import com.freelancerhub.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProjectRepository projectRepository;
    private final ProposalRepository proposalRepository;
    private final UserRepository userRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;

    /**
     * A client leaves a review for the freelancer who completed their project.
     * Rules:
     *  - only the project owner (client) can review
     *  - the project must be COMPLETED
     *  - one review per project
     *  - the freelancer reviewed is the one whose proposal was ACCEPTED
     */
    @Transactional
    public ReviewDto createReview(Long projectId, String clientEmail, CreateReviewRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        if (!project.getClient().getEmail().equals(clientEmail)) {
            throw new BadRequestException("Only the project owner can leave a review");
        }

        if (project.getStatus() != Project.ProjectStatus.COMPLETED) {
            throw new BadRequestException("You can only review a project after it is completed");
        }

        if (reviewRepository.existsByProjectId(projectId)) {
            throw new DuplicateResourceException("This project has already been reviewed");
        }

        // The reviewed freelancer is the one whose proposal was accepted
        Proposal accepted = proposalRepository.findByProjectId(projectId).stream()
                .filter(p -> p.getStatus() == Proposal.ProposalStatus.ACCEPTED)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("No accepted freelancer found for this project"));

        User freelancer = accepted.getFreelancer();

        Review review = Review.builder()
                .project(project)
                .reviewer(project.getClient())
                .freelancer(freelancer)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        reviewRepository.save(review);

        // Recompute the freelancer's average rating from all their reviews
        recomputeAverageRating(freelancer.getId());

        log.info("Review created for project '{}' - {} stars for freelancer {}",
                project.getTitle(), request.getRating(), freelancer.getEmail());

        return mapToDto(review);
    }

    public List<ReviewDto> getFreelancerReviews(Long freelancerId) {
        return reviewRepository.findByFreelancerIdOrderByCreatedAtDesc(freelancerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /** Returns the review for a project, or null if none yet. */
    public ReviewDto getProjectReview(Long projectId) {
        return reviewRepository.findByProjectId(projectId)
                .map(this::mapToDto)
                .orElse(null);
    }

    private void recomputeAverageRating(Long freelancerId) {
        List<Review> reviews = reviewRepository.findByFreelancerIdOrderByCreatedAtDesc(freelancerId);
        if (reviews.isEmpty()) return;

        double avg = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        // round to 1 decimal
        double rounded = Math.round(avg * 10.0) / 10.0;

        freelancerProfileRepository.findByUserId(freelancerId).ifPresent(fp -> {
            fp.setAverageRating(rounded);
            freelancerProfileRepository.save(fp);
        });
    }

    private ReviewDto mapToDto(Review r) {
        return ReviewDto.builder()
                .id(r.getId())
                .projectId(r.getProject().getId())
                .projectTitle(r.getProject().getTitle())
                .reviewerId(r.getReviewer().getId())
                .reviewerName(r.getReviewer().getFirstName() + " " + r.getReviewer().getLastName())
                .reviewerAvatarUrl(r.getReviewer().getAvatarUrl())
                .freelancerId(r.getFreelancer().getId())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
