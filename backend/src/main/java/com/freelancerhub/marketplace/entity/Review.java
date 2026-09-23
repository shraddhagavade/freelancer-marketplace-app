package com.freelancerhub.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * A review left by a client for a freelancer after a project is completed.
 * One review per project (unique constraint).
 */
@Entity
@Table(name = "reviews", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"project_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** The client who wrote the review. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    /** The freelancer being reviewed. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "freelancer_id", nullable = false)
    private User freelancer;

    /** 1 to 5 stars. */
    @Column(nullable = false)
    private Integer rating;

    @Column(length = 2000)
    private String comment;
}
