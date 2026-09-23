package com.freelancerhub.marketplace.repository;

import com.freelancerhub.marketplace.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByFreelancerIdOrderByCreatedAtDesc(Long freelancerId);

    Optional<Review> findByProjectId(Long projectId);

    boolean existsByProjectId(Long projectId);
}
