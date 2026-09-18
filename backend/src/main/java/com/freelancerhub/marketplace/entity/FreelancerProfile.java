package com.freelancerhub.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "freelancer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FreelancerProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 200)
    private String title; // e.g. "Senior Full-Stack Developer"

    @Column(length = 2000)
    private String overview;

    private BigDecimal hourlyRate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private ExperienceLevel experienceLevel = ExperienceLevel.INTERMEDIATE;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private Availability availability = Availability.FULL_TIME;

    private Integer yearsOfExperience;

    @Column(length = 500)
    private String portfolioUrl;

    @Column(length = 200)
    private String linkedinUrl;

    @Column(length = 200)
    private String githubUrl;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "freelancer_skills",
            joinColumns = @JoinColumn(name = "profile_id"),
            inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    @Builder.Default
    private Set<Skill> skills = new HashSet<>();

    private Double averageRating;

    @Builder.Default
    private Integer totalProjects = 0;

    @Builder.Default
    private Integer completedProjects = 0;

    public enum ExperienceLevel {
        ENTRY,
        INTERMEDIATE,
        EXPERT
    }

    public enum Availability {
        FULL_TIME,
        PART_TIME,
        CONTRACT,
        NOT_AVAILABLE
    }
}
