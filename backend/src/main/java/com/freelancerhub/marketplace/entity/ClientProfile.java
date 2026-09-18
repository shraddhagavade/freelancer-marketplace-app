package com.freelancerhub.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "client_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 200)
    private String companyName;

    @Column(length = 100)
    private String industry;

    @Column(length = 500)
    private String companyWebsite;

    @Column(length = 2000)
    private String description;

    @Column(length = 200)
    private String location;

    @Builder.Default
    private Integer totalProjectsPosted = 0;

    @Builder.Default
    private BigDecimal totalSpent = BigDecimal.ZERO;

    private Double averageRating;
}
