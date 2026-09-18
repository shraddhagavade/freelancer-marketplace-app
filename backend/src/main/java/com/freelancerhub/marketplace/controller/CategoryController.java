package com.freelancerhub.marketplace.controller;

import com.freelancerhub.marketplace.dto.CategoryDto;
import com.freelancerhub.marketplace.dto.SkillDto;
import com.freelancerhub.marketplace.entity.Category;
import com.freelancerhub.marketplace.entity.Skill;
import com.freelancerhub.marketplace.exception.DuplicateResourceException;
import com.freelancerhub.marketplace.repository.CategoryRepository;
import com.freelancerhub.marketplace.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final SkillRepository skillRepository;

    // ===== PUBLIC: Get all categories =====
    @GetMapping("/categories")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        List<CategoryDto> categories = categoryRepository.findAllWithSkills().stream()
                .map(this::mapCategoryToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }

    // ===== PUBLIC: Get all skills =====
    @GetMapping("/skills")
    public ResponseEntity<List<SkillDto>> getAllSkills() {
        List<SkillDto> skills = skillRepository.findAll().stream()
                .map(this::mapSkillToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(skills);
    }

    // ===== PUBLIC: Get skills by category =====
    @GetMapping("/categories/{id}/skills")
    public ResponseEntity<List<SkillDto>> getSkillsByCategory(@PathVariable Long id) {
        List<SkillDto> skills = skillRepository.findByCategoryId(id).stream()
                .map(this::mapSkillToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(skills);
    }

    // ===== ADMIN: Create category =====
    @PostMapping("/admin/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryDto> createCategory(@RequestBody CategoryDto dto) {
        if (categoryRepository.existsByName(dto.getName())) {
            throw new DuplicateResourceException("Category already exists: " + dto.getName());
        }
        Category category = Category.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .iconUrl(dto.getIconUrl())
                .build();
        categoryRepository.save(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapCategoryToDto(category));
    }

    // ===== ADMIN: Create skill =====
    @PostMapping("/admin/skills")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SkillDto> createSkill(@RequestBody SkillDto dto) {
        if (skillRepository.existsByName(dto.getName())) {
            throw new DuplicateResourceException("Skill already exists: " + dto.getName());
        }
        Category category = null;
        if (dto.getCategoryName() != null) {
            category = categoryRepository.findByName(dto.getCategoryName()).orElse(null);
        }
        Skill skill = Skill.builder()
                .name(dto.getName())
                .category(category)
                .build();
        skillRepository.save(skill);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapSkillToDto(skill));
    }

    // ===== Mappers =====
    private CategoryDto mapCategoryToDto(Category category) {
        List<SkillDto> skills = category.getSkills() != null
                ? category.getSkills().stream().map(this::mapSkillToDto).collect(Collectors.toList())
                : List.of();

        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .iconUrl(category.getIconUrl())
                .skills(skills)
                .build();
    }

    private SkillDto mapSkillToDto(Skill skill) {
        return SkillDto.builder()
                .id(skill.getId())
                .name(skill.getName())
                .categoryName(skill.getCategory() != null ? skill.getCategory().getName() : null)
                .build();
    }
}
