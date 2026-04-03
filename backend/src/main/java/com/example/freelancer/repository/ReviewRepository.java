package com.example.freelancer.repository;
import com.example.freelancer.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface ReviewRepository extends JpaRepository<Review, UUID> { }
