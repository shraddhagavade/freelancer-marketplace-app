package com.freelancerhub.marketplace.repository;

import com.freelancerhub.marketplace.entity.PortfolioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortfolioItemRepository extends JpaRepository<PortfolioItem, Long> {

    List<PortfolioItem> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}
