package com.freelancerhub.marketplace.config;

import com.freelancerhub.marketplace.entity.Category;
import com.freelancerhub.marketplace.entity.Role;
import com.freelancerhub.marketplace.entity.Skill;
import com.freelancerhub.marketplace.repository.CategoryRepository;
import com.freelancerhub.marketplace.repository.RoleRepository;
import com.freelancerhub.marketplace.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final CategoryRepository categoryRepository;
    private final SkillRepository skillRepository;

    @Override
    public void run(String... args) {
        seedRoles();
        seedCategoriesAndSkills();
    }

    private void seedRoles() {
        for (Role.RoleName roleName : Role.RoleName.values()) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                roleRepository.save(Role.builder().name(roleName).build());
                log.info("Created role: {}", roleName);
            }
        }
    }

    private void seedCategoriesAndSkills() {
        Map<String, List<String>> categorySkills = Map.of(
                "Web Development", List.of("React", "Angular", "Vue.js", "Node.js", "Spring Boot", "Django", "Laravel", "HTML/CSS", "TypeScript", "Next.js"),
                "Mobile Development", List.of("React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android"),
                "UI/UX Design", List.of("Figma", "Adobe XD", "Sketch", "Wireframing", "Prototyping", "User Research"),
                "Data Science", List.of("Python", "Machine Learning", "TensorFlow", "Data Analysis", "SQL", "R", "Pandas"),
                "DevOps & Cloud", List.of("AWS", "Azure", "Docker", "Kubernetes", "CI/CD", "Terraform", "Linux"),
                "AI & Machine Learning", List.of("NLP", "Computer Vision", "Deep Learning", "PyTorch", "OpenAI API"),
                "Backend Development", List.of("Java", "Go", "Rust", "C#", ".NET", "Microservices", "REST API", "GraphQL"),
                "Database", List.of("PostgreSQL", "MongoDB", "MySQL", "Redis", "Elasticsearch"),
                "Blockchain", List.of("Solidity", "Web3", "Smart Contracts", "Ethereum", "DeFi")
        );

        categorySkills.forEach((categoryName, skills) -> {
            if (categoryRepository.existsByName(categoryName)) return;

            Category category = Category.builder()
                    .name(categoryName)
                    .description(categoryName + " related skills and projects")
                    .build();
            categoryRepository.save(category);
            log.info("Created category: {}", categoryName);

            for (String skillName : skills) {
                if (!skillRepository.existsByName(skillName)) {
                    skillRepository.save(Skill.builder().name(skillName).category(category).build());
                }
            }
            log.info("Seeded {} skills for category: {}", skills.size(), categoryName);
        });
    }
}
