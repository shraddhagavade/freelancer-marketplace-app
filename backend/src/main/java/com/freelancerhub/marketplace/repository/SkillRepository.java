package com.freelancerhub.marketplace.repository;

import com.freelancerhub.marketplace.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {

    Optional<Skill> findByName(String name);

    List<Skill> findByCategoryId(Long categoryId);

    List<Skill> findByNameContainingIgnoreCase(String keyword);

    Boolean existsByName(String name);
}
