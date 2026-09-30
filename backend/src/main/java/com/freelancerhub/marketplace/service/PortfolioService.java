package com.freelancerhub.marketplace.service;

import com.freelancerhub.marketplace.dto.PortfolioItemDto;
import com.freelancerhub.marketplace.entity.PortfolioItem;
import com.freelancerhub.marketplace.entity.User;
import com.freelancerhub.marketplace.exception.BadRequestException;
import com.freelancerhub.marketplace.exception.ResourceNotFoundException;
import com.freelancerhub.marketplace.repository.PortfolioItemRepository;
import com.freelancerhub.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioService {

    private final PortfolioItemRepository portfolioItemRepository;
    private final UserRepository userRepository;

    /** Public: portfolio items for a given freelancer (by USER id). */
    public List<PortfolioItemDto> getPortfolio(Long userId) {
        return portfolioItemRepository.findByOwnerIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PortfolioItemDto addItem(String email, PortfolioItemDto dto) {
        User owner = findUser(email);
        PortfolioItem item = PortfolioItem.builder()
                .owner(owner)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .projectUrl(dto.getProjectUrl())
                .build();
        portfolioItemRepository.save(item);
        return mapToDto(item);
    }

    @Transactional
    public PortfolioItemDto updateItem(String email, Long id, PortfolioItemDto dto) {
        User owner = findUser(email);
        PortfolioItem item = portfolioItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PortfolioItem", "id", id));
        if (!item.getOwner().getId().equals(owner.getId())) {
            throw new BadRequestException("You can only edit your own portfolio items");
        }
        if (dto.getTitle() != null) item.setTitle(dto.getTitle());
        item.setDescription(dto.getDescription());
        item.setImageUrl(dto.getImageUrl());
        item.setProjectUrl(dto.getProjectUrl());
        portfolioItemRepository.save(item);
        return mapToDto(item);
    }

    @Transactional
    public void deleteItem(String email, Long id) {
        User owner = findUser(email);
        PortfolioItem item = portfolioItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PortfolioItem", "id", id));
        if (!item.getOwner().getId().equals(owner.getId())) {
            throw new BadRequestException("You can only delete your own portfolio items");
        }
        portfolioItemRepository.delete(item);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private PortfolioItemDto mapToDto(PortfolioItem item) {
        return PortfolioItemDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .imageUrl(item.getImageUrl())
                .projectUrl(item.getProjectUrl())
                .build();
    }
}
