package com.freelancerhub.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * A single portfolio / work-sample entry owned by a freelancer (User).
 */
@Entity
@Table(name = "portfolio_items", indexes = {
        @Index(name = "idx_portfolio_owner", columnList = "owner_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 1000)
    private String description;

    /** Base64 image or an image URL (TEXT to allow base64 like avatars). */
    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    /** Optional external link to the live work / repo. */
    @Column(length = 500)
    private String projectUrl;
}
