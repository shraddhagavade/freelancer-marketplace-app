package com.freelancerhub.marketplace.repository;

import com.freelancerhub.marketplace.entity.FreelancerProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface FreelancerProfileRepository extends JpaRepository<FreelancerProfile, Long> {

    Optional<FreelancerProfile> findByUserId(Long userId);

    @Query("SELECT fp FROM FreelancerProfile fp JOIN fp.skills s WHERE s.name IN :skills")
    List<FreelancerProfile> findBySkills(@Param("skills") List<String> skills);

    @Query("SELECT fp FROM FreelancerProfile fp WHERE fp.availability = :availability")
    List<FreelancerProfile> findByAvailability(@Param("availability") FreelancerProfile.Availability availability);

    /**
     * Directory search. Only returns profiles that have been set up (title not null).
     * Native query with explicit casts so PostgreSQL can infer parameter types when NULL.
     */
    @Query(value = "SELECT DISTINCT fp.* FROM freelancer_profiles fp " +
            "LEFT JOIN freelancer_skills fs ON fp.id = fs.profile_id " +
            "LEFT JOIN skills s ON s.id = fs.skill_id " +
            "WHERE fp.title IS NOT NULL " +
            "AND (CAST(:keyword AS text) IS NULL " +
            "     OR LOWER(fp.title) LIKE LOWER('%' || CAST(:keyword AS text) || '%') " +
            "     OR LOWER(fp.overview) LIKE LOWER('%' || CAST(:keyword AS text) || '%') " +
            "     OR LOWER(s.name) LIKE LOWER('%' || CAST(:keyword AS text) || '%')) " +
            "AND (CAST(:experienceLevel AS text) IS NULL OR fp.experience_level = CAST(:experienceLevel AS text)) " +
            "AND (CAST(:availability AS text) IS NULL OR fp.availability = CAST(:availability AS text)) " +
            "AND (CAST(:maxRate AS numeric) IS NULL OR fp.hourly_rate <= :maxRate) " +
            "ORDER BY fp.updated_at DESC",
            countQuery = "SELECT count(DISTINCT fp.id) FROM freelancer_profiles fp " +
            "LEFT JOIN freelancer_skills fs ON fp.id = fs.profile_id " +
            "LEFT JOIN skills s ON s.id = fs.skill_id " +
            "WHERE fp.title IS NOT NULL " +
            "AND (CAST(:keyword AS text) IS NULL " +
            "     OR LOWER(fp.title) LIKE LOWER('%' || CAST(:keyword AS text) || '%') " +
            "     OR LOWER(fp.overview) LIKE LOWER('%' || CAST(:keyword AS text) || '%') " +
            "     OR LOWER(s.name) LIKE LOWER('%' || CAST(:keyword AS text) || '%')) " +
            "AND (CAST(:experienceLevel AS text) IS NULL OR fp.experience_level = CAST(:experienceLevel AS text)) " +
            "AND (CAST(:availability AS text) IS NULL OR fp.availability = CAST(:availability AS text)) " +
            "AND (CAST(:maxRate AS numeric) IS NULL OR fp.hourly_rate <= :maxRate)",
            nativeQuery = true)
    Page<FreelancerProfile> searchFreelancers(
            @Param("keyword") String keyword,
            @Param("experienceLevel") String experienceLevel,
            @Param("availability") String availability,
            @Param("maxRate") BigDecimal maxRate,
            Pageable pageable
    );
}
