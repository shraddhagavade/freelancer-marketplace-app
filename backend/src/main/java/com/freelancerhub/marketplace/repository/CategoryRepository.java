package com.freelancerhub.marketplace.repository;

import com.freelancerhub.marketplace.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByName(String name);

    Boolean existsByName(String name);

    @Query("SELECT DISTINCT c FROM Category c LEFT JOIN FETCH c.skills")
    List<Category> findAllWithSkills();
}
