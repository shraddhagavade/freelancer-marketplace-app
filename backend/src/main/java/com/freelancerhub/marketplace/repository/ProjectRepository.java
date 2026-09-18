package com.freelancerhub.marketplace.repository;

import com.freelancerhub.marketplace.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    Page<Project> findByStatus(Project.ProjectStatus status, Pageable pageable);

    List<Project> findByClientId(Long clientId);

    /**
     * Native query with explicit text casts so PostgreSQL can infer parameter types
     * even when they are NULL (avoids "function lower(bytea) does not exist").
     */
    @Query(value = "SELECT * FROM projects p WHERE p.status = :status " +
            "AND (CAST(:keyword AS text) IS NULL " +
            "     OR LOWER(p.title) LIKE LOWER('%' || CAST(:keyword AS text) || '%') " +
            "     OR LOWER(p.description) LIKE LOWER('%' || CAST(:keyword AS text) || '%')) " +
            "AND (CAST(:categoryId AS bigint) IS NULL OR p.category_id = :categoryId) " +
            "AND (CAST(:minBudget AS numeric) IS NULL OR p.budget >= :minBudget) " +
            "AND (CAST(:maxBudget AS numeric) IS NULL OR p.budget <= :maxBudget) " +
            "ORDER BY p.created_at DESC",
            countQuery = "SELECT count(*) FROM projects p WHERE p.status = :status " +
            "AND (CAST(:keyword AS text) IS NULL " +
            "     OR LOWER(p.title) LIKE LOWER('%' || CAST(:keyword AS text) || '%') " +
            "     OR LOWER(p.description) LIKE LOWER('%' || CAST(:keyword AS text) || '%')) " +
            "AND (CAST(:categoryId AS bigint) IS NULL OR p.category_id = :categoryId) " +
            "AND (CAST(:minBudget AS numeric) IS NULL OR p.budget >= :minBudget) " +
            "AND (CAST(:maxBudget AS numeric) IS NULL OR p.budget <= :maxBudget)",
            nativeQuery = true)
    Page<Project> searchProjects(
            @Param("status") String status,
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("minBudget") BigDecimal minBudget,
            @Param("maxBudget") BigDecimal maxBudget,
            Pageable pageable
    );
}
